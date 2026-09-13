import { NextResponse } from "next/server";
import {
  deleteCrmContacts,
  findCrmDuplicates,
  getCrmContactById,
  insertCrmActivity,
  insertCrmContact,
  listCrmContacts,
  updateCrmContact,
} from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";
import type { CrmStatus } from "@/types/admin";

const CRM_STATUSES: CrmStatus[] = ["prospect", "lead", "customer", "archived"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAuth(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  return verifyToken(token);
}

function parsePageLimit(params: URLSearchParams): { page: number; limit: number } {
  const rawPage = Number(params.get("page"));
  const rawLimit = Number(params.get("limit"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
  return { page, limit };
}

export async function GET(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const statusParam = params.get("status");
  if (statusParam && !(CRM_STATUSES as string[]).includes(statusParam)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const { page, limit } = parsePageLimit(params);

  const { rows, total } = listCrmContacts({
    q: params.get("q") ?? undefined,
    status: (statusParam as CrmStatus | null) ?? undefined,
    tag: params.get("tag") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sort: params.get("sort") ?? undefined,
    page,
    limit,
  });

  return NextResponse.json({ contacts: rows, total, page, limit });
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

    const firstName = typeof record.first_name === "string" ? record.first_name.trim() : "";
    if (!firstName) {
      return NextResponse.json({ error: "first_name is required" }, { status: 400 });
    }
    const email = typeof record.email === "string" && record.email.trim() ? record.email.trim() : null;
    const phone = typeof record.phone === "string" && record.phone.trim() ? record.phone.trim() : null;
    if (!email && !phone) {
      return NextResponse.json({ error: "email or phone is required" }, { status: 400 });
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    let status: CrmStatus = "prospect";
    if (record.status !== undefined && record.status !== null && record.status !== "") {
      if (typeof record.status !== "string" || !(CRM_STATUSES as string[]).includes(record.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      status = record.status as CrmStatus;
    }

    let tags: string[] | undefined;
    if (record.tags !== undefined) {
      if (!Array.isArray(record.tags) || !record.tags.every((t) => typeof t === "string")) {
        return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
      }
      tags = (record.tags as string[]).map((t) => t.trim()).filter(Boolean);
    }

    const contact = insertCrmContact({
      first_name: firstName,
      last_name:
        typeof record.last_name === "string" && record.last_name.trim()
          ? record.last_name.trim()
          : null,
      email,
      phone,
      status,
      tags,
      source:
        typeof record.source === "string" && record.source.trim() ? record.source.trim() : null,
    });
    if (!contact) {
      return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
    }

    const duplicates = findCrmDuplicates(email, phone, contact.id);
    return NextResponse.json({ contact, duplicates });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

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
      fields.status !== undefined &&
      (typeof fields.status !== "string" || !(CRM_STATUSES as string[]).includes(fields.status))
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (fields.email !== undefined && fields.email !== null) {
      if (typeof fields.email !== "string" || !fields.email.trim()) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
      if (!EMAIL_RE.test(fields.email.trim())) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }
    if (fields.tags !== undefined && (!Array.isArray(fields.tags) || !fields.tags.every((t) => typeof t === "string"))) {
      return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
    }

    const normalized: Record<string, unknown> = {};
    for (const key of ["first_name", "last_name", "email", "phone", "status", "tags", "source"]) {
      if (fields[key] !== undefined) normalized[key] = fields[key];
    }
    for (const key of ["first_name", "last_name", "email", "phone", "source"]) {
      if (typeof normalized[key] === "string") {
        const trimmed = (normalized[key] as string).trim();
        normalized[key] = trimmed ? trimmed : null;
      }
    }
    if (Array.isArray(normalized.tags)) {
      normalized.tags = (normalized.tags as string[]).map((t) => t.trim()).filter(Boolean);
    }
    if (typeof normalized.first_name === "string" && !(normalized.first_name as string)) {
      return NextResponse.json({ error: "first_name cannot be empty" }, { status: 400 });
    }

    const before = getCrmContactById(record.id);
    const contact = updateCrmContact(record.id, normalized as Parameters<typeof updateCrmContact>[1]);
    if (before && contact && before.status !== contact.status) {
      try {
        insertCrmActivity({
          contact_id: record.id,
          kind: "status",
          body: `Status: ${before.status} → ${contact.status}`,
        });
      } catch {
        // status log is best-effort — never fail the update
      }
    }
    if (!contact) {
      if (!getCrmContactById(record.id)) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ids: number[] = [];
  const idParam = new URL(request.url).searchParams.get("id");
  if (idParam) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Valid id query parameter is required" }, { status: 400 });
    }
    ids = [id];
  } else {
    try {
      const body = await request.json();
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const record = body as Record<string, unknown>;
      if (
        !Array.isArray(record.ids) ||
        record.ids.length === 0 ||
        !record.ids.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)
      ) {
        return NextResponse.json({ error: "ids must be a non-empty array of ids" }, { status: 400 });
      }
      ids = record.ids as number[];
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  const count = deleteCrmContacts(ids);
  if (count === 0) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, count });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
