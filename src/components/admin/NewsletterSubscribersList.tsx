"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NewsletterSubscriber } from "@/types/admin";
import { Button } from "@/components/ui/Buttons";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

function sortByNewest(list: NewsletterSubscriber[]): NewsletterSubscriber[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    const va = Number.isNaN(ta) ? 0 : ta;
    const vb = Number.isNaN(tb) ? 0 : tb;
    return vb - va;
  });
}

function formatDateTime(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return iso;
  return new Date(iso).toLocaleString();
}

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem("admin_token");
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

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
    const record = (parsed ?? {}) as { error?: string };
    throw new Error(record.error || res.statusText || `Request failed (${res.status})`);
  }

  return parsed as T;
}

export function NewsletterSubscribersList() {
  const t = useTranslations("Components.Admin.NewsletterSubscribers");
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<NewsletterSubscriber | null>(null);
  const [undoItem, setUndoItem] = useState<{ sub: NewsletterSubscriber } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const titleId = useId();
  const descId = useId();

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await adminFetch<{
        subscribers: NewsletterSubscriber[];
      }>("/api/admin/newsletter");
      setLoadError(null);
      setSubscribers(sortByNewest(data.subscribers));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (confirmTarget) {
      const cancel = panelRef.current?.querySelector<HTMLButtonElement>("button");
      cancelRef.current = cancel ?? null;
      cancelRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [confirmTarget]);

  const closeDialog = useCallback(() => {
    setConfirmTarget(null);
  }, []);

  const requestRemove = (
    sub: NewsletterSubscriber,
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> | undefined
  ) => {
    if (e?.currentTarget) triggerRef.current = e.currentTarget;
    setConfirmTarget(sub);
  };

  const confirmRemove = async () => {
    if (!confirmTarget) return;
    const sub = confirmTarget;
    const id = sub.id;

    setSubscribers((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    closeDialog();

    try {
      await adminFetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      if (timerRef.current) clearTimeout(timerRef.current);
      setUndoItem({ sub });
      timerRef.current = setTimeout(() => setUndoItem(null), 8000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setRowErrors((prev) => ({ ...prev, [id]: message }));
      setSubscribers((prev) => (prev ? sortByNewest([...prev, sub]) : prev));
    }
  };

  const performUndo = async () => {
    if (!undoItem) return;
    const sub = undoItem.sub;

    try {
      const data = await adminFetch<{ subscriber: NewsletterSubscriber }>("/api/admin/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: sub.email }),
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setUndoItem(null);
      setSubscribers((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        const pos = next.findIndex((s) => s.id === sub.id);
        if (pos >= 0) {
          next[pos] = data.subscriber;
        } else {
          next.push(data.subscriber);
        }
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGlobalError(message);
      setSubscribers((prev) => (prev ? sortByNewest([...prev, sub]) : prev));
    }
  };

  return (
    <div>
      <p aria-live="polite" role="status" className="sr-only">
        {globalError}
      </p>

      {subscribers === null && !loadError ? (
        <p className="text-gray-600 dark:text-gray-300">{t("loading")}</p>
      ) : loadError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900
            dark:bg-red-950 dark:text-red-300"
        >
          <p className="mb-3 text-sm">{loadError}</p>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11"
            onClick={() => {
              void load();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      ) : !subscribers || subscribers.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {subscribers.map((s) => (
            <li key={s.id} className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="block truncate font-medium text-gray-900 dark:text-gray-100">
                    {s.email}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {t("Labels.subscribed_at", { date: formatDateTime(s.created_at) })}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-11"
                  aria-label={t("Aria.remove_subscriber", { email: s.email })}
                  onClick={(e) => requestRemove(s, e)}
                >
                  <Trash2 aria-hidden="true" />
                  {t("Buttons.remove")}
                </Button>
              </div>
              {rowErrors[s.id] ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{rowErrors[s.id]}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {confirmTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-gray-800"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeDialog();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {t("Dialog.title")}
            </h2>
            <p id={descId} className="mb-6 text-sm text-gray-600 dark:text-gray-300">
              {t("Dialog.description", { email: confirmTarget.email })}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" autoFocus className="min-h-11" onClick={closeDialog}>
                {t("Buttons.cancel")}
              </Button>
              <Button variant="destructive" className="min-h-11" onClick={confirmRemove}>
                {t("Buttons.remove")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {undoItem ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3
            rounded-lg bg-gray-200 px-4 py-3 text-gray-700 shadow-lg dark:bg-gray-800
            dark:text-gray-300"
        >
          <span className="text-sm">{t("Toast.removed")}</span>
          <Button variant="secondary" size="sm" className="min-h-11" onClick={performUndo}>
            {t("Buttons.undo")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
