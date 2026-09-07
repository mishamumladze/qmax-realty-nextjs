import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import {
  clearPropertyTranslationFields,
  deleteProperty,
  getAllProperties,
  insertProperty,
  updateProperty,
  upsertPropertyTranslations,
} from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";
import { PropertyFormData } from "@/types/admin";
import { translateToAllLocales, TranslationFields } from "@/lib/translations";

const dbPath = path.join(process.cwd(), "data", "qmax.sqlite");

const NUMERIC_FIELDS = [
  "rooms",
  "bedrooms",
  "bathrooms",
  "sqmt",
  "price",
  "year_built",
  "renovation_year",
  "balcony_sqmt",
  "lot_sqmt",
  "ceiling_height",
  "total_floors",
] as const;
const TEXT_FIELDS = [
  "type",
  "neighborhood",
  "city",
  "region",
  "country",
  "currency",
  "sale_type",
  "meta_description",
  "description",
  "floor_plan",
  "card_image",
  "property_subtype",
  "furnishing",
  "listing_status",
  "street_address",
  "video_url",
  "virtual_tour_url",
  "building_status",
  "condition",
  "project_type",
  "heating_type",
  "hot_water_type",
  "parking_type",
  "price_type",
  "cadastral_code",
  "energy_class",
  "floor_plan_url",
] as const;
const ARRAY_FIELDS = ["gallery", "view", "kitchen_appliances"] as const;
const BOOLEAN_FIELDS = [
  "balcony",
  "is_featured",
  "natural_gas",
  "internet",
  "water_supply",
  "electricity",
  "tv",
  "sewerage",
  "elevator",
  "ac",
  "security",
  "swimming_pool",
  "sauna_jacuzzi",
  "gym",
  "private_yard",
  "bbq_area",
  "concierge",
  "fireplace",
  "storage",
  "intercom",
  "pet_friendly",
  "wheelchair_accessible",
] as const;

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === 0) return value === 1;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

type ParseResult = { data: Record<string, unknown> } | { error: string };

function parsePropertyPayload(record: Record<string, unknown>): ParseResult {
  const clean: Record<string, unknown> = {};

  if (record.title !== undefined) {
    if (typeof record.title !== "string" || !record.title.trim()) {
      return { error: "Title must be a non-empty string" };
    }
    clean.title = record.title;
  }

  for (const field of NUMERIC_FIELDS) {
    if (record[field] === undefined) continue;
    const num = coerceNumber(record[field]);
    if (num === null) {
      return { error: `Invalid number for ${field}` };
    }
    clean[field] = num;
  }

  if (record.floor !== undefined) {
    if (typeof record.floor === "number" && Number.isFinite(record.floor)) {
      clean.floor = record.floor;
    } else if (typeof record.floor === "string" && record.floor.trim() !== "") {
      clean.floor = record.floor;
    } else {
      return { error: "Invalid floor" };
    }
  }

  for (const field of ARRAY_FIELDS) {
    const raw = record[field];
    if (raw === undefined) continue;
    if (!Array.isArray(raw) || raw.some((item) => typeof item !== "string")) {
      return { error: `${field} must be an array of strings` };
    }
    clean[field] = raw;
  }

  for (const field of BOOLEAN_FIELDS) {
    if (record[field] === undefined) continue;
    const bool = coerceBoolean(record[field]);
    if (bool === null) {
      return { error: `Invalid ${field} value` };
    }
    clean[field] = bool;
  }

  if (record.coords !== undefined) {
    const coords = record.coords;
    if (
      Array.isArray(coords) &&
      coords.length === 2 &&
      typeof coords[0] === "number" &&
      Number.isFinite(coords[0]) &&
      typeof coords[1] === "number" &&
      Number.isFinite(coords[1])
    ) {
      clean.coords = [coords[0], coords[1]];
    } else if (
      typeof coords === "object" &&
      coords !== null &&
      !Array.isArray(coords) &&
      typeof (coords as Record<string, unknown>).lat === "number" &&
      typeof (coords as Record<string, unknown>).lng === "number"
    ) {
      clean.coords = coords;
    } else {
      return { error: "Invalid coords" };
    }
  }

  for (const field of TEXT_FIELDS) {
    if (record[field] === undefined) continue;
    if (typeof record[field] !== "string") {
      return { error: `${field} must be a string` };
    }
    clean[field] = record[field];
  }

  if (record.furnishing !== undefined) {
    const allowedFurnishing = [
      "unfurnished",
      "semi_furnished",
      "furnished",
      "kitchen_only",
    ] as const;
    if (!allowedFurnishing.includes(record.furnishing as (typeof allowedFurnishing)[number])) {
      return { error: "Invalid furnishing value" };
    }
  }

  if (record.listing_status !== undefined) {
    const allowedListingStatus = [
      "draft",
      "published",
      "under_offer",
      "sold",
      "archived",
      "reserved",
      "expired",
      "pending",
    ] as const;
    if (
      !allowedListingStatus.includes(record.listing_status as (typeof allowedListingStatus)[number])
    ) {
      return { error: "Invalid listing_status value" };
    }
  }

  if (record.parking_type !== undefined) {
    const allowedParkingType = [
      "none",
      "garage",
      "carport",
      "street",
      "underground",
      "driveway",
      "ev_charging",
      "covered",
    ] as const;
    if (!allowedParkingType.includes(record.parking_type as (typeof allowedParkingType)[number])) {
      return { error: "Invalid parking_type value" };
    }
  }

  if (record.slug !== undefined) {
    if (typeof record.slug !== "string" || !record.slug.trim()) {
      return { error: "Invalid slug" };
    }
    clean.slug = record.slug;
  }

  return { data: clean };
}

function buildTranslationFields(data: Record<string, unknown>): TranslationFields {
  const fields: TranslationFields = {};

  const translatableKeys: (keyof TranslationFields)[] = [
    "title",
    "neighborhood",
    "city",
    "region",
    "country",
    "meta_description",
    "description",
    "sale_type",
    "floor_plan",
    "card_image",
  ];

  for (const key of translatableKeys) {
    const value = data[key];
    if (value !== undefined) {
      (fields as Record<string, unknown>)[key] = value;
    }
  }

  return fields;
}

const SOURCE_LOCALES = ["en", "de", "tr", "ru", "pl"] as const;
type SourceLocale = (typeof SOURCE_LOCALES)[number];

function parseSourceLocale(record: Record<string, unknown>): SourceLocale {
  const raw = record.sourceLocale;
  if (typeof raw === "string" && (SOURCE_LOCALES as readonly string[]).includes(raw)) {
    return raw as SourceLocale;
  }
  return "en";
}

function partitionTranslatableFields(fields: TranslationFields): {
  toTranslate: TranslationFields;
  clearedKeys: string[];
} {
  const toTranslate: TranslationFields = {};
  const clearedKeys: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string" && value.trim() === "") {
      clearedKeys.push(key);
    } else {
      (toTranslate as Record<string, unknown>)[key] = value;
    }
  }
  return { toTranslate, clearedKeys };
}

function buildVerbatimSourceFields(toTranslate: TranslationFields): TranslationFields {
  const verbatim: TranslationFields = {};
  for (const [key, value] of Object.entries(toTranslate)) {
    if (value !== undefined) {
      (verbatim as Record<string, unknown>)[key] = value;
    }
  }
  return verbatim;
}

function applyEnTranslationsToBase(
  base: Record<string, unknown>,
  toTranslate: TranslationFields,
  translations: unknown
): void {
  if (typeof translations !== "object" || translations === null) return;
  const en = (translations as Record<string, unknown>).en;
  if (typeof en !== "object" || en === null) return;
  const enFields = en as Record<string, unknown>;
  for (const key of Object.keys(toTranslate)) {
    const translated = enFields[key];
    if (typeof translated === "string") {
      if (translated.trim() !== "") {
        base[key] = translated;
      }
    } else if (translated !== undefined && translated !== null) {
      base[key] = translated;
    }
  }
}

function collectOtherLocaleTranslations(
  translations: unknown,
  sourceLocale: SourceLocale
): Record<string, TranslationFields> {
  const out: Record<string, TranslationFields> = {};
  if (typeof translations !== "object" || translations === null) return out;
  for (const [locale, fields] of Object.entries(translations as Record<string, unknown>)) {
    if (locale === "en" || locale === sourceLocale) continue;
    if (typeof fields !== "object" || fields === null) continue;
    const entries = Object.entries(fields as Record<string, unknown>).filter(
      ([, value]) => value !== undefined
    );
    if (entries.length === 0) continue;
    out[locale] = Object.fromEntries(entries) as TranslationFields;
  }
  return out;
}

const RESPONSE_SOURCE_KEYS = [
  "title",
  "neighborhood",
  "city",
  "country",
  "meta_description",
  "description",
  "sale_type",
] as const;

function buildResponseSourceFields(toTranslate: TranslationFields): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of RESPONSE_SOURCE_KEYS) {
    const value = (toTranslate as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim() !== "") {
      out[key] = value;
    }
  }
  return out;
}

function sanitizeLocaleTranslationsForResponse(
  translations: unknown,
  sourceLocale: SourceLocale
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  if (typeof translations !== "object" || translations === null) return out;
  for (const [locale, fields] of Object.entries(translations as Record<string, unknown>)) {
    if (locale === "en" || locale === sourceLocale) continue;
    if (typeof fields !== "object" || fields === null) continue;
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim() !== "") {
        clean[key] = value;
      }
    }
    if (Object.keys(clean).length > 0) {
      out[locale] = clean;
    }
  }
  return out;
}

function buildResponseTranslations(
  rawTranslations: unknown,
  sourceLocale: SourceLocale,
  toTranslate: TranslationFields
): Record<string, Record<string, string>> {
  const others = sanitizeLocaleTranslationsForResponse(rawTranslations, sourceLocale);
  if (sourceLocale === "en") {
    return others;
  }
  const verbatim = buildResponseSourceFields(toTranslate);
  if (Object.keys(verbatim).length === 0) {
    return others;
  }
  return { [sourceLocale]: verbatim, ...others };
}

function upsertTranslationsBestEffort(
  propertyId: number,
  translations: Record<string, TranslationFields>
): void {
  if (Object.keys(translations).length === 0) return;
  try {
    upsertPropertyTranslations(
      propertyId,
      translations as unknown as Parameters<typeof upsertPropertyTranslations>[1]
    );
  } catch (err) {
    console.error("Upsert translations failed:", err);
  }
}

async function clearTranslationFieldsBestEffort(propertyId: number, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    clearPropertyTranslationFields(propertyId, keys as (keyof TranslationFields)[]);
  } catch (err) {
    console.error("Clear translation fields failed:", err);
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ properties: getAllProperties() });
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const parsed = parsePropertyPayload(body as Record<string, unknown>);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (typeof parsed.data.title !== "string" || !parsed.data.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // parsePropertyPayload builds `clean` from known field lists only, so
    // unknown fields such as sourceLocale never reach the base write.
    const sourceLocale = parseSourceLocale(body as Record<string, unknown>);

    const translatableFields = buildTranslationFields(parsed.data);
    const { toTranslate, clearedKeys } = partitionTranslatableFields(translatableFields);
    const hasTranslatable = Object.keys(toTranslate).length > 0;

    // Base row stays English. For non-en sources the EN translations are
    // resolved before the insert so they can replace the source text.
    const baseData: Record<string, unknown> = { ...parsed.data };
    delete baseData.sourceLocale;

    let pendingTranslations: Record<string, TranslationFields> | null = null;
    if (sourceLocale !== "en" && hasTranslatable) {
      try {
        pendingTranslations = (await translateToAllLocales(
          sourceLocale,
          toTranslate
        )) as unknown as Record<string, TranslationFields>;
        applyEnTranslationsToBase(baseData, toTranslate, pendingTranslations);
      } catch (err) {
        console.error("Translation failed for new property:", err);
        pendingTranslations = null;
      }
    }

    const property = insertProperty(
      baseData as unknown as PropertyFormData & {
        slug?: string;
      }
    );
    if (!property) {
      return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
    }

    let responseTranslations: Record<string, Record<string, string>> = {};
    if (sourceLocale === "en") {
      if (hasTranslatable) {
        try {
          const translations = await translateToAllLocales("en", toTranslate);
          upsertTranslationsBestEffort(
            property.id,
            translations as unknown as Record<string, TranslationFields>
          );
          responseTranslations = buildResponseTranslations(translations, sourceLocale, toTranslate);
        } catch (err) {
          console.error("Translation failed for new property:", err);
        }
      }
    } else if (pendingTranslations) {
      try {
        const verbatim = buildVerbatimSourceFields(toTranslate);
        if (Object.keys(verbatim).length > 0) {
          upsertTranslationsBestEffort(property.id, { [sourceLocale]: verbatim });
        }
        upsertTranslationsBestEffort(
          property.id,
          collectOtherLocaleTranslations(pendingTranslations, sourceLocale)
        );
        responseTranslations = buildResponseTranslations(
          pendingTranslations,
          sourceLocale,
          toTranslate
        );
      } catch (err) {
        console.error("Translation failed for new property:", err);
      }
    }

    if (clearedKeys.length > 0) {
      await clearTranslationFieldsBestEffort(property.id, clearedKeys);
    }

    return NextResponse.json({ property, translations: responseTranslations, clearedKeys });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const record = body as Record<string, unknown>;
    const id = coerceNumber(record.id);
    if (id === null || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Valid numeric id is required" }, { status: 400 });
    }

    const parsed = parsePropertyPayload(record);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    delete parsed.data.id;
    delete parsed.data.sourceLocale;

    const sourceLocale = parseSourceLocale(record);

    const translatableFields = buildTranslationFields(parsed.data);
    const { toTranslate, clearedKeys } = partitionTranslatableFields(translatableFields);
    const hasTranslatable = Object.keys(toTranslate).length > 0;

    // Base row stays English. For non-en sources the EN translations are
    // resolved before the update so they can replace the source text.
    const baseData: Record<string, unknown> = { ...parsed.data };

    let pendingTranslations: Record<string, TranslationFields> | null = null;
    if (sourceLocale !== "en" && hasTranslatable) {
      try {
        pendingTranslations = (await translateToAllLocales(
          sourceLocale,
          toTranslate
        )) as unknown as Record<string, TranslationFields>;
        applyEnTranslationsToBase(baseData, toTranslate, pendingTranslations);
      } catch (err) {
        console.error("Translation failed for updated property:", err);
        pendingTranslations = null;
      }
    }

    const property = updateProperty(id, baseData as Partial<PropertyFormData>);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    let responseTranslations: Record<string, Record<string, string>> = {};
    if (sourceLocale === "en") {
      if (hasTranslatable) {
        try {
          const translations = await translateToAllLocales("en", toTranslate);
          upsertTranslationsBestEffort(
            property.id,
            translations as unknown as Record<string, TranslationFields>
          );
          responseTranslations = buildResponseTranslations(translations, sourceLocale, toTranslate);
        } catch (err) {
          console.error("Translation failed for updated property:", err);
        }
      }
    } else if (pendingTranslations) {
      try {
        const verbatim = buildVerbatimSourceFields(toTranslate);
        if (Object.keys(verbatim).length > 0) {
          upsertTranslationsBestEffort(property.id, { [sourceLocale]: verbatim });
        }
        upsertTranslationsBestEffort(
          property.id,
          collectOtherLocaleTranslations(pendingTranslations, sourceLocale)
        );
        responseTranslations = buildResponseTranslations(
          pendingTranslations,
          sourceLocale,
          toTranslate
        );
      } catch (err) {
        console.error("Translation failed for updated property:", err);
      }
    }

    if (clearedKeys.length > 0) {
      await clearTranslationFieldsBestEffort(property.id, clearedKeys);
    }

    return NextResponse.json({ property, translations: responseTranslations, clearedKeys });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { ids } = body as { ids?: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const db = new Database(dbPath);
    const placeholders = ids.map(() => "?").join(",");
    const stmt = db.prepare(`DELETE FROM properties WHERE id IN (${placeholders})`);
    const info = stmt.run(...ids);

    return NextResponse.json({ deleted: info.changes });
  } catch {
    const idParam = new URL(request.url).searchParams.get("id");
    const id = Number(idParam);
    if (!idParam || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Valid id query parameter is required" }, { status: 400 });
    }

    if (!deleteProperty(id)) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: 1 });
  }
}

export async function PATCH(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { ids, status } = body as { ids?: unknown; status?: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }
    if (typeof status !== "string" || !["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "status must be 'active' or 'inactive'" }, { status: 400 });
    }

    const db = new Database(dbPath);
    const placeholders = ids.map(() => "?").join(",");
    const stmt = db.prepare(`UPDATE properties SET status = ? WHERE id IN (${placeholders})`);
    const info = stmt.run(status, ...ids);

    return NextResponse.json({ updated: info.changes });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
