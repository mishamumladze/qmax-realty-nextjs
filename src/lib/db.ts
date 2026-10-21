import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { mkdirSync } from "fs";
import path from "path";
import { Property } from "@/types/property";
import { MessageSummary, NewsletterSubscriber, PropertyFormData } from "@/types/admin";
import type {
  CrmActivity,
  CrmActivityKind,
  CrmContact,
  CrmListParams,
  CrmMessage,
  CrmMessageChannel,
  CrmMessageDirection,
  CrmStatus,
} from "@/types/admin";
import { normalizeCrmEmail, normalizeCrmPhone } from "@/lib/crm-utils";
import type { TranslationFields } from "@/lib/translations";

const dbPath = path.join(process.cwd(), "data", "qmax.sqlite");
mkdirSync(path.dirname(dbPath), { recursive: true });

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
        unsub_token TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const subscriberColumns = db.prepare("PRAGMA table_info(newsletter_subscribers)").all() as {
      name: string;
    }[];
    if (!subscriberColumns.map((c) => c.name).includes("unsub_token")) {
      db.exec("ALTER TABLE newsletter_subscribers ADD COLUMN unsub_token TEXT");
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        type TEXT,
        title TEXT,
        rooms INTEGER,
        bedrooms INTEGER,
        bathrooms REAL,
        sqmt REAL,
        price REAL,
        location TEXT,
        neighborhood TEXT,
        city TEXT,
        country TEXT,
        sale_type TEXT,
        card_image TEXT,
        coords TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    if (!columnNames.includes("price_type")) {
      db.exec("ALTER TABLE properties ADD COLUMN price_type TEXT");
    }
    if (!columnNames.includes("cadastral_code")) {
      db.exec("ALTER TABLE properties ADD COLUMN cadastral_code TEXT");
    }
    if (!columnNames.includes("energy_class")) {
      db.exec("ALTER TABLE properties ADD COLUMN energy_class TEXT");
    }
    if (!columnNames.includes("renovation_year")) {
      db.exec("ALTER TABLE properties ADD COLUMN renovation_year INTEGER");
    }
    if (!columnNames.includes("floor_plan_url")) {
      db.exec("ALTER TABLE properties ADD COLUMN floor_plan_url TEXT");
    }
    if (!columnNames.includes("swimming_pool")) {
      db.exec("ALTER TABLE properties ADD COLUMN swimming_pool BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("sauna_jacuzzi")) {
      db.exec("ALTER TABLE properties ADD COLUMN sauna_jacuzzi BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("gym")) {
      db.exec("ALTER TABLE properties ADD COLUMN gym BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("private_yard")) {
      db.exec("ALTER TABLE properties ADD COLUMN private_yard BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("bbq_area")) {
      db.exec("ALTER TABLE properties ADD COLUMN bbq_area BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("concierge")) {
      db.exec("ALTER TABLE properties ADD COLUMN concierge BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("fireplace")) {
      db.exec("ALTER TABLE properties ADD COLUMN fireplace BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("storage")) {
      db.exec("ALTER TABLE properties ADD COLUMN storage BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("intercom")) {
      db.exec("ALTER TABLE properties ADD COLUMN intercom BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("pet_friendly")) {
      db.exec("ALTER TABLE properties ADD COLUMN pet_friendly BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes("wheelchair_accessible")) {
      db.exec("ALTER TABLE properties ADD COLUMN wheelchair_accessible BOOLEAN DEFAULT 0");
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
    if (!messageColumns.map((c) => c.name).includes("contact_id")) {
      db.exec("ALTER TABLE messages ADD COLUMN contact_id INTEGER REFERENCES crm_contacts(id)");
    }
    try {
      db.exec("CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id)");
    } catch {
      // index may already exist
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
    db.exec(`
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'prospect',
        tags TEXT DEFAULT '[]',
        source TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TEXT,
        deleted_at TEXT
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS crm_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        body TEXT,
        occurred_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      db.exec("CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status)");
    } catch {
      // index may already exist
    }
    const crmContactColumns = db.prepare("PRAGMA table_info(crm_contacts)").all() as {
      name: string;
    }[];
    if (!crmContactColumns.map((c) => c.name).includes("deleted_at")) {
      db.exec("ALTER TABLE crm_contacts ADD COLUMN deleted_at TEXT");
    }
    try {
      db.exec("CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email)");
    } catch {
      // index may already exist
    }
    try {
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id)"
      );
    } catch {
      // index may already exist
    }
    const activityColumns = db.prepare("PRAGMA table_info(crm_activities)").all() as {
      name: string;
    }[];
    const activityColumnNames = activityColumns.map((c) => c.name);
    if (!activityColumnNames.includes("created_by")) {
      db.exec("ALTER TABLE crm_activities ADD COLUMN created_by TEXT DEFAULT 'admin'");
    }
    if (!activityColumnNames.includes("updated_at")) {
      db.exec("ALTER TABLE crm_activities ADD COLUMN updated_at TEXT");
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS crm_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
        direction TEXT NOT NULL,
        channel TEXT NOT NULL,
        sender TEXT,
        subject TEXT,
        body TEXT NOT NULL,
        occurred_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      db.exec("CREATE INDEX IF NOT EXISTS idx_crm_messages_contact ON crm_messages(contact_id)");
    } catch {
      // index may already exist
    }
    try {
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_crm_messages_occurred ON crm_messages(occurred_at)"
      );
    } catch {
      // index may already exist
    }
  } catch (err) {
    console.error("Failed to initialize database:", err);
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

const JSON_COLUMNS = new Set<string>([
  "inclusions",
  "gallery",
  "coords",
  "view",
  "kitchen_appliances",
]);

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

const LOCALE_ALIASED_FIELDS = [
  "title",
  "neighborhood",
  "city",
  "country",
  "meta_description",
  "description",
  "sale_type",
] as const;

export function getAllPropertiesWithLocale(locale: string): Property[] {
  if (!locale || locale === "en" || !(TRANSLATABLE_LOCALES as readonly string[]).includes(locale)) {
    return getAllProperties();
  }

  const db = new Database(dbPath);

  const stmt = db.prepare(`
    SELECT p.*,
           t.title AS t_title,
           t.neighborhood AS t_neighborhood,
           t.city AS t_city,
           t.country AS t_country,
           t.meta_description AS t_meta_description,
           t.description AS t_description,
           t.sale_type AS t_sale_type
    FROM properties p
    LEFT JOIN property_translations t ON t.property_id = p.id AND t.locale = ?
    ORDER BY p.created_at DESC, p.id DESC
  `);

  return stmt
    .all(locale)
    .map((r) => {
      const row = r as Record<string, unknown>;
      const base: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (!key.startsWith("t_")) base[key] = value;
      }
      const property = normalizePropertyRow(base);
      if (!property) return undefined;
      const record = property as unknown as Record<string, unknown>;
      const translated: Record<string, unknown> = {
        title: row.t_title,
        neighborhood: row.t_neighborhood,
        city: row.t_city,
        country: row.t_country,
        meta_description: row.t_meta_description,
        description: row.t_description,
        sale_type: row.t_sale_type,
      };
      for (const field of LOCALE_ALIASED_FIELDS) {
        const value = translated[field];
        if (value !== null && value !== undefined && value !== "") {
          record[`${field}_${locale}`] = value;
        }
      }
      return property;
    })
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
      price_type: data.price_type,
      cadastral_code: data.cadastral_code,
      energy_class: data.energy_class,
      floor_plan_url: data.floor_plan_url,
      year_built: data.year_built,
      renovation_year: data.renovation_year,
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
      swimming_pool: data.swimming_pool,
      sauna_jacuzzi: data.sauna_jacuzzi,
      gym: data.gym,
      private_yard: data.private_yard,
      bbq_area: data.bbq_area,
      concierge: data.concierge,
      fireplace: data.fireplace,
      storage: data.storage,
      intercom: data.intercom,
      pet_friendly: data.pet_friendly,
      wheelchair_accessible: data.wheelchair_accessible,
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

export function listMessagesByContact(contactId: number): MessageSummary[] {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(
      "SELECT * FROM messages WHERE contact_id = ? ORDER BY created_at DESC"
    );
    return stmt.all(contactId) as MessageSummary[];
  } catch {
    return [];
  }
}

export function listUnlinkedMessages(): MessageSummary[] {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(
      "SELECT * FROM messages WHERE contact_id IS NULL ORDER BY created_at DESC"
    );
    return stmt.all() as MessageSummary[];
  } catch {
    return [];
  }
}

export function countUnlinkedMessages(): number {
  try {
    const db = new Database(dbPath);
    const row = db
      .prepare("SELECT COUNT(*) as count FROM messages WHERE contact_id IS NULL")
      .get() as { count: number } | undefined;
    return typeof row?.count === "number" ? row.count : 0;
  } catch {
    return 0;
  }
}

export function linkMessageToContact(messageId: number, contactId: number | null): boolean {
  try {
    const db = new Database(dbPath);
    const info = db.prepare("UPDATE messages SET contact_id = ? WHERE id = ?").run(contactId, messageId);
    return info.changes > 0;
  } catch {
    return false;
  }
}

export function touchCrmContactActivity(contactId: number, at?: string): void {
  try {
    const db = new Database(dbPath);
    db.prepare(
      "UPDATE crm_contacts SET last_activity_at = COALESCE(?, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(at ?? null, contactId);
  } catch {
    // contact touch is best-effort
  }
}

export function backfillMessageLinks(): { linked: number; created: number } {
  let linked = 0;
  let created = 0;
  try {
    const db = new Database(dbPath);
    const rows = db.prepare("SELECT * FROM messages WHERE contact_id IS NULL").all() as Record<
      string,
      unknown
    >[];
    for (const row of rows) {
      const id = typeof row.id === "number" ? row.id : 0;
      if (!id) continue;
      const email = typeof row.email === "string" ? row.email : "";
      const phone = typeof row.phone === "string" ? row.phone : "";
      const matches = findCrmDuplicates(email || null, phone || null);
      let contactId = matches[0]?.id;
      if (!contactId && email.trim()) {
        const created_ = insertCrmContact({
          first_name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : email.trim(),
          email: email.trim(),
          phone: phone.trim() ? phone.trim() : null,
          status: "prospect",
          source: "website",
        });
        if (created_) {
          contactId = created_.id;
          created++;
        }
      }
      if (contactId) {
        db.prepare("UPDATE messages SET contact_id = ? WHERE id = ?").run(contactId, id);
        touchCrmContactActivity(contactId, typeof row.created_at === "string" ? row.created_at : undefined);
        linked++;
      }
    }
  } catch {
    // backfill is best-effort
  }
  return { linked, created };
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

const TRANSLATION_COLUMNS = [
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
  "inclusions",
  "floor_plan",
  "card_image",
] as const;

export function upsertPropertyTranslations(
  propertyId: number,
  translations: Record<"de" | "tr" | "ru" | "pl", PropertyTranslationsFields>
): boolean {
  try {
    const db = new Database(dbPath);
    const allowed = new Set<string>(TRANSLATION_COLUMNS);
    const select = db.prepare(
      "SELECT * FROM property_translations WHERE property_id = ? AND locale = ?"
    );

    for (const [locale, fields] of Object.entries(translations)) {
      if (!fields || typeof fields !== "object") continue;
      const present = (Object.entries(fields) as [string, unknown][]).filter(
        ([key, value]) => value !== undefined && allowed.has(key)
      );
      if (present.length === 0) continue;

      const values: Record<string, string | null> = {};
      for (const [key, value] of present) {
        try {
          if (key === "inclusions") {
            values[key] = Array.isArray(value) ? JSON.stringify(value) : JSON.stringify(value);
          } else {
            values[key] = value as string;
          }
        } catch {
          continue;
        }
      }
      const keys = Object.keys(values);
      if (keys.length === 0) continue;

      const existing = select.get(propertyId, locale) as Record<string, unknown> | undefined;
      if (existing) {
        // Column names come from the fixed TRANSLATION_COLUMNS whitelist — never from user input.
        const setClause = keys.map((key) => `${key} = ?`).join(", ");
        db.prepare(
          `UPDATE property_translations SET ${setClause} WHERE property_id = ? AND locale = ?`
        ).run(...keys.map((key) => values[key]), propertyId, locale);
      } else {
        // Column names come from the fixed TRANSLATION_COLUMNS whitelist — never from user input.
        const columns = ["property_id", "locale", ...keys];
        const placeholders = columns.map(() => "?").join(", ");
        db.prepare(
          `INSERT INTO property_translations (${columns.join(", ")}) VALUES (${placeholders})`
        ).run(propertyId, locale, ...keys.map((key) => values[key]));
      }
    }
    return true;
  } catch (err) {
    console.error("Failed to upsert property translations:", err);
    return false;
  }
}

export function clearPropertyTranslationFields(
  propertyId: number,
  keys: (keyof TranslationFields)[]
): boolean {
  try {
    if (keys.length === 0) return true;
    const allowed = new Set<string>(TRANSLATION_COLUMNS);
    const columns = keys.filter((key) => allowed.has(key as string));
    if (columns.length === 0) return true;
    const db = new Database(dbPath);
    // Column names come from the fixed TRANSLATION_COLUMNS whitelist — never from user input.
    const setClause = columns.map((column) => `${column} = NULL`).join(", ");
    db.prepare(`UPDATE property_translations SET ${setClause} WHERE property_id = ?`).run(
      propertyId
    );
    return true;
  } catch (err) {
    console.error("Failed to clear property translation fields:", err);
    return false;
  }
}

// ---------- CRM ----------

const CRM_STATUSES: CrmStatus[] = ["prospect", "lead", "customer", "archived"];

const CRM_CONTACT_COLUMNS = new Set<string>([
  "first_name",
  "last_name",
  "email",
  "phone",
  "status",
  "tags",
  "source",
]);

function parseCrmTagsColumn(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function normalizeCrmContactRow(row: Record<string, unknown> | undefined): CrmContact | undefined {
  if (!row || typeof row.id !== "number") return undefined;
  const status = typeof row.status === "string" ? row.status : "prospect";
  return {
    id: row.id,
    first_name: typeof row.first_name === "string" ? row.first_name : "",
    last_name: typeof row.last_name === "string" ? row.last_name : null,
    email: typeof row.email === "string" ? row.email : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    status: CRM_STATUSES.includes(status as CrmStatus) ? (status as CrmStatus) : "prospect",
    tags: parseCrmTagsColumn(row.tags),
    source: typeof row.source === "string" ? row.source : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
    last_activity_at: typeof row.last_activity_at === "string" ? row.last_activity_at : null,
    deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : null,
  };
}

function normalizeCrmActivityRow(
  row: Record<string, unknown> | undefined
): CrmActivity | undefined {
  if (!row || typeof row.id !== "number") return undefined;
  const kind = row.kind;
  if (
    kind !== "call" &&
    kind !== "email" &&
    kind !== "meeting" &&
    kind !== "note" &&
    kind !== "status"
  ) {
    return undefined;
  }
  return {
    id: row.id,
    contact_id: typeof row.contact_id === "number" ? row.contact_id : 0,
    kind,
    body: typeof row.body === "string" ? row.body : null,
    occurred_at: typeof row.occurred_at === "string" ? row.occurred_at : "",
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

const CRM_MESSAGE_DIRECTIONS: CrmMessageDirection[] = ["in", "out"];
const CRM_MESSAGE_CHANNELS: CrmMessageChannel[] = ["email", "chat", "sms", "note"];

function normalizeCrmMessageRow(row: Record<string, unknown> | undefined): CrmMessage | undefined {
  if (!row || typeof row.id !== "number") return undefined;
  const direction = row.direction;
  const channel = row.channel;
  if (!CRM_MESSAGE_DIRECTIONS.includes(direction as CrmMessageDirection)) return undefined;
  if (!CRM_MESSAGE_CHANNELS.includes(channel as CrmMessageChannel)) return undefined;
  const body = typeof row.body === "string" ? row.body : "";
  if (!body.trim()) return undefined;
  return {
    id: row.id,
    contact_id: typeof row.contact_id === "number" ? row.contact_id : 0,
    direction: direction as CrmMessageDirection,
    channel: channel as CrmMessageChannel,
    sender: typeof row.sender === "string" ? row.sender : null,
    subject: typeof row.subject === "string" ? row.subject : null,
    body,
    occurred_at: typeof row.occurred_at === "string" ? row.occurred_at : "",
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

function buildCrmOrderBy(sort?: string): string {
  let key = (sort ?? "").trim().toLowerCase();
  let dir: "ASC" | "DESC" | undefined;
  if (key.startsWith("-")) {
    dir = "DESC";
    key = key.slice(1);
  }
  const match = key.match(/^(.+?)(?:[:_ ](asc|desc))$/);
  if (match) {
    key = match[1] ?? key;
    dir = match[2] === "asc" ? "ASC" : "DESC";
  }
  if (key === "name" || key === "first_name") {
    const direction = dir ?? "ASC";
    return `ORDER BY first_name ${direction}, last_name ${direction}, id ${direction}`;
  }
  if (key === "last_activity_at") {
    const direction = dir ?? "DESC";
    return `ORDER BY last_activity_at ${direction}, id ${direction}`;
  }
  const direction = dir ?? "DESC";
  return `ORDER BY created_at ${direction}, id ${direction}`;
}

export function listCrmContacts(params: CrmListParams = {}): {
  rows: CrmContact[];
  total: number;
} {
  try {
    const db = new Database(dbPath);
    const where: string[] = ["deleted_at IS NULL"];
    const values: (string | number)[] = [];

    const q = (params.q ?? "").trim();
    if (q) {
      where.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
      const like = `%${q}%`;
      values.push(like, like, like, like);
    }
    if (params.status) {
      where.push("status = ?");
      values.push(params.status);
    }
    const tag = (params.tag ?? "").trim();
    if (tag) {
      where.push("tags LIKE ?");
      values.push(`%${tag}%`);
    }
    const from = (params.from ?? "").trim();
    if (from) {
      const bound = /^\d{4}-\d{2}-\d{2}$/.test(from) ? `${from} 00:00:00` : from;
      where.push("created_at >= ?");
      values.push(bound);
    }
    const to = (params.to ?? "").trim();
    if (to) {
      const bound = /^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to} 23:59:59` : to;
      where.push("created_at <= ?");
      values.push(bound);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM crm_contacts ${whereClause}`)
      .get(...values) as { count: number } | undefined;
    const total = typeof countRow?.count === "number" ? countRow.count : 0;

    const page =
      typeof params.page === "number" && Number.isInteger(params.page) && params.page > 0
        ? params.page
        : 1;
    const rawLimit =
      typeof params.limit === "number" && Number.isInteger(params.limit) ? params.limit : 20;
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const offset = (page - 1) * limit;

    const orderBy = buildCrmOrderBy(params.sort);
    const stmt = db.prepare(
      `SELECT * FROM crm_contacts ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
    );
    const rows = (stmt.all(...values, limit, offset) as Record<string, unknown>[])
      .map(normalizeCrmContactRow)
      .filter((c): c is CrmContact => c !== undefined);
    return { rows, total };
  } catch {
    return { rows: [], total: 0 };
  }
}

export function getCrmContactById(id: number, includeDeleted = false): CrmContact | undefined {
  try {
    const db = new Database(dbPath);
    const row = db
      .prepare(
        includeDeleted
          ? "SELECT * FROM crm_contacts WHERE id = ?"
          : "SELECT * FROM crm_contacts WHERE id = ? AND deleted_at IS NULL"
      )
      .get(id) as Record<string, unknown> | undefined;
    return normalizeCrmContactRow(row);
  } catch {
    return undefined;
  }
}

export function insertCrmContact(data: {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: CrmStatus;
  tags?: string[];
  source?: string | null;
}): CrmContact | null {
  initTables();
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(
      "INSERT INTO crm_contacts (first_name, last_name, email, phone, status, tags, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const info = stmt.run(
      data.first_name,
      data.last_name ?? null,
      data.email ?? null,
      data.phone ?? null,
      data.status ?? "prospect",
      JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
      data.source ?? null
    );
    const select = db.prepare("SELECT * FROM crm_contacts WHERE id = ?");
    return (
      normalizeCrmContactRow(
        select.get(info.lastInsertRowid as number) as Record<string, unknown> | undefined
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function updateCrmContact(
  id: number,
  fields: {
    first_name?: string;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: CrmStatus;
    tags?: string[];
    source?: string | null;
  }
): CrmContact | null {
  try {
    const db = new Database(dbPath);
    const existing = db
      .prepare("SELECT * FROM crm_contacts WHERE id = ? AND deleted_at IS NULL")
      .get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;

    const entries = Object.entries(fields ?? {}).filter(
      ([key, value]) => value !== undefined && CRM_CONTACT_COLUMNS.has(key)
    ) as [string, string | string[] | null][];
    if (entries.length > 0) {
      const setClauses: string[] = [];
      const values: (string | null)[] = [];
      for (const [key, value] of entries) {
        // Column names come from the fixed CRM_CONTACT_COLUMNS whitelist — never from user input.
        setClauses.push(`${key} = ?`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
      setClauses.push("updated_at = CURRENT_TIMESTAMP");
      db.prepare(`UPDATE crm_contacts SET ${setClauses.join(", ")} WHERE id = ?`).run(
        ...values,
        id
      );
    }

    const select = db.prepare("SELECT * FROM crm_contacts WHERE id = ?");
    return (
      normalizeCrmContactRow(select.get(id) as Record<string, unknown> | undefined) ?? null
    );
  } catch {
    return null;
  }
}

export function getCrmMetrics(): {
  total: number;
  byStatus: Record<CrmStatus, number>;
  activeLeads: number;
  customers: number;
  conversion: number;
  contacted7d: number;
} {
  const empty = {
    total: 0,
    byStatus: { prospect: 0, lead: 0, customer: 0, archived: 0 } as Record<CrmStatus, number>,
    activeLeads: 0,
    customers: 0,
    conversion: 0,
    contacted7d: 0,
  };
  try {
    const db = new Database(dbPath);
    const totalRow = db
      .prepare("SELECT COUNT(*) as count FROM crm_contacts WHERE deleted_at IS NULL")
      .get() as { count: number } | undefined;
    const total = typeof totalRow?.count === "number" ? totalRow.count : 0;
    const statusRows = db
      .prepare(
        "SELECT status, COUNT(*) as count FROM crm_contacts WHERE deleted_at IS NULL GROUP BY status"
      )
      .all() as { status: string; count: number }[];
    const byStatus: Record<CrmStatus, number> = {
      prospect: 0,
      lead: 0,
      customer: 0,
      archived: 0,
    };
    for (const row of statusRows) {
      if (row.status in byStatus) {
        byStatus[row.status as CrmStatus] = row.count;
      }
    }
    const activeLeads = byStatus.prospect + byStatus.lead;
    const customers = byStatus.customer;
    const conversion = total > 0 ? Math.round((customers / total) * 100) : 0;
    const contactedRow = db
      .prepare(
        "SELECT COUNT(*) as count FROM crm_contacts WHERE deleted_at IS NULL AND last_activity_at IS NOT NULL AND last_activity_at >= datetime('now', '-7 days')"
      )
      .get() as { count: number } | undefined;
    const contacted7d = typeof contactedRow?.count === "number" ? contactedRow.count : 0;
    return { total, byStatus, activeLeads, customers, conversion, contacted7d };
  } catch {
    return empty;
  }
}

export function deleteCrmContacts(ids: number[]): number {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const clean = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
    if (clean.length === 0) return 0;
    const db = new Database(dbPath);
    // Soft delete: keep activities, messages, and inbox links intact for restore.
    // Placeholders are fixed "?" marks — never user input.
    const placeholders = clean.map(() => "?").join(", ");
    const info = db
      .prepare(
        `UPDATE crm_contacts SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND deleted_at IS NULL`
      )
      .run(...clean);
    return typeof info.changes === "number" ? info.changes : 0;
  } catch {
    return 0;
  }
}

export function restoreCrmContacts(ids: number[]): number {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const clean = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
    if (clean.length === 0) return 0;
    const db = new Database(dbPath);
    const placeholders = clean.map(() => "?").join(", ");
    const info = db
      .prepare(
        `UPDATE crm_contacts SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND deleted_at IS NOT NULL`
      )
      .run(...clean);
    return typeof info.changes === "number" ? info.changes : 0;
  } catch {
    return 0;
  }
}

export function findCrmDuplicates(
  email?: string | null,
  phone?: string | null,
  excludeId?: number
): CrmContact[] {
  try {
    const normEmail = normalizeCrmEmail(email ?? "");
    const normPhone = normalizeCrmPhone(phone ?? "");
    if (!normEmail && !normPhone) return [];
    const db = new Database(dbPath);
    const rows = db
      .prepare("SELECT * FROM crm_contacts WHERE deleted_at IS NULL")
      .all() as Record<string, unknown>[];
    return rows
      .map(normalizeCrmContactRow)
      .filter((c): c is CrmContact => {
        if (!c) return false;
        if (typeof excludeId === "number" && c.id === excludeId) return false;
        const rowEmail = normalizeCrmEmail(c.email ?? "");
        const rowPhone = normalizeCrmPhone(c.phone ?? "");
        if (normEmail && rowEmail && rowEmail === normEmail) return true;
        if (normPhone && rowPhone && rowPhone === normPhone) return true;
        return false;
      });
  } catch {
    return [];
  }
}

export function listCrmActivities(contactId: number): CrmActivity[] {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(
      "SELECT * FROM crm_activities WHERE contact_id = ? ORDER BY occurred_at DESC, id DESC"
    );
    return (stmt.all(contactId) as Record<string, unknown>[])
      .map(normalizeCrmActivityRow)
      .filter((a): a is CrmActivity => a !== undefined);
  } catch {
    return [];
  }
}

export function insertCrmActivity(data: {
  contact_id: number;
  kind: CrmActivityKind;
  body?: string | null;
  occurred_at?: string | null;
}): CrmActivity | null {
  initTables();
  try {
    const db = new Database(dbPath);
    let rowid: number;
    if (data.occurred_at) {
      const info = db
        .prepare(
          "INSERT INTO crm_activities (contact_id, kind, body, occurred_at) VALUES (?, ?, ?, ?)"
        )
        .run(data.contact_id, data.kind, data.body ?? null, data.occurred_at);
      rowid = info.lastInsertRowid as number;
    } else {
      const info = db
        .prepare("INSERT INTO crm_activities (contact_id, kind, body) VALUES (?, ?, ?)")
        .run(data.contact_id, data.kind, data.body ?? null);
      rowid = info.lastInsertRowid as number;
    }
    const select = db.prepare("SELECT * FROM crm_activities WHERE id = ?");
    const activity =
      normalizeCrmActivityRow(select.get(rowid) as Record<string, unknown> | undefined) ?? null;
    if (activity) {
      try {
        db.prepare(
          "UPDATE crm_contacts SET last_activity_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(activity.occurred_at, data.contact_id);
      } catch {
        // contact touch is best-effort
      }
    }
    return activity;
  } catch {
    return null;
  }
}

export function updateCrmActivity(
  id: number,
  fields: { body?: string | null; kind?: CrmActivityKind; occurred_at?: string | null }
): CrmActivity | null {
  try {
    const db = new Database(dbPath);
    const existing = db.prepare("SELECT * FROM crm_activities WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return null;
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    if (fields.body !== undefined) {
      setClauses.push("body = ?");
      values.push(fields.body);
    }
    if (fields.kind !== undefined) {
      setClauses.push("kind = ?");
      values.push(fields.kind);
    }
    if (fields.occurred_at !== undefined) {
      setClauses.push("occurred_at = ?");
      values.push(fields.occurred_at);
    }
    if (setClauses.length === 0) {
      return normalizeCrmActivityRow(existing) ?? null;
    }
    setClauses.push("updated_at = CURRENT_TIMESTAMP");
    // Column names are fixed literals above — never from user input.
    db.prepare(`UPDATE crm_activities SET ${setClauses.join(", ")} WHERE id = ?`).run(
      ...values,
      id
    );
    const select = db.prepare("SELECT * FROM crm_activities WHERE id = ?");
    return (
      normalizeCrmActivityRow(select.get(id) as Record<string, unknown> | undefined) ?? null
    );
  } catch {
    return null;
  }
}

export function deleteCrmActivity(id: number): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("DELETE FROM crm_activities WHERE id = ?");
    const info = stmt.run(id);
    return info.changes > 0;
  } catch {
    return false;
  }
}

export function listCrmMessages(
  contactId: number,
  params: { q?: string; from?: string; to?: string; page?: number; limit?: number } = {}
): { rows: CrmMessage[]; total: number } {
  try {
    const db = new Database(dbPath);
    const where: string[] = ["contact_id = ?"];
    const values: (string | number)[] = [contactId];
    const q = (params.q ?? "").trim();
    if (q) {
      where.push("(sender LIKE ? OR subject LIKE ? OR body LIKE ?)");
      const like = `%${q}%`;
      values.push(like, like, like);
    }
    const from = (params.from ?? "").trim();
    if (from) {
      const bound = /^\d{4}-\d{2}-\d{2}$/.test(from) ? `${from} 00:00:00` : from;
      where.push("occurred_at >= ?");
      values.push(bound);
    }
    const to = (params.to ?? "").trim();
    if (to) {
      const bound = /^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to} 23:59:59` : to;
      where.push("occurred_at <= ?");
      values.push(bound);
    }
    const whereClause = `WHERE ${where.join(" AND ")}`;
    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM crm_messages ${whereClause}`)
      .get(...values) as { count: number } | undefined;
    const total = typeof countRow?.count === "number" ? countRow.count : 0;
    const page =
      typeof params.page === "number" && Number.isInteger(params.page) && params.page > 0
        ? params.page
        : 1;
    const rawLimit =
      typeof params.limit === "number" && Number.isInteger(params.limit) ? params.limit : 50;
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const offset = (page - 1) * limit;
    const stmt = db.prepare(
      `SELECT * FROM crm_messages ${whereClause} ORDER BY occurred_at DESC, id DESC LIMIT ? OFFSET ?`
    );
    const rows = (stmt.all(...values, limit, offset) as Record<string, unknown>[])
      .map(normalizeCrmMessageRow)
      .filter((m): m is CrmMessage => m !== undefined);
    return { rows, total };
  } catch {
    return { rows: [], total: 0 };
  }
}

export function insertCrmMessage(data: {
  contact_id: number;
  direction: CrmMessageDirection;
  channel: CrmMessageChannel;
  sender?: string | null;
  subject?: string | null;
  body: string;
  occurred_at?: string | null;
}): CrmMessage | null {
  initTables();
  try {
    const db = new Database(dbPath);
    let rowid: number;
    if (data.occurred_at) {
      const info = db
        .prepare(
          "INSERT INTO crm_messages (contact_id, direction, channel, sender, subject, body, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .run(
          data.contact_id,
          data.direction,
          data.channel,
          data.sender ?? null,
          data.subject ?? null,
          data.body,
          data.occurred_at
        );
      rowid = info.lastInsertRowid as number;
    } else {
      const info = db
        .prepare(
          "INSERT INTO crm_messages (contact_id, direction, channel, sender, subject, body) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(
          data.contact_id,
          data.direction,
          data.channel,
          data.sender ?? null,
          data.subject ?? null,
          data.body
        );
      rowid = info.lastInsertRowid as number;
    }
    const select = db.prepare("SELECT * FROM crm_messages WHERE id = ?");
    const message =
      normalizeCrmMessageRow(select.get(rowid) as Record<string, unknown> | undefined) ?? null;
    if (message) {
      try {
        db.prepare(
          "UPDATE crm_contacts SET last_activity_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(message.occurred_at, data.contact_id);
      } catch {
        // contact touch is best-effort
      }
    }
    return message;
  } catch {
    return null;
  }
}

export function updateCrmMessage(
  id: number,
  fields: {
    direction?: CrmMessageDirection;
    channel?: CrmMessageChannel;
    sender?: string | null;
    subject?: string | null;
    body?: string;
    occurred_at?: string | null;
  }
): CrmMessage | null {
  try {
    const db = new Database(dbPath);
    const existing = db.prepare("SELECT * FROM crm_messages WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return null;
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    for (const key of ["direction", "channel", "sender", "subject", "body", "occurred_at"] as const) {
      if (fields[key] !== undefined) {
        // Column names are fixed literals above — never from user input.
        setClauses.push(`${key} = ?`);
        values.push(fields[key] as string | null);
      }
    }
    if (setClauses.length === 0) {
      return normalizeCrmMessageRow(existing) ?? null;
    }
    db.prepare(`UPDATE crm_messages SET ${setClauses.join(", ")} WHERE id = ?`).run(...values, id);
    const select = db.prepare("SELECT * FROM crm_messages WHERE id = ?");
    return normalizeCrmMessageRow(select.get(id) as Record<string, unknown> | undefined) ?? null;
  } catch {
    return null;
  }
}

export function deleteCrmMessage(id: number): boolean {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("DELETE FROM crm_messages WHERE id = ?");
    const info = stmt.run(id);
    return info.changes > 0;
  } catch {
    return false;
  }
}
