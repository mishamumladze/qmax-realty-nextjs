import { NextResponse } from "next/server";
import { isValidCredentials, signToken } from "@/lib/admin-auth";
import type { AdminCredentials } from "@/types/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as Partial<AdminCredentials>;

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (!isValidCredentials(username, password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken(username);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
