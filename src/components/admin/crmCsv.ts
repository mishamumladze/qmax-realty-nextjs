import type { CrmContact } from "@/types/admin";
import { escapeCsvCell } from "@/lib/crm-utils";

const CRM_CSV_HEADERS = [
  "id",
  "name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "status",
  "tags",
  "source",
  "created_at",
  "last_activity_at",
];

export function buildCrmCsv(contacts: CrmContact[]): string {
  const lines = [CRM_CSV_HEADERS.join(",")];
  for (const c of contacts) {
    const name = [c.first_name, c.last_name ?? ""].join(" ").trim();
    lines.push(
      [
        c.id,
        name,
        c.first_name,
        c.last_name ?? "",
        c.email ?? "",
        c.phone ?? "",
        c.status,
        (c.tags ?? []).join("; "),
        c.source ?? "",
        c.created_at,
        c.last_activity_at ?? "",
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}

export function crmCsvFilename(now: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `crm-contacts-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.csv`;
}

export function downloadCrmCsv(contacts: CrmContact[], filename?: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([buildCrmCsv(contacts)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? crmCsvFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
