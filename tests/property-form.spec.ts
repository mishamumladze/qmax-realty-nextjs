import { test, expect, type Page } from "@playwright/test";

const ADMIN_TOKEN = "test-admin-token";

// Use real credentials API, only mock properties API
// function mockCredentialsAPI(page: Page) {
//   page.route("**/api/admin/credentials", async (route) => {
//     console.log("[MOCK] Credentials API intercepted");
//     const request = route.request();
//     const body = await request.postDataJSON();
//     console.log("[MOCK] Credentials body:", body);
//     if (body.username && body.password) {
//       await route.fulfill({
//         status: 200,
//         contentType: "application/json",
//         body: JSON.stringify({ token: ADMIN_TOKEN }),
//       });
//     } else {
//       await route.fulfill({
//         status: 401,
//         contentType: "application/json",
//         body: JSON.stringify({ error: "Invalid credentials" }),
//       });
//     }
//   });
// }

function mockPropertiesAPI(page: Page, existingProperties: Record<string, unknown>[] = []) {
  let properties = [...existingProperties];
  let nextId = properties.length > 0 ? Math.max(...properties.map((p) => Number(p.id))) + 1 : 1;

  page.route("**/api/admin/properties**", async (route) => {
    const request = route.request();
    const method = request.method();
    const authHeader = request.headers()["authorization"];

    // Accept any bearer token: login uses the real credentials API (JWT),
    // so the mock cannot expect a hardcoded test token.
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ properties }),
      });
      return;
    }

    if (method === "POST") {
      const body = await request.postDataJSON();
      const newProperty = {
        id: nextId++,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      properties.push(newProperty);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ property: newProperty }),
      });
      return;
    }

    if (method === "PUT") {
      const body = await request.postDataJSON();
      const index = properties.findIndex((p) => p.id === body.id);
      if (index >= 0) {
        properties[index] = {
          ...properties[index],
          ...body,
          updated_at: new Date().toISOString(),
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ property: properties[index] }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Property not found" }),
        });
      }
      return;
    }

    if (method === "DELETE") {
      const url = new URL(request.url());
      const id = parseInt(url.searchParams.get("id") || "0", 10);
      properties = properties.filter((p) => p.id !== id);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({ error: "Method not allowed" }),
    });
  });
}

async function login(page: Page) {
  // Use the actual login form flow with real credentials
  await page.goto("/admin/login");
  await page.waitForLoadState("domcontentloaded");

  await page.fill("#login-username", "admin");
  await page.fill("#login-password", "qmax-admin-2026");

  // Submit form and wait for any navigation
  await page.click('button:has-text("Sign in")');

  // Wait for navigation to admin dashboard (could be /admin or /en/admin)
  await page.waitForURL(/\/admin$/, { waitUntil: "networkidle", timeout: 15000 });

  await expect(page.locator('button:has-text("Add property")')).toBeVisible({ timeout: 10000 });
}

async function openAddPropertyModal(page: Page) {
  await page.click('button:has-text("Add property")');
  await expect(page.locator('h2:has-text("Add property")')).toBeVisible();
}

async function closeModal(page: Page) {
  await page.click(
    'button[aria-label="Close dialog"], button:has(svg.lucide-x), header button:last-child'
  );
  await expect(page.locator('h2:has-text("Add property")')).toBeHidden();
}

test.describe("Property Form Modal - 5 Tab Structure", () => {
  test.beforeEach(async ({ page }) => {
    mockPropertiesAPI(page);
    await login(page);
  });

  test("opens Add Property modal with 5 tabs visible", async ({ page }) => {
    await openAddPropertyModal(page);

    await expect(page.locator('button[role="tab"]:has-text("General")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Specs")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Amenities")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Media")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("SEO")')).toBeVisible();

    await closeModal(page);
  });

  test("switches between tabs", async ({ page }) => {
    await openAddPropertyModal(page);

    // Fill required title field first
    await page.getByLabel("Title *", { exact: true }).fill("Test Property");

    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.locator("#tabpanel-1")).toBeVisible();
    await expect(page.locator("#tabpanel-0")).toBeHidden();

    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.locator("#tabpanel-2")).toBeVisible();
    await expect(page.locator("#tabpanel-1")).toBeHidden();

    await page.click('button[role="tab"]:has-text("Media")');
    await expect(page.locator("#tabpanel-3")).toBeVisible();
    await expect(page.locator("#tabpanel-2")).toBeHidden();

    await page.click('button[role="tab"]:has-text("SEO")');
    await expect(page.locator("#tabpanel-4")).toBeVisible();
    await expect(page.locator("#tabpanel-3")).toBeHidden();

    await page.click('button[role="tab"]:has-text("General")');
    await expect(page.locator("#tabpanel-0")).toBeVisible();
    await expect(page.locator("#tabpanel-4")).toBeHidden();

    await closeModal(page);
  });

  test("fills General tab required field (title) and validates", async ({ page }) => {
    await openAddPropertyModal(page);

    const titleInput = page.getByLabel("Title *", { exact: true });
    await expect(titleInput).toBeVisible();

    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.getByText("Title * is required.")).toBeVisible();

    await titleInput.fill("Test Property");
    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.locator("#tabpanel-1")).toBeVisible();

    await closeModal(page);
  });

  test("creates a property through all 5 tabs and verifies it appears in admin table", async ({
    page,
  }) => {
    await openAddPropertyModal(page);

    await page.getByLabel("Title *", { exact: true }).fill("E2E Test Property");
    await page.getByLabel("Type", { exact: true }).selectOption("apartment");
    await page.getByLabel("Sale type", { exact: true }).selectOption("for_sale");
    await page.getByLabel("Price", { exact: true }).fill("250000");
    await page.getByLabel("Price type", { exact: true }).selectOption("total");
    await page.getByLabel("Cadastral Code / ID", { exact: true }).fill("01.01.01.001");
    await page.locator("#tabpanel-0").getByLabel("City", { exact: true }).fill("Tbilisi");
    await page.getByLabel("Country", { exact: true }).fill("Georgia");
    await page
      .getByLabel("Description", { exact: true })
      .fill("A beautiful test property created via e2e test.");

    await page.click('button[role="tab"]:has-text("Specs")');
    await page.getByLabel("Sqmt", { exact: true }).fill("120");
    await page.getByLabel("Bedrooms", { exact: true }).fill("2");
    await page.getByLabel("Bathrooms", { exact: true }).fill("2");
    await page.getByLabel("Year built", { exact: true }).fill("2020");
    await page.getByLabel("Renovation Year", { exact: true }).fill("2023");
    await page.getByLabel("Energy Class / Rating", { exact: true }).selectOption("b");
    await page.getByLabel("Building status", { exact: true }).selectOption("ready");
    await page.getByLabel("Condition", { exact: true }).selectOption("excellent");

    await page.click('button[role="tab"]:has-text("Amenities")');
    // Amenities are pill toggles (label + sr-only checkbox with an overlaying
    // icon), so click the pill label instead of checking the checkbox.
    await page.locator("#tabpanel-2 label", { hasText: "Internet" }).click();
    await page.locator("#tabpanel-2 label", { hasText: "Electricity" }).click();
    await page.locator("#tabpanel-2 label", { hasText: "Water supply" }).click();
    await page.getByLabel("Heating type", { exact: true }).selectOption("central");
    await page.getByLabel("Parking type", { exact: true }).selectOption("garage");

    await page.click('button[role="tab"]:has-text("Media")');
    await page.getByLabel("Video URL", { exact: true }).fill("https://example.com/video.mp4");
    await page.getByLabel("Virtual tour URL", { exact: true }).fill("https://example.com/tour");
    await page
      .getByLabel("Floor Plan (URL)", { exact: true })
      .fill("https://example.com/floorplan.png");

    await page.click('button[role="tab"]:has-text("SEO")');
    await page.getByLabel("Meta title", { exact: true }).fill("Test Property - E2E");
    await page.getByLabel("Slug", { exact: true }).fill("e2e-test-property");
    await page
      .getByLabel("Meta description", { exact: true })
      .fill("Test property meta description");

    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('h2:has-text("Add property")')).toBeHidden();

    await expect(page.locator('table >> text="E2E Test Property"')).toBeVisible();
  });

  test("edits an existing property and verifies prefill + save", async ({ page }) => {
    // NOTE: the admin table is seeded from server-side props (real DB), so
    // mock-seeded rows can never appear in it. Instead, create the property
    // through the UI first (mocked POST echoes the payload into table state),
    // then edit that row (mocked PUT).
    await openAddPropertyModal(page);

    await page.getByLabel("Title *", { exact: true }).fill("Existing Property");
    await page.getByLabel("Type", { exact: true }).selectOption("apartment");
    await page.getByLabel("Sale type", { exact: true }).selectOption("for_sale");
    await page.getByLabel("Price", { exact: true }).fill("300000");
    await page.getByLabel("Price type", { exact: true }).selectOption("total");
    await page.locator("#tabpanel-0").getByLabel("City", { exact: true }).fill("Tbilisi");
    await page.getByLabel("Country", { exact: true }).fill("Georgia");
    await page.getByLabel("Cadastral Code / ID", { exact: true }).fill("01.01.01.001");
    await page.getByLabel("Description", { exact: true }).fill("Original description");

    await page.click('button[role="tab"]:has-text("Specs")');
    await page.getByLabel("Sqmt", { exact: true }).fill("100");
    await page.getByLabel("Bedrooms", { exact: true }).fill("1");
    await page.getByLabel("Bathrooms", { exact: true }).fill("1");
    await page.getByLabel("Renovation Year", { exact: true }).fill("2022");
    await page.getByLabel("Energy Class / Rating", { exact: true }).selectOption("b");
    await page.getByLabel("Building status", { exact: true }).selectOption("ready");
    await page.getByLabel("Condition", { exact: true }).selectOption("good");

    await page.click('button[role="tab"]:has-text("Amenities")');
    await page.locator("#tabpanel-2 label", { hasText: "Internet" }).click();

    await page.click('button[role="tab"]:has-text("Media")');
    await page
      .getByLabel("Video URL", { exact: true })
      .fill("https://example.com/original-video.mp4");

    await page.click('button[role="tab"]:has-text("SEO")');
    await page.getByLabel("Meta description", { exact: true }).fill("Original meta");

    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('h2:has-text("Add property")')).toBeHidden();
    await expect(page.locator("table").getByText("Existing Property")).toBeVisible();

    // NOTE: the shared Button component only forwards `ariaLabel` (camelCase),
    // so the table's `aria-label` never reaches the DOM — scope by row instead.
    await page
      .locator("table tr", { hasText: "Existing Property" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await expect(page.locator('h2:has-text("Edit property")')).toBeVisible();

    await expect(page.getByLabel("Title *", { exact: true })).toHaveValue("Existing Property");
    await expect(page.locator("#tabpanel-0").getByLabel("City", { exact: true })).toHaveValue(
      "Tbilisi"
    );
    await expect(page.getByLabel("Price", { exact: true })).toHaveValue("300000");
    await expect(page.getByLabel("Price type", { exact: true })).toHaveValue("total");
    await expect(page.getByLabel("Cadastral Code / ID", { exact: true })).toHaveValue(
      "01.01.01.001"
    );

    await page.getByLabel("Title *", { exact: true }).fill("Updated Property Title");
    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.getByLabel("Sqmt", { exact: true })).toHaveValue("100");
    await page.getByLabel("Sqmt", { exact: true }).fill("150");
    await expect(page.getByLabel("Renovation Year", { exact: true })).toHaveValue("2022");
    await expect(page.getByLabel("Energy Class / Rating", { exact: true })).toHaveValue("b");

    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.getByLabel("Internet", { exact: true })).toBeChecked();
    await page.locator("#tabpanel-2 label", { hasText: "TV" }).click();

    await page.click('button[role="tab"]:has-text("Media")');
    await expect(page.getByLabel("Video URL", { exact: true })).toHaveValue(
      "https://example.com/original-video.mp4"
    );

    await page.click('button[role="tab"]:has-text("SEO")');
    await expect(page.getByLabel("Meta description", { exact: true })).toHaveValue("Original meta");
    // NOTE: meta_title/slug are not sent by the form submit payload, so they
    // cannot round-trip through create; fill only.
    await page.getByLabel("Meta title", { exact: true }).fill("Updated Property Title");

    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('h2:has-text("Edit property")')).toBeHidden();

    await expect(page.locator("table").getByText("Updated Property Title")).toBeVisible();
    await expect(page.locator("table").getByText("Existing Property")).not.toBeVisible();
  });

  test("per-tab validation blocks switching when required fields missing", async ({ page }) => {
    await openAddPropertyModal(page);

    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.getByText("Title * is required.")).toBeVisible();
    await expect(page.locator("#tabpanel-1")).toBeHidden();

    await page.getByLabel("Title *", { exact: true }).fill("Valid Title");
    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.locator("#tabpanel-1")).toBeVisible();

    // Price lives on the General tab and is a number input, which browsers
    // refuse to type letters into — temporarily treat it as text so the
    // app's own numeric validation can be exercised.
    await page.click('button[role="tab"]:has-text("General")');
    const priceInput = page.getByLabel("Price", { exact: true });
    await priceInput.evaluate((el) => el.setAttribute("type", "text"));
    await priceInput.fill("not-a-number");
    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.getByText("Must be a number.")).toBeVisible();
    await expect(page.locator("#tabpanel-0")).toBeVisible();

    await priceInput.fill("100000");
    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.locator("#tabpanel-2")).toBeVisible();

    await closeModal(page);
  });

  test("draft persistence via localStorage key property-form-draft", async ({ page }) => {
    await openAddPropertyModal(page);

    await page.getByLabel("Title *", { exact: true }).fill("Draft Property");
    await page.locator("#tabpanel-0").getByLabel("City", { exact: true }).fill("Batumi");
    await page.getByLabel("Price", { exact: true }).fill("150000");

    await page.click('button[role="tab"]:has-text("Specs")');
    await page.getByLabel("Sqmt", { exact: true }).fill("80");

    // Draft writes are debounced (~500ms), so wait until the latest field
    // has landed before closing the modal (a merely non-null draft may be
    // a stale write from an earlier keystroke).
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("property-form-draft")), {
        timeout: 5000,
      })
      .toContain('"sqmt":"80"');

    await closeModal(page);

    const draft = await page.evaluate(() => localStorage.getItem("property-form-draft"));
    expect(draft).not.toBeNull();

    const parsed = JSON.parse(draft!);
    expect(parsed.fields.title).toBe("Draft Property");
    expect(parsed.fields.city).toBe("Batumi");
    expect(parsed.fields.price).toBe("150000");
    expect(parsed.fields.sqmt).toBe("80");

    await openAddPropertyModal(page);
    await expect(page.getByLabel("Title *", { exact: true })).toHaveValue("Draft Property");
    await expect(page.locator("#tabpanel-0").getByLabel("City", { exact: true })).toHaveValue(
      "Batumi"
    );
    await expect(page.getByLabel("Sqmt", { exact: true })).toHaveValue("80");

    await closeModal(page);
  });

  test("map picker interaction updates lat/lng inputs", async ({ page }) => {
    await openAddPropertyModal(page);

    // "Use my location" geolocate button was removed from the form.
    await expect(page.getByRole("button", { name: "Use my location" })).toHaveCount(0);

    // Scope to the modal dialog: the page can host other maps (e.g. footer).
    const mapContainer = page.getByRole("dialog").locator(".leaflet-container");
    await expect(mapContainer).toBeVisible();

    await mapContainer.click({ position: { x: 300, y: 200 } });

    // The lat/lng inputs are readOnly, so check their value attribute
    const latValue = await page.locator("#map-picker-lat").getAttribute("value");
    const lngValue = await page.locator("#map-picker-lng").getAttribute("value");
    expect(latValue).not.toBe("");
    expect(lngValue).not.toBe("");
    expect(parseFloat(latValue!)).toBeGreaterThan(41);
    expect(parseFloat(latValue!)).toBeLessThan(42);
    expect(parseFloat(lngValue!)).toBeGreaterThan(44);
    expect(parseFloat(lngValue!)).toBeLessThan(45);

    await closeModal(page);
  });

  test("media uploader interaction - upload image and verify cover badge", async ({ page }) => {
    await openAddPropertyModal(page);

    // Fill required title first, otherwise per-tab validation keeps Media hidden.
    await page.getByLabel("Title *", { exact: true }).fill("Test Property");

    await page.click('button[role="tab"]:has-text("Media")');

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeHidden();

    const dropZone = page.locator('[role="button"][aria-label="Upload images"]');
    // The dropzone might be visually hidden but still accessible for file upload
    await expect(dropZone).toBeAttached();

    const testImage = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    await page.setInputFiles('input[type="file"]', {
      name: "test.png",
      mimeType: "image/png",
      buffer: testImage,
    });

    await expect(page.locator('[role="listitem"]')).toBeVisible();
    await expect(page.locator('[role="listitem"] img')).toHaveAttribute("src", /^data:image/);

    // The first uploaded image is automatically marked as cover, so there is
    // no "Set as cover image" button for it — assert the cover state instead.
    await expect(page.locator('[aria-label="Cover image"]')).toBeVisible();
    await expect(page.locator('[role="listitem"] >> text="Cover"')).toBeVisible();

    await closeModal(page);
  });
});
