import { NextResponse } from "next/server";
import {
  deleteCrmMessage,
  getCrmContactById,
  insertCrmMessage,
  listCrmMessages,
  updateCrmMessage,
} from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";
import type { CrmMessageChannel, CrmMessageDirection } from "@/types/admin";

const CRM_DIRECTIONS: CrmMessageDirection[] = ["in", "out"];
const CRM_CHANNELS: CrmMessageChannel[] = ["email", "chat", "sms", "note"];

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
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 50;
  return { page, limit };
}

function validContactId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function GET(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const contactId = Number(params.get("contact_id"));
  if (!params.get("contact_id") || !validContactId(contactId)) {
    return NextResponse.json(
      { error: "Valid contact_id query parameter is required" },
      { status: 400 }
    );
  }
  if (!getCrmContactById(contactId)) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { page, limit } = parsePageLimit(params);
  const { rows, total } = listCrmMessages(contactId, {
    q: params.get("q") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    page,
    limit,
  });
  return NextResponse.json({ messages: rows, total, page, limit });
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

    if (!validContactId(record.contact_id)) {
      return NextResponse.json({ error: "Valid numeric contact_id is required" }, { status: 400 });
    }
    if (
      typeof record.direction !== "string" ||
      !(CRM_DIRECTIONS as string[]).includes(record.direction)
    ) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }
    if (
      typeof record.channel !== "string" ||
      !(CRM_CHANNELS as string[]).includes(record.channel)
    ) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    const bodyText = typeof record.body === "string" ? record.body.trim() : "";
    if (!bodyText) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    if (!getCrmContactById(record.contact_id)) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const message = insertCrmMessage({
      contact_id: record.contact_id,
      direction: record.direction as CrmMessageDirection,
      channel: record.channel as CrmMessageChannel,
      sender:
        typeof record.sender === "string" && record.sender.trim() ? record.sender.trim() : null,
      subject:
        typeof record.subject === "string" && record.subject.trim()
          ? record.subject.trim()
          : null,
      body: bodyText,
      occurred_at:
        typeof record.occurred_at === "string" && record.occurred_at.trim()
          ? record.occurred_at.trim()
          : undefined,
    });
    if (!message) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
    return NextResponse.json({ message });
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
      fields.direction !== undefined &&
      (typeof fields.direction !== "string" ||
        !(CRM_DIRECTIONS as string[]).includes(fields.direction))
    ) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }
    if (
      fields.channel !== undefined &&
      (typeof fields.channel !== "string" ||
        !(CRM_CHANNELS as string[]).includes(fields.channel))
    ) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    if (fields.body !== undefined) {
      if (typeof fields.body !== "string" || !fields.body.trim()) {
        return NextResponse.json({ error: "body cannot be empty" }, { status: 400 });
      }
    }

    const normalized: {
      direction?: CrmMessageDirection;
      channel?: CrmMessageChannel;
      sender?: string | null;
      subject?: string | null;
      body?: string;
      occurred_at?: string | null;
    } = {};
    if (fields.direction !== undefined) normalized.direction = fields.direction as CrmMessageDirection;
    if (fields.channel !== undefined) normalized.channel = fields.channel as CrmMessageChannel;
    if (fields.sender !== undefined) {
      normalized.sender =
        typeof fields.sender === "string" && fields.sender.trim() ? fields.sender.trim() : null;
    }
    if (fields.subject !== undefined) {
      normalized.subject =
        typeof fields.subject === "string" && fields.subject.trim()
          ? fields.subject.trim()
          : null;
    }
    if (fields.body !== undefined) normalized.body = (fields.body as string).trim();
    if (fields.occurred_at !== undefined) {
      normalized.occurred_at =
        typeof fields.occurred_at === "string" && fields.occurred_at.trim()
          ? fields.occurred_at.trim()
          : null;
    }

    const message = updateCrmMessage(record.id, normalized);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    return NextResponse.json({ message });
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

  if (!deleteCrmMessage(id)) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
