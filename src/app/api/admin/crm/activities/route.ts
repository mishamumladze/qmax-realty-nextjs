import { NextResponse } from "next/server";
import {
  deleteCrmActivity,
  getCrmContactById,
  insertCrmActivity,
  listCrmActivities,
  updateCrmActivity,
} from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";
import type { CrmActivityKind } from "@/types/admin";

const CRM_KINDS: CrmActivityKind[] = ["call", "email", "meeting", "note"];

async function requireAuth(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  return verifyToken(token);
}

export async function GET(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contactIdParam = new URL(request.url).searchParams.get("contact_id");
  const contactId = Number(contactIdParam);
  if (!contactIdParam || !Number.isInteger(contactId) || contactId <= 0) {
    return NextResponse.json(
      { error: "Valid contact_id query parameter is required" },
      { status: 400 }
    );
  }
  if (!getCrmContactById(contactId)) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ activities: listCrmActivities(contactId) });
}

export async function POST(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const record = body as Record<string, unknown>;

    if (
      typeof record.contact_id !== "number" ||
      !Number.isInteger(record.contact_id) ||
      record.contact_id <= 0
    ) {
      return NextResponse.json({ error: "Valid numeric contact_id is required" }, { status: 400 });
    }
    if (typeof record.kind !== "string" || !(CRM_KINDS as string[]).includes(record.kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    if (!getCrmContactById(record.contact_id)) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const activity = insertCrmActivity({
      contact_id: record.contact_id,
      kind: record.kind as CrmActivityKind,
      body:
        typeof record.body === "string" && record.body.trim() ? record.body.trim() : null,
      occurred_at:
        typeof record.occurred_at === "string" && record.occurred_at.trim()
          ? record.occurred_at.trim()
          : undefined,
    });
    if (!activity) {
      return NextResponse.json({ error: "Failed to save activity" }, { status: 500 });
    }
    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

const EDITABLE_KINDS: CrmActivityKind[] = ["call", "email", "meeting", "note"];

export async function PATCH(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const record = body as Record<string, unknown>;
    if (typeof record.id !== "number" || !Number.isInteger(record.id) || record.id <= 0) {
      return NextResponse.json({ error: "Valid numeric id is required" }, { status: 400 });
    }
    if (typeof record.fields !== "object" || record.fields === null || Array.isArray(record.fields)) {
      return NextResponse.json({ error: "fields is required" }, { status: 400 });
    }

    const fields = record.fields as Record<string, unknown>;
    if (
      fields.kind !== undefined &&
      (typeof fields.kind !== "string" ||
        !(EDITABLE_KINDS as string[]).includes(fields.kind))
    ) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    if (fields.body !== undefined && fields.body !== null && typeof fields.body !== "string") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    if (
      fields.occurred_at !== undefined &&
      fields.occurred_at !== null &&
      typeof fields.occurred_at !== "string"
    ) {
      return NextResponse.json({ error: "Invalid occurred_at" }, { status: 400 });
    }

    const normalized: { body?: string | null; kind?: CrmActivityKind; occurred_at?: string | null } =
      {};
    if (fields.body !== undefined) {
      normalized.body =
        typeof fields.body === "string" && fields.body.trim() ? fields.body.trim() : null;
    }
    if (fields.kind !== undefined) normalized.kind = fields.kind as CrmActivityKind;
    if (fields.occurred_at !== undefined) {
      normalized.occurred_at =
        typeof fields.occurred_at === "string" && fields.occurred_at.trim()
          ? fields.occurred_at.trim()
          : null;
    }

    const activity = updateCrmActivity(record.id, normalized);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idParam = new URL(request.url).searchParams.get("id");
  const id = Number(idParam);
  if (!idParam || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Valid id query parameter is required" }, { status: 400 });
  }

  if (!deleteCrmActivity(id)) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
