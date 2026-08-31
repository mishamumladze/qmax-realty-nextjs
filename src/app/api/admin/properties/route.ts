import { NextResponse } from "next/server";
import {
  deleteProperty,
  getAllProperties,
  insertProperty,
  updateProperty,
  upsertPropertyTranslations,
} from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";
import { PropertyFormData } from "@/types/admin";
import { translateToAllLocales, TranslationFields } from "@/lib/translations";

const NUMERIC_FIELDS = ["rooms", "bedrooms", "bathrooms", "sqmt", "price", "year_built"] as const;
const TEXT_FIELDS = [
  "type",
  "subtitle",
  "location",
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
] as const;
const ARRAY_FIELDS = ["inclusions", "gallery"] as const;

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

  if (record.parking !== undefined) {
    const parking = coerceBoolean(record.parking);
    if (parking === null) {
      return { error: "Invalid parking value" };
    }
    clean.parking = parking;
  }

  for (const field of ARRAY_FIELDS) {
    const raw = record[field];
    if (raw === undefined) continue;
    if (!Array.isArray(raw) || raw.some((item) => typeof item !== "string")) {
      return { error: `${field} must be an array of strings` };
    }
    clean[field] = raw;
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
  ];

  for (const key of translatableKeys) {
    const value = data[key];
    if (value !== undefined) {
      (fields as Record<string, unknown>)[key] = value;
    }
  }

  return fields;
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

    const property = insertProperty(
      parsed.data as unknown as PropertyFormData & {
        slug?: string;
      }
    );
    if (!property) {
      return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
    }

    const translatableFields = buildTranslationFields(parsed.data);
    if (Object.keys(translatableFields).length > 0) {
      try {
        const translations = await translateToAllLocales("en", translatableFields);
        upsertPropertyTranslations(property.id, translations);
      } catch (err) {
        console.error("Translation failed for new property:", err);
      }
    }

    return NextResponse.json({ property });
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

    const property = updateProperty(id, parsed.data as Partial<PropertyFormData>);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const translatableFields = buildTranslationFields(parsed.data);
    if (Object.keys(translatableFields).length > 0) {
      try {
        const translations = await translateToAllLocales("en", translatableFields);
        upsertPropertyTranslations(property.id, translations);
      } catch (err) {
        console.error("Translation failed for updated property:", err);
      }
    }

    return NextResponse.json({ property });
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

  const idParam = new URL(request.url).searchParams.get("id");
  const id = Number(idParam);
  if (!idParam || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Valid id query parameter is required" }, { status: 400 });
  }

  if (!deleteProperty(id)) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
