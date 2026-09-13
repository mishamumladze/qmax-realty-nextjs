"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { CrmContact, CrmStatus } from "@/types/admin";
import { Button } from "@/components/ui/Buttons";
import { CrmTable, type CrmSortDir, type CrmSortKey } from "./CrmTable";
import type { CrmBulkUndo } from "./CrmTable";
import { CrmFormModal } from "./CrmFormModal";
import { CrmDetailModal } from "./CrmDetailModal";
import { CrmInboxView } from "./CrmInboxView";
import { downloadCrmCsv } from "./crmCsv";

const PAGE_LIMIT = 20;
const UNDO_MS = 8000;
const STATUS_FILTERS: (CrmStatus | "all")[] = ["all", "prospect", "lead", "customer", "archived"];

interface CrmMetrics {
  total: number;
  activeLeads: number;
  conversion: number;
  contacted7d: number;
}

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (init?.body) headers["Content-Type"] = "application/json";
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

function toSortParam(key: CrmSortKey, dir: CrmSortDir): string {
  if (key === "name") return dir === "asc" ? "name:asc" : "name:desc";
  if (key === "created_at") return dir === "asc" ? "created_at:asc" : "created_at:desc";
  return dir === "asc" ? "last_activity_at:asc" : "last_activity_at:desc";
}

interface CrmFilters {
  q: string;
  status: CrmStatus | "all";
  tag: string;
  from: string;
  to: string;
  sort: { key: CrmSortKey; dir: CrmSortDir };
}

export function CrmTab() {
  const t = useTranslations("Components.Admin.Crm");
  const [contacts, setContacts] = useState<CrmContact[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CrmFilters>({
    q: "",
    status: "all",
    tag: "",
    from: "",
    to: "",
    sort: { key: "created_at", dir: "desc" },
  });

  const [qInput, setQInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [view, setView] = useState<"contacts" | "inbox">("contacts");
  const [unlinkedCount, setUnlinkedCount] = useState(0);
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [detail, setDetail] = useState<CrmContact | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "timeline" | "messages">("info");
  const [deleteTarget, setDeleteTarget] = useState<CrmContact[] | null>(null);
  const [undo, setUndo] = useState<CrmBulkUndo | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CrmMetrics>({
    total: 0,
    activeLeads: 0,
    conversion: 0,
    contacted7d: 0,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const countId = useId();

  useEffect(() => {
    const subscription = setTimeout(() => {
      setFilters((prev) => (prev.q === qInput.trim() ? prev : { ...prev, q: qInput.trim() }));
      setPage((prev) => (prev === 1 ? prev : 1));
    }, 300);
    return () => clearTimeout(subscription);
  }, [qInput]);

  useEffect(() => {
    const subscription = setTimeout(() => {
      setFilters((prev) =>
        prev.tag === tagInput.trim() ? prev : { ...prev, tag: tagInput.trim() }
      );
      setPage((prev) => (prev === 1 ? prev : 1));
    }, 300);
    return () => clearTimeout(subscription);
  }, [tagInput]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_LIMIT));
    if (filters.q) params.set("q", filters.q);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", toSortParam(filters.sort.key, filters.sort.dir));
    const request = adminFetch<{ contacts: CrmContact[]; total: number }>(
      `/api/admin/crm/contacts?${params.toString()}`
    );
    const handle = (async (): Promise<void> => {
      try {
        const data = await request;
        if (cancelled) return;
        setContacts(data.contacts);
        setTotal(data.total);
        setLoadError(null);
        setSelectedIds((prev) => {
          const ids = new Set(data.contacts.map((c) => c.id));
          const next = new Set<number>();
          for (const id of prev) if (ids.has(id)) next.add(id);
          return next;
        });
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();
    void handle;
    return () => {
      cancelled = true;
    };
  }, [page, filters]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async (): Promise<void> => {
      try {
        const data = await adminFetch<{ unlinked: number }>("/api/admin/messages?unlinked=1");
        if (cancelled) return;
        setUnlinkedCount(typeof data.unlinked === "number" ? data.unlinked : 0);
      } catch {
        // badge is best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUnlinked = async (): Promise<void> => {
    try {
      const data = await adminFetch<{ unlinked: number }>("/api/admin/messages?unlinked=1");
      setUnlinkedCount(typeof data.unlinked === "number" ? data.unlinked : 0);
    } catch {
      // badge is best-effort
    }
  };

  const runBackfill = async (): Promise<void> => {
    if (backfillBusy) return;
    setBackfillBusy(true);
    setBackfillResult(null);
    try {
      const data = await adminFetch<{ linked: number; created: number }>(
        "/api/admin/messages/link-all",
        { method: "POST" }
      );
      setBackfillResult(t("Inbox.backfill_done", { linked: data.linked, created: data.created }));
      await refreshUnlinked();
      await reload();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setBackfillBusy(false);
    }
  };

  useEffect(() => {
    if (deleteTarget) {
      panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    } else {
      triggerRef.current?.focus();
      triggerRef.current = null;
    }
  }, [deleteTarget]);

  const refreshMetrics = async (): Promise<void> => {
    try {
      const data = await adminFetch<CrmMetrics>("/api/admin/crm/metrics");
      setMetrics(data);
    } catch {
      // metrics are best-effort; list error surfaces separately
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async (): Promise<void> => {
      try {
        const data = await adminFetch<CrmMetrics>("/api/admin/crm/metrics");
        if (cancelled) return;
        setMetrics(data);
      } catch {
        // metrics are best-effort; list error surfaces separately
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const clearUndoTimer = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const reload = async (): Promise<void> => {
    clearUndoTimer();
    setUndo(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_LIMIT));
    if (filters.q) params.set("q", filters.q);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", toSortParam(filters.sort.key, filters.sort.dir));
    try {
      const data = await adminFetch<{ contacts: CrmContact[]; total: number }>(
        `/api/admin/crm/contacts?${params.toString()}`
      );
      setContacts(data.contacts);
      setTotal(data.total);
      setLoadError(null);
      await refreshMetrics();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaved = (saved: CrmContact): void => {
    setFormOpen(false);
    setEditing(null);
    setDetail((prev) => (prev && prev.id === saved.id ? saved : prev));
    void reload();
    void refreshMetrics();
  };

  const requestDeleteOne = (contact: CrmContact, trigger: HTMLElement | null): void => {
    triggerRef.current = trigger;
    setDeleteTarget([contact]);
  };

  const confirmDelete = async (): Promise<void> => {
    const targets = deleteTarget;
    if (!targets || targets.length === 0) return;
    const ids = targets.map((c) => c.id);
    setContacts((prev) => (prev ? prev.filter((c) => !ids.includes(c.id)) : prev));
    setDeleteTarget(null);
    setBulkBusy(true);
    try {
      await adminFetch("/api/admin/crm/contacts", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      });
      clearUndoTimer();
      setUndo({ contacts: targets });
      timerRef.current = setTimeout(() => setUndo(null), UNDO_MS);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
      await reload();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = (): void => {
    const list = contacts ?? [];
    const targets = list.filter((c) => selectedIds.has(c.id));
    if (targets.length === 0) return;
    triggerRef.current = null;
    setDeleteTarget(targets);
  };

  const handleBulkStatus = async (nextStatus: CrmStatus): Promise<void> => {
    const list = contacts ?? [];
    const targets = list.filter((c) => selectedIds.has(c.id));
    if (targets.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    setGlobalError(null);
    const before = targets.map((c) => c.status);
    setContacts((prev) =>
      prev ? prev.map((c) => (selectedIds.has(c.id) ? { ...c, status: nextStatus } : c)) : prev
    );
    try {
      for (const c of targets) {
        await adminFetch("/api/admin/crm/contacts", {
          method: "PATCH",
          body: JSON.stringify({ id: c.id, fields: { status: nextStatus } }),
        });
      }
      clearUndoTimer();
      setUndo({ contacts: targets, statusBefore: before });
      timerRef.current = setTimeout(() => setUndo(null), UNDO_MS);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setBulkBusy(false);
    }
    await reload();
  };

  const handleBulkExport = (): void => {
    const list = contacts ?? [];
    const targets = list.filter((c) => selectedIds.has(c.id));
    if (targets.length === 0) return;
    downloadCrmCsv(targets);
  };

  const performUndo = async (): Promise<void> => {
    const snapshot = undo;
    if (!snapshot) return;
    setGlobalError(null);
    try {
      const statusRestores: { id: number; status: CrmStatus }[] = [];
      const deleteRestores: number[] = [];
      for (let i = 0; i < snapshot.contacts.length; i++) {
        const c = snapshot.contacts[i];
        if (!c) continue;
        const statusBefore = snapshot.statusBefore?.[i];
        if (statusBefore && statusBefore !== c.status) {
          statusRestores.push({ id: c.id, status: statusBefore });
        } else {
          deleteRestores.push(c.id);
        }
      }
      for (const r of statusRestores) {
        await adminFetch("/api/admin/crm/contacts", {
          method: "PATCH",
          body: JSON.stringify({ id: r.id, fields: { status: r.status } }),
        });
      }
      if (deleteRestores.length > 0) {
        // Soft-deleted rows keep activities, messages, and inbox links — restore same ids.
        await adminFetch("/api/admin/crm/contacts/restore", {
          method: "POST",
          body: JSON.stringify({ ids: deleteRestores }),
        });
      }
      clearUndoTimer();
      setUndo(null);
      await reload();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    }
  };

  const openQuickActivity = (contact: CrmContact, kind: "call" | "email" | "meeting"): void => {
    setDetail(contact);
    setDetailTab(kind === "email" ? "messages" : "timeline");
  };

  const updateFilter = (patch: Partial<CrmFilters>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  return (
    <section>
      <p aria-live="polite" role="status" className="sr-only">
        {globalError}
      </p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 font-bold text-balance text-gray-900 dark:text-gray-100">
            {t("Headings.crm")}
          </h1>
          <span
            className="bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200
              inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
          >
            {total}
          </span>
        </div>
        <Button
          variant="primary"
          className="min-h-[44px] w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true"/>
          <span>{t("Buttons.add_contact")}</span>
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={t("Inbox.view_label")}
          className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-100 bg-white p-1
            dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "contacts"}
            onClick={() => setView("contacts")}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm
            font-medium ${
              view === "contacts"
                ? "bg-brand-600 dark:bg-brand-500 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t("Inbox.view_contacts")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "inbox"}
            onClick={() => setView("inbox")}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4
            text-sm font-medium ${
              view === "inbox"
                ? "bg-brand-600 dark:bg-brand-500 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t("Inbox.view_inbox")}
            {unlinkedCount > 0 ? (
              <span
                className="inline-flex items-center rounded-full bg-white/25 px-2 py-0.5 text-xs
                  font-semibold"
              >
                {unlinkedCount}
              </span>
            ) : null}
          </button>
        </div>
        {view === "inbox" ? (
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px] w-full sm:w-auto"
            disabled={backfillBusy}
            onClick={() => void runBackfill()}
          >
            {backfillBusy ? t("Inbox.backfill_busy") : t("Inbox.backfill_button")}
          </Button>
        ) : null}
      </div>
      {backfillResult ? (
        <p aria-live="polite" className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          {backfillResult}
        </p>
      ) : null}

      {view === "contacts" ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700
            dark:bg-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Metrics.total")}</p>
          <p className="text-h3 font-semibold text-gray-900 dark:text-gray-100">{metrics.total}</p>
        </div>
        <div
          className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700
            dark:bg-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Metrics.active_leads")}</p>
          <p className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
            {metrics.activeLeads}
          </p>
        </div>
        <div
          className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700
            dark:bg-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Metrics.conversion")}</p>
          <p className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
            {metrics.conversion}%
          </p>
        </div>
        <div
          className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700
            dark:bg-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Metrics.contacted_7d")}</p>
          <p className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
            {metrics.contacted7d}
          </p>
        </div>
      </div>

      <div
        className="mb-4 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4
          dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="crm-search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("Filters.search_label")}
            </label>
            <input
              id="crm-search"
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder={t("Filters.search_placeholder")}
              className="mt-1 min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3
                py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
           />
          </div>
          <div>
            <label
              htmlFor="crm-tag"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("Filters.tag_label")}
            </label>
            <input
              id="crm-tag"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder={t("Filters.tag_placeholder")}
              className="mt-1 min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3
                py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
           />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="crm-from"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("Filters.from_label")}
              </label>
              <input
                id="crm-from"
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter({ from: e.target.value })}
                className="mt-1 min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3
                  py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
             />
            </div>
            <div>
              <label
                htmlFor="crm-to"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("Filters.to_label")}
              </label>
              <input
                id="crm-to"
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter({ to: e.target.value })}
                className="mt-1 min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3
                  py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
             />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Filters.status_label")}>
          {STATUS_FILTERS.map((s) => {
            const active = filters.status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => updateFilter({ status: s })}
                className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm
                font-medium ${
                  active
                    ? "bg-brand-600 dark:bg-brand-500 text-white"
                    : `bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800
                      dark:text-gray-200 dark:hover:bg-gray-700`
                }`}
              >
                {s === "all" ? t("Filters.all") : t(`Status.${s}`)}
              </button>
            );
          })}
        </div>
      </div>

      <p id={countId} aria-live="polite" className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        {t("Count.results", { count: total })}
      </p>

      {contacts === null && !loadError ? (
        <p className="py-12 text-center text-gray-600 dark:text-gray-300">{t("loading")}</p>
      ) : loadError ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700
            dark:border-red-900 dark:bg-red-900/30 dark:text-red-300"
        >
          <p className="mb-3 text-sm">{loadError}</p>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            onClick={() => void reload()}
          >
            {t("Buttons.retry")}
          </Button>
        </div>
      ) : contacts !== null && contacts.length === 0 ? (
        <p className="py-12 text-center text-gray-600 dark:text-gray-300">{t("Empty.none")}</p>
      ) : (
        <CrmTable
          contacts={contacts ?? []}
          sort={filters.sort}
          onSortChange={(next) => updateFilter({ sort: next })}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onOpenDetail={(c) => {
            setDetail(c);
            setDetailTab("info");
          }}
          onEdit={(c) => {
            setEditing(c);
            setFormOpen(true);
          }}
          onQuickActivity={openQuickActivity}
          onDeleteOne={requestDeleteOne}
          onBulkExport={handleBulkExport}
          onBulkStatus={(s) => void handleBulkStatus(s)}
          onBulkDelete={handleBulkDelete}
          bulkBusy={bulkBusy}
       />
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("Buttons.prev")}
          </Button>
          <p aria-live="polite" className="text-sm text-gray-600 dark:text-gray-300">
            {t("Pagination.page", { page, total: totalPages })}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("Buttons.next")}
          </Button>
        </div>
      ) : null}
        </>
      ) : (
        <CrmInboxView onLinked={() => void refreshUnlinked()}/>
      )}

      {formOpen ? (
        <CrmFormModal
          contact={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
       />
      ) : null}

      {detail ? (
        <CrmDetailModal
          contact={detail}
          initialTab={detailTab}
          onClose={() => setDetail(null)}
          onEdit={(c) => {
            setEditing(c);
            setFormOpen(true);
          }}
          onChanged={() => {
            void reload();
          }}
       />
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onKeyDown={(e) => {
              if (e.key === "Escape") setDeleteTarget(null);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("Dialog.title")}
            </h2>
            <p id={descId} className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t("Dialog.description", { count: deleteTarget.length })}
            </p>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button
                variant="secondary"
                autoFocus
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {t("Buttons.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => void confirmDelete()}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {t("Buttons.delete")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {undo ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3
            rounded-xl bg-gray-900 px-4 py-3 text-white shadow-xl dark:bg-gray-700 dark:text-white"
        >
          <span>{t("Toast.deleted")}</span>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            onClick={() => void performUndo()}
          >
            {t("Buttons.undo")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
