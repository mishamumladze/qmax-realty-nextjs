import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, props, path } = body ?? {};
    if (typeof event !== "string" || event.length === 0 || event.length > 64) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    console.debug("[analytics]", event, { props, path });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
