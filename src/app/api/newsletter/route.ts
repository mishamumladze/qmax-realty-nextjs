import { NextResponse } from "next/server";
import { insertSubscriber } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const result = insertSubscriber(email.trim().toLowerCase());
    if (!result?.success) {
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // Try to send welcome email (non-blocking)
    sendMail({
      to: process.env.SMTP_TO || "misha.mumladze2007@gmail.com",
      subject: "Welcome to QMAX Realty Newsletter",
      text: `Welcome! You've been subscribed to the QMAX Realty newsletter with ${email}.`,
      html: `<p>Welcome! You've been subscribed to the QMAX Realty newsletter with <strong>${email}</strong>.</p>`,
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({ ok: true, alreadyExists: result.alreadyExists });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
