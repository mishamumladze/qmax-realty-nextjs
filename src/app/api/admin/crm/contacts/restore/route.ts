import { NextResponse } from "next/server";
import { restoreCrmContacts } from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

async function requireAuth(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  return verifyToken(token);
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
      !Array.isArray(record.ids) ||
      record.ids.length === 0 ||
      !record.ids.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)
    ) {
      return NextResponse.json({ error: "ids must be a non-empty array of ids" }, { status: 400 });
    }
    const count = restoreCrmContacts(record.ids as number[]);
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
