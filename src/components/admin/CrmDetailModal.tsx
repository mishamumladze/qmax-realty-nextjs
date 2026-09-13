"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone, X } from "lucide-react";
import type { CrmContact } from "@/types/admin";
import { Button } from "@/components/ui/Buttons";
import { CrmActivityLog } from "./CrmActivityLog";
import { CrmMessages } from "./CrmMessages";
import { crmDisplayName, formatCrmDateTime } from "./CrmTable";

type DetailTab = "info" | "timeline" | "messages";

export function CrmDetailModal({
  contact,
  initialTab = "info",
  onClose,
  onEdit,
  onChanged,
}: {
  contact: CrmContact;
  initialTab?: DetailTab;
  onClose: () => void;
  onEdit: (contact: CrmContact) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Components.Admin.Crm");
  const [tab, setTab] = useState<DetailTab>(initialTab);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<Element | null>(null);
  const titleId = `crm-detail-title-${contact.id}`;

  useEffect(() => {
    prevFocusRef.current = document.activeElement;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
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

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "info", label: t("Detail.tab_info") },
    { id: "timeline", label: t("Detail.tab_timeline") },
    { id: "messages", label: t("Detail.tab_messages") },
  ];

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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl
          dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
              {crmDisplayName(contact)}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {[contact.email, contact.phone].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border
                border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <Phone className="h-4 w-4" aria-hidden="true"/>
              {t("Buttons.call")}
            </a>
          ) : null}
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border
                border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <Mail className="h-4 w-4" aria-hidden="true"/>
              {t("Buttons.email_log")}
            </a>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            onClick={() => onEdit(contact)}
          >
            {t("Buttons.edit")}
          </Button>
        </div>

        <div
          role="tablist"
          aria-label={t("Detail.tabs_label")}
          className="mt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700"
        >
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={tab === tb.id}
              onClick={() => setTab(tb.id)}
              className={`min-h-[44px] px-3 text-sm font-medium ${
                tab === tb.id
                  ? "border-brand-600 text-brand-700 dark:text-brand-300 border-b-2"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="mt-4" role="tabpanel">
          {tab === "info" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t("Form.status")}</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {t(`Status.${contact.status}`)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t("Form.source")}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{contact.source || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t("Form.tags")}</dt>
                <dd className="mt-1">
                  {(contact.tags ?? []).length === 0 ? (
                    "—"
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {(contact.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                            dark:text-brand-200 inline-flex items-center rounded-full px-2 py-0.5
                            text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t("Columns.created")}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {formatCrmDateTime(contact.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t("Columns.last_activity")}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {formatCrmDateTime(contact.last_activity_at) || "—"}
                </dd>
              </div>
            </dl>
          ) : tab === "timeline" ? (
            <CrmActivityLog contactId={contact.id} onChanged={onChanged}/>
          ) : (
            <CrmMessages contactId={contact.id} onChanged={onChanged}/>
          )}
        </div>
      </div>
    </div>
  );
}
