import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";
import { Property } from "@/types/property";
import { MessageSummary, NewsletterSubscriber, PropertyFormData } from "@/types/admin";

const dbPath = path.join(process.cwd(), "data", "qmax.sqlite");

initTables();

export function getActiveProperties(): Property[] {
  const db = new Database(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM properties 
    WHERE status = 'active'
    ORDER BY id ASC
  `);

  return stmt.all() as Property[];
}

export function getPropertyById(id: number): Property | undefined {
  try {
    const db = new Database(dbPath);
    const stmt = db.prepare("SELECT * FROM properties WHERE id = ? AND status = 'active'");
    return stmt.get(id) as Property | undefined;
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

    const messageColumns = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
    if (!messageColumns.map((c) => c.name).includes("read")) {
      db.exec("ALTER TABLE messages ADD COLUMN read INTEGER DEFAULT 0");
    }
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

const JSON_COLUMNS = new Set<string>(["inclusions", "gallery", "coords"]);

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

export function getAllProperties(): Property[] {
  const db = new Database(dbPath);

  const stmt = db.prepare(`
    SELECT * FROM properties
    ORDER BY created_at DESC, id DESC
  `);

  return stmt.all() as Property[];
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
      return (stmt.get(id) as Property | undefined) ?? null;
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
    return (select.get(id) as Property | undefined) ?? null;
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
      subtitle: data.subtitle,
      location: data.location,
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
      parking: data.parking,
      meta_description: data.meta_description,
      description: data.description,
      inclusions: data.inclusions,
      gallery: data.gallery,
      floor_plan: data.floor_plan,
      coords: data.coords,
      card_image: data.card_image,
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
    return (select.get(info.lastInsertRowid as number) as Property | undefined) ?? null;
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
