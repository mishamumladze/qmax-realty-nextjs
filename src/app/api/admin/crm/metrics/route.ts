import { NextResponse } from "next/server";
import { getCrmMetrics } from "@/lib/db";
import { verifyToken } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getCrmMetrics());
}
