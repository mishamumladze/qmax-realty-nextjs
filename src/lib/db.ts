import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";
import { Property } from "@/types/property";
import { MessageSummary, NewsletterSubscriber, PropertyFormData } from "@/types/admin";

const dbPath = path.join(process.cwd(), "data", "qmax.sqlite");

initTables();

const TRANSLATABLE_FIELDS = [
  "title",
  "subtitle",
  "location",
  "neighborhood",
  "city",
  "region",
  "country",
  "meta_description",
  "description",
  "sale_type",
  "floor_plan",
  "card_image",
] as const;

const TRANSLATABLE_LOCALES = ["de", "tr", "ru", "pl"] as const;

function applyTranslations(
  property: Property,
  translationRow: Record<string, unknown> | undefined,
  locale: string
): Property {
  if (!translationRow) return property;

  const result = { ...property };

  for (const field of TRANSLATABLE_FIELDS) {
    const value = translationRow[field];
    if (value !== null && value !== undefined && value !== "") {
      (result as Record<string, unknown>)[field] = value;
      const key = `${field}_${locale}` as keyof Property;
      (result as Record<string, unknown>)[key] = value;
    }
  }

  const inclusionsValue = translationRow.inclusions;
  if (inclusionsValue !== null && inclusionsValue !== undefined) {
    const parsedInclusions = parseJsonArrayColumn(inclusionsValue);
    if (parsedInclusions.length > 0) {
      (result as Record<string, unknown>).inclusions = parsedInclusions;
      const key = `inclusions_${locale}` as keyof Property;
      (result as Record<string, unknown>)[key] = parsedInclusions;
    }
  }

  return result;
}

export function getActiveProperties(locale?: string): Property[] {
  const db = new Database(dbPath);

  const useTranslations =
    locale &&
    locale !== "en" &&
    TRANSLATABLE_LOCALES.includes(locale as (typeof TRANSLATABLE_LOCALES)[number]);

  let stmt: Database.Statement;

  if (useTranslations) {
    stmt = db.prepare(`
      SELECT p.*, t.title as t_title, t.subtitle as t_subtitle, t.location as t_location,
             t.neighborhood as t_neighborhood, t.city as t_city, t.region as t_region,
             t.country as t_country, t.meta_description as t_meta_description,
             t.description as t_description, t.sale_type as t_sale_type,
             t.inclusions as t_inclusions, t.floor_plan as t_floor_plan,
             t.card_image as t_card_image
      FROM properties p
      LEFT JOIN property_translations t ON t.property_id = p.id AND t.locale = ?
      WHERE p.status = 'active'
      ORDER BY p.id ASC
    `);
    return stmt
      .all(locale)
      .map((r) => {
        const row = r as Record<string, unknown>;
        const translationRow = {
          title: row.t_title,
          subtitle: row.t_subtitle,
          location: row.t_location,
          neighborhood: row.t_neighborhood,
          city: row.t_city,
          region: row.t_region,
          country: row.t_country,
          meta_description: row.t_meta_description,
          description: row.t_description,
          sale_type: row.t_sale_type,
          inclusions: row.t_inclusions,
          floor_plan: row.t_floor_plan,
          card_image: row.t_card_image,
        };
        const property = normalizePropertyRow(row);
        return property ? applyTranslations(property, translationRow, locale!) : undefined;
      })
      .filter((p): p is Property => p !== undefined);
  }

  stmt = db.prepare(`
    SELECT * FROM properties 
    WHERE status = 'active'
    ORDER BY id ASC
  `);

  return stmt
    .all()
    .map((r) => normalizePropertyRow(r as Record<string, unknown>))
    .filter((p): p is Property => p !== undefined);
}

export function getPropertyById(id: number, locale?: string): Property | undefined {
  try {
    const db = new Database(dbPath);

    const useTranslations =
      locale &&
      locale !== "en" &&
      TRANSLATABLE_LOCALES.includes(locale as (typeof TRANSLATABLE_LOCALES)[number]);

    let row: Record<string, unknown> | undefined;

    if (useTranslations) {
      const stmt = db.prepare(`
        SELECT p.*, t.title as t_title, t.subtitle as t_subtitle, t.location as t_location,
               t.neighborhood as t_neighborhood, t.city as t_city, t.region as t_region,
               t.country as t_country, t.meta_description as t_meta_description,
               t.description as t_description, t.sale_type as t_sale_type,
               t.inclusions as t_inclusions, t.floor_plan as t_floor_plan,
               t.card_image as t_card_image
        FROM properties p
        LEFT JOIN property_translations t ON t.property_id = p.id AND t.locale = ?
        WHERE p.id = ? AND p.status = 'active'
      `);
      row = stmt.get(locale, id) as Record<string, unknown> | undefined;
    } else {
      const stmt = db.prepare("SELECT * FROM properties WHERE id = ? AND status = 'active'");
      row = stmt.get(id) as Record<string, unknown> | undefined;
    }

    if (!row) return undefined;

    const property = normalizePropertyRow(row);
    if (!property) return undefined;

    if (useTranslations) {
      const translationRow = {
        title: row.t_title,
        subtitle: row.t_subtitle,
        location: row.t_location,
        neighborhood: row.t_neighborhood,
        city: row.t_city,
        region: row.t_region,
        country: row.t_country,
        meta_description: row.t_meta_description,
        description: row.t_description,
        sale_type: row.t_sale_type,
        inclusions: row.t_inclusions,
        floor_plan: row.t_floor_plan,
        card_image: row.t_card_image,
      };
      return applyTranslations(property, translationRow, locale!);
    }

    return property;
  } catch {
    return undefined;
  }
}

export function initTables(): void {
  try {
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const columns = db.prepare("PRAGMA table_info(properties)").all() as { name: string }[];
    const columnNames = columns.map((c) => c.name);

    if (!columnNames.includes("subtitle")) {
      db.exec("ALTER TABLE properties ADD COLUMN subtitle TEXT");
    }
    if (!columnNames.includes("region")) {
      db.exec("ALTER TABLE properties ADD COLUMN region TEXT");
    }
    if (!columnNames.includes("currency")) {
      db.exec("ALTER TABLE properties ADD COLUMN currency TEXT DEFAULT 'USD'");
    }
    if (!columnNames.includes("year_built")) {
      db.exec("ALTER TABLE properties ADD COLUMN year_built INTEGER");
    }
    if (!columnNames.includes("floor")) {
      db.exec("ALTER TABLE properties ADD COLUMN floor TEXT");
    }
    if (!columnNames.includes("parking")) {
      db.exec("ALTER TABLE properties ADD COLUMN parking BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("meta_description")) {
      db.exec("ALTER TABLE properties ADD COLUMN meta_description TEXT");
    }
    if (!columnNames.includes("description")) {
      db.exec("ALTER TABLE properties ADD COLUMN description TEXT");
    }
    if (!columnNames.includes("inclusions")) {
      db.exec("ALTER TABLE properties ADD COLUMN inclusions TEXT");
    }
    if (!columnNames.includes("gallery")) {
      db.exec("ALTER TABLE properties ADD COLUMN gallery TEXT");
    }
    if (!columnNames.includes("floor_plan")) {
      db.exec("ALTER TABLE properties ADD COLUMN floor_plan TEXT");
    }
    if (!columnNames.includes("coordinates")) {
      db.exec("ALTER TABLE properties ADD COLUMN coordinates TEXT");
    }
    if (!columnNames.includes("property_subtype")) {
      db.exec("ALTER TABLE properties ADD COLUMN property_subtype TEXT");
    }
    if (!columnNames.includes("furnishing")) {
      db.exec("ALTER TABLE properties ADD COLUMN furnishing TEXT");
    }
    if (!columnNames.includes("balcony")) {
      db.exec("ALTER TABLE properties ADD COLUMN balcony BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("balcony_sqmt")) {
      db.exec("ALTER TABLE properties ADD COLUMN balcony_sqmt REAL");
    }
    if (!columnNames.includes("lot_sqmt")) {
      db.exec("ALTER TABLE properties ADD COLUMN lot_sqmt REAL");
    }
    if (!columnNames.includes("view")) {
      db.exec("ALTER TABLE properties ADD COLUMN view TEXT");
    }
    if (!columnNames.includes("video_url")) {
      db.exec("ALTER TABLE properties ADD COLUMN video_url TEXT");
    }
    if (!columnNames.includes("virtual_tour_url")) {
      db.exec("ALTER TABLE properties ADD COLUMN virtual_tour_url TEXT");
    }
    if (!columnNames.includes("listing_status")) {
      db.exec("ALTER TABLE properties ADD COLUMN listing_status TEXT DEFAULT 'draft'");
    }
    if (!columnNames.includes("is_featured")) {
      db.exec("ALTER TABLE properties ADD COLUMN is_featured BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("street_address")) {
      db.exec("ALTER TABLE properties ADD COLUMN street_address TEXT");
    }
    if (!columnNames.includes("building_status")) {
      db.exec("ALTER TABLE properties ADD COLUMN building_status TEXT");
    }
    if (!columnNames.includes("condition")) {
      db.exec("ALTER TABLE properties ADD COLUMN condition TEXT");
    }
    if (!columnNames.includes("project_type")) {
      db.exec("ALTER TABLE properties ADD COLUMN project_type TEXT");
    }
    if (!columnNames.includes("ceiling_height")) {
      db.exec("ALTER TABLE properties ADD COLUMN ceiling_height REAL");
    }
    if (!columnNames.includes("heating_type")) {
      db.exec("ALTER TABLE properties ADD COLUMN heating_type TEXT");
    }
    if (!columnNames.includes("hot_water_type")) {
      db.exec("ALTER TABLE properties ADD COLUMN hot_water_type TEXT");
    }
    if (!columnNames.includes("parking_type")) {
      db.exec("ALTER TABLE properties ADD COLUMN parking_type TEXT");
    }
    if (!columnNames.includes("kitchen_appliances")) {
      db.exec("ALTER TABLE properties ADD COLUMN kitchen_appliances TEXT");
    }
    if (!columnNames.includes("total_floors")) {
      db.exec("ALTER TABLE properties ADD COLUMN total_floors INTEGER");
    }
    if (!columnNames.includes("natural_gas")) {
      db.exec("ALTER TABLE properties ADD COLUMN natural_gas BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("internet")) {
      db.exec("ALTER TABLE properties ADD COLUMN internet BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("water_supply")) {
      db.exec("ALTER TABLE properties ADD COLUMN water_supply BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("electricity")) {
      db.exec("ALTER TABLE properties ADD COLUMN electricity BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("tv")) {
      db.exec("ALTER TABLE properties ADD COLUMN tv BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("sewerage")) {
      db.exec("ALTER TABLE properties ADD COLUMN sewerage BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("elevator")) {
      db.exec("ALTER TABLE properties ADD COLUMN elevator BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("ac")) {
      db.exec("ALTER TABLE properties ADD COLUMN ac BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("security")) {
      db.exec("ALTER TABLE properties ADD COLUMN security BOOLEAN DEFAULT 0");
    }

    const indexes = db.prepare("PRAGMA index_list(properties)").all() as { name: string }[];
    const indexNames = indexes.map((i) => i.name);
    if (!indexNames.includes("idx_properties_listing_status")) {
      try {
        db.exec("CREATE INDEX idx_properties_listing_status ON properties(listing_status)");
      } catch {
        // index may already exist
      }
    }
    if (!indexNames.includes("idx_properties_is_featured")) {
      try {
        db.exec("CREATE INDEX idx_properties_is_featured ON properties(is_featured)");
      } catch {
        // index may already exist
      }
    }
    if (!indexNames.includes("idx_properties_city")) {
      try {
        db.exec("CREATE INDEX idx_properties_city ON properties(city)");
      } catch {
        // index may already exist
      }
    }

    const messageColumns = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
    if (!messageColumns.map((c) => c.name).includes("read")) {
      db.exec("ALTER TABLE messages ADD COLUMN read INTEGER DEFAULT 0");
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS property_translations (
        property_id INTEGER NOT NULL,
        locale TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        location TEXT,
        neighborhood TEXT,
        city TEXT,
        region TEXT,
        country TEXT,
        meta_description TEXT,
        description TEXT,
        sale_type TEXT,
        inclusions TEXT,
        floor_plan TEXT,
        card_image TEXT,
        PRIMARY KEY (property_id, locale),
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // silently fail — tables may not be writable
  }
}

export function insertMessage(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): { id: number } | null {
  initTables();
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(
      "INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)"
    );
    const info = stmt.run(
      data.name,
      data.email,
      data.phone ?? null,
      data.subject ?? null,
      data.message
    );
    return { id: info.lastInsertRowid as number };
  } catch {
    return null;
  }
}

export function insertSubscriber(email: string): { success: boolean; alreadyExists: boolean } {
  initTables();
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("INSERT INTO newsletter_subscribers (email) VALUES (?)");
    stmt.run(email);
    return { success: true, alreadyExists: false };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("SQLITE_CONSTRAINT")) {
      return { success: true, alreadyExists: true };
    }
    return { success: false, alreadyExists: false };
  }
}

const JSON_COLUMNS = new Set<string>(["inclusions", "gallery", "coords", "view", "kitchen_appliances"]);

function toColumnValue(
  key: string,
  value: string | number | boolean | string[] | [number, number]
): string | number {
  if (JSON_COLUMNS.has(key)) {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return value as string | number;
}

function parseJsonArrayColumn(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseCoordsColumn(value: unknown): [number, number] | undefined {
  let candidate: unknown = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return undefined;
    }
  }
  if (
    Array.isArray(candidate) &&
    candidate.length === 2 &&
    typeof candidate[0] === "number" &&
    Number.isFinite(candidate[0]) &&
    typeof candidate[1] === "number" &&
    Number.isFinite(candidate[1])
  ) {
    return [candidate[0], candidate[1]];
  }
  if (candidate !== null && typeof candidate === "object") {
    const lat = (candidate as { lat?: unknown }).lat;
    const lng = (candidate as { lng?: unknown }).lng;
    if (
      typeof lat === "number" &&
      Number.isFinite(lat) &&
      typeof lng === "number" &&
      Number.isFinite(lng)
    ) {
      return [lat, lng];
    }
  }
  return undefined;
}

function normalizePropertyRow(row: Record<string, unknown> | undefined): Property | undefined {
  if (!row || typeof row !== "object" || !("id" in row)) return undefined;
  const base = row as Record<string, unknown>;
  const result = {
    ...base,
    inclusions: parseJsonArrayColumn(base.inclusions),
    gallery: parseJsonArrayColumn(base.gallery),
    view: parseJsonArrayColumn(base.view),
    kitchen_appliances: parseJsonArrayColumn(base.kitchen_appliances),
    coords: parseCoordsColumn(base.coords),
  };
  return result as unknown as Property;
}

export function getAllProperties(): Property[] {
  const db = new Database(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM properties
    ORDER BY created_at DESC, id DESC
  `);

  return stmt
    .all()
    .map((r) => normalizePropertyRow(r as Record<string, unknown>))
    .filter((p): p is Property => p !== undefined);
}

export function updateProperty(id: number, data: Partial<PropertyFormData>): Property | null {
  try {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined) as [
      string,
      string | number | boolean | string[] | [number, number],
    ][];

    const db = new Database(dbPath);

    if (entries.length === 0) {
      const stmt = db.prepare("SELECT * FROM properties WHERE id = ?");
      return normalizePropertyRow(stmt.get(id) as Record<string, unknown> | undefined) ?? null;
    }

    const setClauses: string[] = [];
    const values: (string | number)[] = [];
    for (const [key, value] of entries) {
      setClauses.push(`${key} = ?`);
      values.push(toColumnValue(key, value));
    }

    const stmt = db.prepare(`UPDATE properties SET ${setClauses.join(", ")} WHERE id = ?`);
    const info = stmt.run(...values, id);
    if (info.changes === 0) {
      return null;
    }

    const select = db.prepare("SELECT * FROM properties WHERE id = ?");
    return normalizePropertyRow(select.get(id) as Record<string, unknown> | undefined) ?? null;
  } catch {
    return null;
  }
}

export function deleteProperty(id: number): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("DELETE FROM properties WHERE id = ?");
    const info = stmt.run(id);
    return info.changes > 0;
  } catch {
    return false;
  }
}

export function getAllMessages(): MessageSummary[] {
  const db = new Database(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM messages
    ORDER BY created_at DESC
  `);

  return stmt.all() as MessageSummary[];
}

export function getAllNewsletterSubscribers(): NewsletterSubscriber[] {
  const db = new Database(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM newsletter_subscribers
    ORDER BY created_at DESC
  `);

  return stmt.all() as NewsletterSubscriber[];
}

function slugifyTitle(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "property";
}

export function insertProperty(data: PropertyFormData & { slug?: string }): Property | null {
  initTables();
  try {
    const db = new Database(dbPath);

    const slugSource = data.slug && data.slug.trim() ? data.slug : data.title;
    const baseSlug = slugifyTitle(slugSource);
    const slugStmt = db.prepare("SELECT slug FROM properties WHERE slug = ?");
    let slug = baseSlug;
    let suffix = 2;
    while (slugStmt.get(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const candidates: Partial<
      Record<string, string | number | boolean | string[] | [number, number]>
    > = {
      title: data.title,
      type: data.type,
      neighborhood: data.neighborhood,
      city: data.city,
      region: data.region,
      country: data.country,
      rooms: data.rooms,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqmt: data.sqmt,
      price: data.price,
      currency: data.currency,
      sale_type: data.sale_type,
      year_built: data.year_built,
      floor: data.floor,
      meta_description: data.meta_description,
      description: data.description,
      gallery: data.gallery,
      floor_plan: data.floor_plan,
      coords: data.coords,
      card_image: data.card_image,
      property_subtype: data.property_subtype,
      furnishing: data.furnishing,
      balcony: data.balcony,
      balcony_sqmt: data.balcony_sqmt,
      lot_sqmt: data.lot_sqmt,
      view: data.view,
      video_url: data.video_url,
      virtual_tour_url: data.virtual_tour_url,
      listing_status: data.listing_status,
      is_featured: data.is_featured,
      street_address: data.street_address,
      building_status: data.building_status,
      condition: data.condition,
      project_type: data.project_type,
      ceiling_height: data.ceiling_height,
      heating_type: data.heating_type,
      hot_water_type: data.hot_water_type,
      parking_type: data.parking_type,
      kitchen_appliances: data.kitchen_appliances,
      total_floors: data.total_floors,
      natural_gas: data.natural_gas,
      internet: data.internet,
      water_supply: data.water_supply,
      electricity: data.electricity,
      tv: data.tv,
      sewerage: data.sewerage,
      elevator: data.elevator,
      ac: data.ac,
      security: data.security,
    };

    const entries = Object.entries(candidates).filter(
      (entry): entry is [string, string | number | boolean | string[] | [number, number]] =>
        entry[1] !== undefined
    );

    // Column names come from the fixed whitelist above — never from user input.
    const columns = ["slug", ...entries.map(([key]) => key)];
    const values: (string | number)[] = [
      slug,
      ...entries.map(([key, value]) => toColumnValue(key, value)),
    ];

    const placeholders = columns.map(() => "?").join(", ");
    const stmt = db.prepare(
      `INSERT INTO properties (${columns.join(", ")}) VALUES (${placeholders})`
    );
    const info = stmt.run(...values);

    const select = db.prepare("SELECT * FROM properties WHERE id = ?");
    return (
      normalizePropertyRow(
        select.get(info.lastInsertRowid as number) as Record<string, unknown> | undefined
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function deleteMessage(id: number): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("DELETE FROM messages WHERE id = ?");
    const info = stmt.run(id);
    return info.changes > 0;
  } catch {
    return false;
  }
}

export function setMessageRead(id: number, read: boolean): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("UPDATE messages SET read = ? WHERE id = ?");
    const info = stmt.run(read ? 1 : 0, id);
    return info.changes > 0;
  } catch {
    return false;
  }
}

export function deleteSubscriber(id: number): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("DELETE FROM newsletter_subscribers WHERE id = ?");
    const info = stmt.run(id);
    return info.changes > 0;
  } catch {
    return false;
  }
}

export function insertAdminSubscriber(email: string): NewsletterSubscriber | null {
  initTables();
  try {
    const normalized = email.toLowerCase().trim();
    const db = new Database(dbPath);
    // unsub_token is NOT NULL in the live schema — generate one like existing rows.
    const token = randomBytes(16).toString("hex");
    const stmt = db.prepare(
      "INSERT INTO newsletter_subscribers (email, unsub_token) VALUES (?, ?)"
    );
    const info = stmt.run(normalized, token);
    const select = db.prepare("SELECT * FROM newsletter_subscribers WHERE id = ?");
    return (select.get(info.lastInsertRowid as number) as NewsletterSubscriber | undefined) ?? null;
  } catch {
    return null;
  }
}

export interface PropertyTranslationsFields {
  title?: string;
  subtitle?: string;
  location?: string;
  neighborhood?: string;
  city?: string;
  region?: string;
  country?: string;
  meta_description?: string;
  description?: string;
  sale_type?: string;
  inclusions?: string[];
  floor_plan?: string;
  card_image?: string;
}

export function upsertPropertyTranslations(
  propertyId: number,
  translations: Record<"de" | "tr" | "ru" | "pl", PropertyTranslationsFields>
): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(`
      INSERT INTO property_translations (
        property_id, locale, title, subtitle, location, neighborhood, city, region, country,
        meta_description, description, sale_type, inclusions, floor_plan, card_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(property_id, locale) DO UPDATE SET
        title = excluded.title,
        subtitle = excluded.subtitle,
        location = excluded.location,
        neighborhood = excluded.neighborhood,
        city = excluded.city,
        region = excluded.region,
        country = excluded.country,
        meta_description = excluded.meta_description,
        description = excluded.description,
        sale_type = excluded.sale_type,
        inclusions = excluded.inclusions,
        floor_plan = excluded.floor_plan,
        card_image = excluded.card_image
    `);

    for (const [locale, fields] of Object.entries(translations)) {
      stmt.run(
        propertyId,
        locale,
        fields.title ?? null,
        fields.subtitle ?? null,
        fields.location ?? null,
        fields.neighborhood ?? null,
        fields.city ?? null,
        fields.region ?? null,
        fields.country ?? null,
        fields.meta_description ?? null,
        fields.description ?? null,
        fields.sale_type ?? null,
        fields.inclusions ? JSON.stringify(fields.inclusions) : null,
        fields.floor_plan ?? null,
        fields.card_image ?? null
      );
    }
    return true;
  } catch (err) {
    console.error("Failed to upsert property translations:", err);
    return false;
  }
}
