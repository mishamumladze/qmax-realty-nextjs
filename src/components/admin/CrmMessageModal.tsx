"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Buttons";

export function formatCrmPreview(text: string | null, max = 160): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

export function CrmMessageModal({
  title,
  subtitle,
  date,
  badges,
  body,
  footer,
  onClose,
}: {
  title: string;
  subtitle?: string | null;
  date?: string | null;
  badges?: ReactNode;
  body: string;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const t = useTranslations("Components.Admin.Crm");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<Element | null>(null);
  const titleId = `crm-msg-title-${useId()}`;

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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white
          shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-3 border-b border-gray-100 p-6 pb-4
            dark:border-gray-700"
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            ) : null}
            {date ? (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{date}</p>
            ) : null}
            {badges ? <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div> : null}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0"
            aria-label={t("Buttons.close")}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true"/>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200"
          >
            {body}
          </p>
        </div>
        {footer ? (
          <div
            className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 p-4
              dark:border-gray-700"
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
