"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import type { CrmActivity, CrmActivityKind } from "@/types/admin";
import { Button } from "@/components/ui/Buttons";

const KINDS: CrmActivityKind[] = ["call", "email", "meeting", "note"];

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

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 min-h-11";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

export function CrmActivityLog({
  contactId,
  defaultKind = "note",
  onChanged,
}: {
  contactId: number;
  defaultKind?: CrmActivityKind;
  onChanged?: () => void;
}) {
  const t = useTranslations("Components.Admin.Crm");
  const [activities, setActivities] = useState<CrmActivity[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kind, setKind] = useState<CrmActivityKind>(defaultKind);
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CrmActivity | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmPanelRef = useRef<HTMLDivElement | null>(null);
  const confirmTitleId = useId();
  const confirmDescId = useId();

  useEffect(() => {
    if (!deleteTarget) return;
    confirmPanelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [deleteTarget]);

  useEffect(() => {
    let cancelled = false;
    const request = adminFetch<{ activities: CrmActivity[] }>(
      `/api/admin/crm/activities?contact_id=${contactId}`
    );
    const handle = (async (): Promise<void> => {
      try {
        const data = await request;
        if (cancelled) return;
        setActivities(data.activities);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();
    void handle;
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const reload = async (): Promise<void> => {
    try {
      const data = await adminFetch<{ activities: CrmActivity[] }>(
        `/api/admin/crm/activities?contact_id=${contactId}`
      );
      setActivities(data.activities);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    setSaving(true);
    try {
      let occurred_at: string | undefined;
      if (occurredAt.trim()) {
        const d = new Date(occurredAt);
        occurred_at = Number.isNaN(d.getTime()) ? occurredAt.trim() : d.toISOString();
      }
      const data = await adminFetch<{ activity: CrmActivity }>("/api/admin/crm/activities", {
        method: "POST",
        body: JSON.stringify({
          contact_id: contactId,
          kind,
          body: body.trim() ? body.trim() : undefined,
          occurred_at,
        }),
      });
      setActivities((prev) => (prev ? [data.activity, ...prev] : [data.activity]));
      setBody("");
      setOccurredAt("");
      onChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (a: CrmActivity): void => {
    setEditingId(a.id);
    setEditBody(a.body ?? "");
    setFormError(null);
  };

  const saveEdit = async (id: number): Promise<void> => {
    if (editSaving) return;
    setFormError(null);
    setEditSaving(true);
    try {
      const data = await adminFetch<{ activity: CrmActivity }>("/api/admin/crm/activities", {
        method: "PATCH",
        body: JSON.stringify({ id, fields: { body: editBody.trim() ? editBody.trim() : null } }),
      });
      setActivities((prev) => (prev ? prev.map((a) => (a.id === id ? data.activity : a)) : prev));
      setEditingId(null);
      setEditBody("");
      onChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    const target = deleteTarget;
    if (!target || deleteBusy) return;
    setDeleteBusy(true);
    setFormError(null);
    try {
      await adminFetch(`/api/admin/crm/activities?id=${target.id}`, { method: "DELETE" });
      setActivities((prev) => (prev ? prev.filter((a) => a.id !== target.id) : prev));
      setDeleteTarget(null);
      if (editingId === target.id) {
        setEditingId(null);
        setEditBody("");
      }
      onChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`crm-act-kind-${contactId}`} className={labelClass}>
              {t("Activity.kind_label")}
            </label>
            <select
              id={`crm-act-kind-${contactId}`}
              value={kind}
              onChange={(e) => setKind(e.target.value as CrmActivityKind)}
              className={inputClass}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`Activity.kind_${k}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`crm-act-when-${contactId}`} className={labelClass}>
              {t("Activity.occurred_label")}
            </label>
            <input
              id={`crm-act-when-${contactId}`}
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor={`crm-act-body-${contactId}`} className={labelClass}>
            {t("Activity.body_label")}
          </label>
          <textarea
            id={`crm-act-body-${contactId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={t("Activity.body_placeholder")}
            className={`${inputClass} min-h-[88px]`}
          />
        </div>
        {kind === "email" ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("Activity.email_log_only")}
          </p>
        ) : null}
        {formError ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="mt-3 min-h-[44px]"
          disabled={saving}
        >
          {saving ? t("Activity.logging") : t("Activity.log_button")}
        </Button>
      </form>

      {activities === null && !loadError ? (
        <p className="py-6 text-center text-gray-600 dark:text-gray-300">{t("Activity.loading")}</p>
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
      ) : activities !== null && activities.length === 0 ? (
        <p className="py-6 text-center text-gray-600 dark:text-gray-300">{t("Activity.empty")}</p>
      ) : (
        <ol className="space-y-2">
          {(activities ?? []).map((a) => {
            const isSystem = a.kind === "status";
            const isEditing = editingId === a.id;
            return (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-gray-100
                  bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span
                      className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                        dark:text-brand-200 inline-flex items-center rounded-full px-2 py-0.5
                        text-xs"
                    >
                      {t(`Activity.kind_${a.kind}`)}
                    </span>
                    <span className="font-normal text-gray-500 dark:text-gray-400">
                      {a.created_by ?? t("Activity.system_author")}
                    </span>
                    <span className="font-normal text-gray-500 dark:text-gray-400">
                      {formatDateTime(a.occurred_at)}
                    </span>
                  </p>
                  {isEditing ? (
                    <div className="mt-2">
                      <label
                        htmlFor={`crm-act-edit-${a.id}`}
                        className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t("Activity.body_label")}
                      </label>
                      <textarea
                        id={`crm-act-edit-${a.id}`}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={3}
                        className={`${inputClass} min-h-[88px]`}
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="min-h-[44px]"
                          disabled={editSaving}
                          onClick={() => void saveEdit(a.id)}
                        >
                          {editSaving ? t("Buttons.saving") : t("Buttons.save")}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="min-h-[44px]"
                          disabled={editSaving}
                          onClick={() => {
                            setEditingId(null);
                            setEditBody("");
                          }}
                        >
                          {t("Buttons.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : a.body ? (
                    <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {a.body}
                    </p>
                  ) : null}
                  {a.updated_at ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("Activity.edited_label", { when: formatDateTime(a.updated_at) })}
                    </p>
                  ) : null}
                </div>
                {isSystem || isEditing ? null : (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="min-h-[44px]"
                      aria-label={t("Activity.edit_activity", { kind: t(`Activity.kind_${a.kind}`) })}
                      onClick={() => startEdit(a)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true"/>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="min-h-[44px]"
                      aria-label={t("Activity.delete_activity", {
                        kind: t(`Activity.kind_${a.kind}`),
                      })}
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true"/>
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            ref={confirmPanelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={confirmTitleId}
            aria-describedby={confirmDescId}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onKeyDown={(e) => {
              if (e.key === "Escape") setDeleteTarget(null);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={confirmTitleId}
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {t("Activity.delete_title")}
            </h2>
            <p id={confirmDescId} className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t("Activity.delete_confirm")}
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
                disabled={deleteBusy}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {deleteBusy ? t("Buttons.deleting") : t("Buttons.delete")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
