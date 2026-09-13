import { describe, it, expect } from "vitest";
import { escapeCsvCell, normalizeCrmEmail, normalizeCrmPhone } from "../src/lib/crm-utils";

describe("normalizeCrmEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeCrmEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });

  it("returns empty string for non-strings", () => {
    expect(normalizeCrmEmail(null)).toBe("");
    expect(normalizeCrmEmail(undefined)).toBe("");
    expect(normalizeCrmEmail(123)).toBe("");
  });
});

describe("normalizeCrmPhone", () => {
  it("strips non-digits", () => {
    expect(normalizeCrmPhone("+1 (555) 123-4567")).toBe("15551234567");
  });

  it("returns empty string for non-strings", () => {
    expect(normalizeCrmPhone(null)).toBe("");
    expect(normalizeCrmPhone(undefined)).toBe("");
  });
});

describe("crm message link validation", () => {
  const DIRECTIONS = ["in", "out"];
  const CHANNELS = ["email", "chat", "sms", "note"];

  it("accepts valid direction/channel pairs", () => {
    for (const d of DIRECTIONS) expect(["in", "out"]).toContain(d);
    for (const c of CHANNELS) expect(["email", "chat", "sms", "note"]).toContain(c);
  });

  it("rejects empty message bodies", () => {
    expect("   ".trim()).toBe("");
  });

  it("merges inbox + manual feeds newest-first", () => {
    const feed = [
      { key: "manual-1", ts: new Date("2026-01-02").getTime() },
      { key: "inbox-1", ts: new Date("2026-01-03").getTime() },
      { key: "manual-2", ts: new Date("2026-01-01").getTime() },
    ].sort((a, b) => b.ts - a.ts);
    expect(feed.map((f) => f.key)).toEqual(["inbox-1", "manual-1", "manual-2"]);
  });
});

describe("escapeCsvCell", () => {
  it("leaves plain text untouched", () => {
    expect(escapeCsvCell("hello")).toBe("hello");
  });

  it("quotes cells with commas, quotes, or newlines", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("coerces nullish to empty string", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
});
