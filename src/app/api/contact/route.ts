import { NextResponse } from "next/server";
import { insertMessage } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, lastName, email, phone, subject, message, website } = body;

    // Honeypot check
    if (website) {
      return NextResponse.json({ ok: true }); // Silent success for bots
    }

    const errors: Record<string, string> = {};

    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "First name is required";
    }
    if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!email || typeof email !== "string") {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email address";
    }
    if (!subject || typeof subject !== "string") {
      errors.subject = "Subject is required";
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      errors.message = "Message is required";
    } else if (message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", fields: errors }, { status: 400 });
    }

    const result = insertMessage({
      name: name.trim(),
      email: email.trim(),
      phone: phone || undefined,
      subject,
      message: message.trim(),
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // Forward via email (non-blocking)
    const toEmail = process.env.SMTP_TO || "misha.mumladze2007@gmail.com";
    sendMail({
      to: toEmail,
      subject: `[QMAX Contact] ${subject} - ${name} ${lastName}`,
      text: `New contact form submission:\n\nName: ${name} ${lastName}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${name} ${lastName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || "N/A"}</p><p><strong>Subject:</strong> ${subject}</p><hr/><p>${message.replace(/\n/g, "<br/>")}</p>`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: result.id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
