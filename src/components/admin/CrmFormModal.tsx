"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, X } from "lucide-react";
import type { CrmContact, CrmStatus } from "@/types/admin";
import { normalizeCrmEmail, normalizeCrmPhone } from "@/lib/crm-utils";
import { Button } from "@/components/ui/Buttons";
import { crmDisplayName } from "./CrmTable";

const STATUSES: CrmStatus[] = ["prospect", "lead", "customer", "archived"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error("Network request failed.");
  }
  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new Error("Unexpected server response.");
  }
  if (!res.ok) {
    const errObj = parsed as { error?: unknown };
    throw new Error(
      typeof errObj.error === "string"
        ? errObj.error
        : res.statusText || `Request failed (${res.status})`
    );
  }
  return parsed as T;
}

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 min-h-[44px]";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const errorTextClass = "mt-1 text-sm text-red-600 dark:text-red-400";

export function CrmFormModal({
  contact,
  onClose,
  onSaved,
}: {
  contact: CrmContact | null;
  onClose: () => void;
  onSaved: (contact: CrmContact) => void;
}) {
  const t = useTranslations("Components.Admin.Crm");
  const [firstName, setFirstName] = useState(contact?.first_name ?? "");
  const [lastName, setLastName] = useState(contact?.last_name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [status, setStatus] = useState<CrmStatus>(contact?.status ?? "prospect");
  const [tagsText, setTagsText] = useState((contact?.tags ?? []).join(", "));
  const [source, setSource] = useState(contact?.source ?? "");
  const [duplicates, setDuplicates] = useState<CrmContact[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const prevFocusRef = useRef<Element | null>(null);
  const titleId = `crm-form-title-${contact?.id ?? "new"}`;

  useEffect(() => {
    prevFocusRef.current = document.activeElement;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prevFocusRef.current instanceof HTMLElement) prevFocusRef.current.focus();
    };
  }, [onClose]);

  const contactId = contact?.id ?? null;

  useEffect(() => {
    if (!email.trim() && !phone.trim()) return;
    const subscription = setTimeout(() => {
      const requestEmail = email;
      const requestPhone = phone;
      const request = adminFetch<{ contacts: CrmContact[] }>(
        `/api/admin/crm/contacts?q=${encodeURIComponent(
          requestEmail.trim() || requestPhone.trim()
        )}&limit=50`
      );
      const handle = (async (): Promise<void> => {
        try {
          const data = await request;
          const normEmail = normalizeCrmEmail(requestEmail);
          const normPhone = normalizeCrmPhone(requestPhone);
          setDuplicates(
            data.contacts.filter((c) => {
              if (contactId && c.id === contactId) return false;
              const rowEmail = normalizeCrmEmail(c.email ?? "");
              const rowPhone = normalizeCrmPhone(c.phone ?? "");
              if (normEmail && rowEmail && rowEmail === normEmail) return true;
              if (normPhone && rowPhone && rowPhone === normPhone) return true;
              return false;
            })
          );
        } catch {
          // duplicate pre-check is best-effort; save still validates server-side
        }
      })();
      void handle;
    }, 300);
    return () => clearTimeout(subscription);
  }, [email, phone, contactId]);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (saving) return;
    setFieldError(null);
    setSaveError(null);

    const fn = firstName.trim();
    if (!fn) {
      setFieldError(t("Form.required_first"));
      return;
    }
    const em = email.trim() ? email.trim() : null;
    const ph = phone.trim() ? phone.trim() : null;
    if (!em && !ph) {
      setFieldError(t("Form.required_contact"));
      return;
    }
    if (em && !EMAIL_RE.test(em)) {
      setFieldError(t("Form.invalid_email"));
      return;
    }
    const tags = tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (contact) {
        const data = await adminFetch<{ contact: CrmContact }>("/api/admin/crm/contacts", {
          method: "PATCH",
          body: JSON.stringify({
            id: contact.id,
            fields: {
              first_name: fn,
              last_name: lastName.trim() ? lastName.trim() : null,
              email: em,
              phone: ph,
              status,
              tags,
              source: source.trim() ? source.trim() : null,
            },
          }),
        });
        onSaved(data.contact);
      } else {
        const data = await adminFetch<{ contact: CrmContact }>("/api/admin/crm/contacts", {
          method: "POST",
          body: JSON.stringify({
            first_name: fn,
            last_name: lastName.trim() ? lastName.trim() : null,
            email: em,
            phone: ph,
            status,
            tags,
            source: source.trim() ? source.trim() : null,
          }),
        });
        onSaved(data.contact);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl
          dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
            {contact ? t("Form.title_edit") : t("Form.title_add")}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px] min-w-[44px]"
            aria-label={t("Buttons.close")}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true"/>
          </Button>
        </div>

        {duplicates.length > 0 ? (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-2xl border border-yellow-300 bg-yellow-50
              p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30
              dark:text-yellow-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>
            <div>
              <p className="font-medium">{t("Form.duplicate_warning")}</p>
              <ul className="mt-1 list-disc pl-4">
                {duplicates.slice(0, 3).map((d) => (
                  <li key={d.id}>{crmDisplayName(d)}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="crm-first-name" className={labelClass}>
              {t("Form.first_name")}
            </label>
            <input
              ref={firstFieldRef}
              id="crm-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              autoComplete="given-name"
           />
          </div>
          <div>
            <label htmlFor="crm-last-name" className={labelClass}>
              {t("Form.last_name")}
            </label>
            <input
              id="crm-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              autoComplete="family-name"
           />
          </div>
          <div>
            <label htmlFor="crm-email" className={labelClass}>
              {t("Form.email")}
            </label>
            <input
              id="crm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
           />
          </div>
          <div>
            <label htmlFor="crm-phone" className={labelClass}>
              {t("Form.phone")}
            </label>
            <input
              id="crm-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              autoComplete="tel"
           />
          </div>
          <div>
            <label htmlFor="crm-status" className={labelClass}>
              {t("Form.status")}
            </label>
            <select
              id="crm-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CrmStatus)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`Status.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="crm-source" className={labelClass}>
              {t("Form.source")}
            </label>
            <input
              id="crm-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={inputClass}
           />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="crm-tags" className={labelClass}>
              {t("Form.tags")}
            </label>
            <input
              id="crm-tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder={t("Form.tags_hint")}
              className={inputClass}
           />
          </div>
          {fieldError ? (
            <p className={`${errorTextClass} sm:col-span-2`} role="alert">
              {fieldError}
            </p>
          ) : null}
          {saveError ? (
            <p className={`${errorTextClass} sm:col-span-2`} role="alert">
              {saveError}
            </p>
          ) : null}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" className="min-h-[44px] w-full sm:w-auto" onClick={onClose}>
              {t("Buttons.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-h-[44px] w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? t("Buttons.saving") : t("Buttons.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
