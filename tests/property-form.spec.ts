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

    if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
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
  await page.click('button[aria-label="Close dialog"], button:has(svg.lucide-x), header button:last-child');
  await expect(page.locator('h2:has-text("Add property")')).toBeHidden();
}

test.describe("Property Form Modal - 4 Tab Structure", () => {
  test.beforeEach(async ({ page }) => {
    mockPropertiesAPI(page);
    await login(page);
  });

  test("opens Add Property modal with 4 tabs visible", async ({ page }) => {
    await openAddPropertyModal(page);

    await expect(page.locator('button[role="tab"]:has-text("General")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Specs")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Amenities")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Media")')).toBeVisible();

    await closeModal(page);
  });

  test("switches between tabs", async ({ page }) => {
    await openAddPropertyModal(page);

    // Fill required title field first
    await page.getByLabel("Title *").fill("Test Property");

    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.locator('#tabpanel-1')).toBeVisible();
    await expect(page.locator('#tabpanel-0')).toBeHidden();

    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.locator('#tabpanel-2')).toBeVisible();
    await expect(page.locator('#tabpanel-1')).toBeHidden();

    await page.click('button[role="tab"]:has-text("Media")');
    await expect(page.locator('#tabpanel-3')).toBeVisible();
    await expect(page.locator('#tabpanel-2')).toBeHidden();

    await page.click('button[role="tab"]:has-text("General")');
    await expect(page.locator('#tabpanel-0')).toBeVisible();
    await expect(page.locator('#tabpanel-3')).toBeHidden();

    await closeModal(page);
  });

  test("fills General tab required field (title) and validates", async ({ page }) => {
    await openAddPropertyModal(page);

    const titleInput = page.getByLabel("Title *");
    await expect(titleInput).toBeVisible();

    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.getByText("Title is required.")).toBeVisible();

    await titleInput.fill("Test Property");
    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.locator('#tabpanel-1')).toBeVisible();

    await closeModal(page);
  });

  test("creates a property through all 4 tabs and verifies it appears in admin table", async ({ page }) => {
    await openAddPropertyModal(page);

    await page.getByLabel("Title *", { exact: true }).fill("E2E Test Property");
    await page.getByLabel("Type", { exact: true }).selectOption("apartment");
    await page.getByLabel("Sale type", { exact: true }).selectOption("for_sale");
    await page.getByLabel("Price").fill("250000");
    await page.getByLabel("City").fill("Tbilisi");
    await page.getByLabel("Country").fill("Georgia");
    await page.getByLabel("Description").fill("A beautiful test property created via e2e test.");
    await page.getByLabel("Meta description").fill("Test property meta description");

    await page.click('button[role="tab"]:has-text("Specs")');
    await page.getByLabel("Sqmt").fill("120");
    await page.getByLabel("Rooms").fill("3");
    await page.getByLabel("Bedrooms").fill("2");
    await page.getByLabel("Bathrooms").fill("2");
    await page.getByLabel("Year built").fill("2020");
    await page.getByLabel("Building status", { exact: true }).selectOption("ready");
    await page.getByLabel("Condition", { exact: true }).selectOption("excellent");

    await page.click('button[role="tab"]:has-text("Amenities")');
    await page.getByLabel("Internet").check();
    await page.getByLabel("Electricity").check();
    await page.getByLabel("Water supply").check();
    await page.getByLabel("Heating type", { exact: true }).selectOption("central");
    await page.getByLabel("Parking type", { exact: true }).selectOption("garage");

    await page.click('button[role="tab"]:has-text("Media")');
    await page.getByLabel("Video URL", { exact: true }).fill("https://example.com/video.mp4");
    await page.getByLabel("Virtual tour URL", { exact: true }).fill("https://example.com/tour");
    await page.getByLabel("Meta title", { exact: true }).fill("Test Property - E2E");
    await page.getByLabel("Slug", { exact: true }).fill("e2e-test-property");

    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('h2:has-text("Add property")')).toBeHidden();

    await expect(page.locator('table >> text="E2E Test Property"')).toBeVisible();
  });

  test("edits an existing property and verifies prefill + save", async ({ page }) => {
    const existingProperty = {
      id: 1,
      title: "Existing Property",
      type: "apartment",
      sale_type: "for_sale",
      price: 300000,
      currency: "EUR",
      city: "Tbilisi",
      country: "Georgia",
      neighborhood: "Vake",
      street_address: "123 Test St",
      region: "Tbilisi",
      description: "Original description",
      meta_description: "Original meta",
      sqmt: 100,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      floor: "2",
      total_floors: 5,
      year_built: 2018,
      building_status: "ready",
      condition: "good",
      project_type: "residential",
      furnishing: "furnished",
      view: ["city"],
      balcony: true,
      balcony_sqmt: 5,
      lot_sqmt: 200,
      ceiling_height: 2.8,
      heating_type: "central",
      hot_water_type: "central",
      parking_type: "garage",
      kitchen_appliances: ["oven", "stove"],
      video_url: "https://example.com/original-video.mp4",
      virtual_tour_url: "https://example.com/original-tour",
      meta_title: "Original Property",
      slug: "original-property",
      listing_status: "published",
      is_featured: true,
      natural_gas: true,
      internet: true,
      water_supply: true,
      electricity: true,
      tv: false,
      sewerage: true,
      elevator: true,
      ac: true,
      security: true,
      coords: [41.7151, 44.8271],
      gallery: [],
      card_image: undefined,
      floor_plan: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Override the properties mock for this test
    mockPropertiesAPI(page, [existingProperty]);
    await page.reload();
    await expect(page.locator('table').getByText("Existing Property")).toBeVisible();

    await page.click('button[aria-label*="Edit Existing Property"]');
    await expect(page.locator('h2:has-text("Edit property")')).toBeVisible();

    await expect(page.getByLabel("Title *")).toHaveValue("Existing Property");
    await expect(page.getByLabel("City")).toHaveValue("Tbilisi");
    await expect(page.getByLabel("Price")).toHaveValue("300000");

    await page.getByLabel("Title *", { exact: true }).fill("Updated Property Title");
    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.getByLabel("Sqmt", { exact: true })).toHaveValue("100");
    await page.getByLabel("Sqmt", { exact: true }).fill("150");

    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.getByLabel("Internet", { exact: true })).toBeChecked();
    await page.getByLabel("TV", { exact: true }).check();

    await page.click('button[role="tab"]:has-text("Media")');
    await expect(page.getByLabel("Video URL", { exact: true })).toHaveValue("https://example.com/original-video.mp4");
    await page.getByLabel("Meta title", { exact: true }).fill("Updated Property Title");

    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('h2:has-text("Edit property")')).toBeHidden();

    await expect(page.locator('table').getByText("Updated Property Title")).toBeVisible();
    await expect(page.locator('table').getByText("Existing Property")).not.toBeVisible();
  });

  test("per-tab validation blocks switching when required fields missing", async ({ page }) => {
    await openAddPropertyModal(page);

    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.locator('#tabpanel-1')).toBeHidden();

    await page.getByLabel("Title *", { exact: true }).fill("Valid Title");
    await page.click('button[role="tab"]:has-text("Specs")');
    await expect(page.locator('#tabpanel-1')).toBeVisible();

    await page.getByLabel("Price", { exact: true }).fill("not-a-number");
    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.getByText("Must be a number.")).toBeVisible();

    await page.getByLabel("Price", { exact: true }).fill("100000");
    await page.click('button[role="tab"]:has-text("Amenities")');
    await expect(page.locator('#tabpanel-2')).toBeVisible();

    await closeModal(page);
  });

  test("draft persistence via localStorage key property-form-draft", async ({ page }) => {
    await openAddPropertyModal(page);

    await page.getByLabel("Title *", { exact: true }).fill("Draft Property");
    await page.getByLabel("City", { exact: true }).fill("Batumi");
    await page.getByLabel("Price", { exact: true }).fill("150000");

    await page.click('button[role="tab"]:has-text("Specs")');
    await page.getByLabel("Sqmt", { exact: true }).fill("80");

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
    await expect(page.getByLabel("City", { exact: true })).toHaveValue("Batumi");
    await expect(page.getByLabel("Sqmt", { exact: true })).toHaveValue("80");

    await closeModal(page);
  });

  test("map picker interaction updates lat/lng inputs", async ({ page }) => {
    await openAddPropertyModal(page);

    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    await mapContainer.click({ position: { x: 300, y: 200 } });

    // The lat/lng inputs are readOnly, so check their value attribute
    const latValue = await page.locator('#map-picker-lat').getAttribute("value");
    const lngValue = await page.locator('#map-picker-lng').getAttribute("value");
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

    await expect(page.locator('button[aria-label="Set as cover image"]')).toBeVisible();
    await page.click('button[aria-label="Set as cover image"]');
    await expect(page.locator('[role="listitem"] >> text="Cover"')).toBeVisible();

    await closeModal(page);
  });
});