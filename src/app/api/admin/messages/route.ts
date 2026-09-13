import { NextResponse } from "next/server";
import {
  countUnlinkedMessages,
  deleteMessage,
  getAllMessages,
  getCrmContactById,
  insertMessage,
  linkMessageToContact,
  listMessagesByContact,
  listUnlinkedMessages,
  setMessageRead,
} from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const contactIdParam = params.get("contact_id");
  if (contactIdParam) {
    const contactId = Number(contactIdParam);
    if (!Number.isInteger(contactId) || contactId <= 0) {
      return NextResponse.json(
        { error: "Valid contact_id query parameter is required" },
        { status: 400 }
      );
    }
    return NextResponse.json({ messages: listMessagesByContact(contactId) });
  }
  if (params.get("unlinked") === "1") {
    return NextResponse.json({
      messages: listUnlinkedMessages(),
      unlinked: countUnlinkedMessages(),
    });
  }

  return NextResponse.json({ messages: getAllMessages(), unlinked: countUnlinkedMessages() });
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

    const record = body as Record<string, unknown>;
    if (typeof record.id !== "number" || !Number.isInteger(record.id) || record.id <= 0) {
      return NextResponse.json({ error: "Valid numeric id is required" }, { status: 400 });
    }
    if (record.contact_id !== undefined) {
      if (
        record.contact_id !== null &&
        (typeof record.contact_id !== "number" ||
          !Number.isInteger(record.contact_id) ||
          record.contact_id <= 0)
      ) {
        return NextResponse.json({ error: "contact_id must be a valid id or null" }, { status: 400 });
      }
      if (record.contact_id !== null && !getCrmContactById(record.contact_id)) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      if (!linkMessageToContact(record.id, record.contact_id)) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }
    if (typeof record.read !== "boolean") {
      return NextResponse.json({ error: "read must be a boolean" }, { status: 400 });
    }

    if (!setMessageRead(record.id, record.read)) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
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

    const record = body as Record<string, unknown>;
    for (const field of ["name", "email", "message"]) {
      const value = record[field];
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const result = insertMessage({
      name: (record.name as string).trim(),
      email: (record.email as string).trim(),
      phone:
        typeof record.phone === "string" && record.phone.trim() ? record.phone.trim() : undefined,
      subject:
        typeof record.subject === "string" && record.subject.trim()
          ? record.subject.trim()
          : undefined,
      message: (record.message as string).trim(),
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.id });
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

  if (!deleteMessage(id)) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
