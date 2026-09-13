"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Eye, Mail, MailOpen, Pencil, Trash2 } from "lucide-react";
import type {
  CrmMessage,
  CrmMessageChannel,
  CrmMessageDirection,
  MessageSummary,
} from "@/types/admin";
import { Button } from "@/components/ui/Buttons";
import { CrmMessageModal, formatCrmPreview } from "./CrmMessageModal";

interface InboxEntry extends MessageSummary {
  read: number;
}

interface UnionEntry {
  key: string;
  source: "inbox" | "manual";
  occurredMs: number;
  inbox?: InboxEntry;
  manual?: CrmMessage;
}

const DIRECTIONS: CrmMessageDirection[] = ["in", "out"];
const CHANNELS: CrmMessageChannel[] = ["email", "chat", "sms", "note"];

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

export function CrmMessages({
  contactId,
  defaultChannel = "email",
  onChanged,
}: {
  contactId: number;
  defaultChannel?: CrmMessageChannel;
  onChanged?: () => void;
}) {
  const t = useTranslations("Components.Admin.Crm");
  const [messages, setMessages] = useState<CrmMessage[] | null>(null);
  const [total, setTotal] = useState(0);
  const [inbox, setInbox] = useState<InboxEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [channelFilter, setChannelFilter] = useState<CrmMessageChannel | "all">("all");

  const [direction, setDirection] = useState<CrmMessageDirection>("out");
  const [channel, setChannel] = useState<CrmMessageChannel>(defaultChannel);
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CrmMessage | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [viewEntry, setViewEntry] = useState<UnionEntry | null>(null);

  const confirmPanelRef = useRef<HTMLDivElement | null>(null);
  const confirmTitleId = useId();
  const confirmDescId = useId();

  useEffect(() => {
    if (!deleteTarget) return;
    confirmPanelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [deleteTarget]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("contact_id", String(contactId));
    params.set("limit", "50");
    const manualRequest = adminFetch<{ messages: CrmMessage[]; total: number }>(
      `/api/admin/crm/messages?${params.toString()}`
    );
    const inboxRequest = adminFetch<{ messages: InboxEntry[] }>(
      `/api/admin/messages?contact_id=${contactId}`
    );
    const handle = (async (): Promise<void> => {
      try {
        const [manual, linked] = await Promise.all([manualRequest, inboxRequest]);
        if (cancelled) return;
        setMessages(manual.messages);
        setTotal(manual.total);
        setInbox(linked.messages);
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

  const filtered = useMemo(() => {
    const manual: UnionEntry[] = (messages ?? []).map((m) => ({
      key: `manual-${m.id}`,
      source: "manual" as const,
      occurredMs: new Date(m.occurred_at).getTime(),
      manual: m,
    }));
    const linked: UnionEntry[] = (inbox ?? []).map((m) => ({
      key: `inbox-${m.id}`,
      source: "inbox" as const,
      occurredMs: new Date(m.created_at).getTime(),
      inbox: m,
    }));
    const q = search.trim().toLowerCase();
    const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : NaN;
    const toMs = to ? new Date(`${to}T23:59:59`).getTime() : NaN;
    return [...manual, ...linked]
      .filter((e) => {
        if (e.source === "manual" && e.manual) {
          const m = e.manual;
          if (channelFilter !== "all" && m.channel !== channelFilter) return false;
          if (q) {
            const hay = `${m.sender ?? ""} ${m.subject ?? ""} ${m.body}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          if (!Number.isNaN(fromMs) && (Number.isNaN(e.occurredMs) || e.occurredMs < fromMs))
            return false;
          if (!Number.isNaN(toMs) && (Number.isNaN(e.occurredMs) || e.occurredMs > toMs))
            return false;
          return true;
        }
        const m = e.inbox;
        if (!m) return false;
        if (channelFilter !== "all" && channelFilter !== "email") return false;
        if (q) {
          const hay = `${m.name} ${m.email} ${m.subject ?? ""} ${m.message}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (!Number.isNaN(fromMs) && (Number.isNaN(e.occurredMs) || e.occurredMs < fromMs))
          return false;
        if (!Number.isNaN(toMs) && (Number.isNaN(e.occurredMs) || e.occurredMs > toMs))
          return false;
        return true;
      })
      .sort((a, b) => {
        const at = Number.isNaN(a.occurredMs) ? 0 : a.occurredMs;
        const bt = Number.isNaN(b.occurredMs) ? 0 : b.occurredMs;
        return bt - at;
      });
  }, [messages, inbox, search, from, to, channelFilter]);

  const reload = async (): Promise<void> => {
    try {
      const [manual, linked] = await Promise.all([
        adminFetch<{ messages: CrmMessage[]; total: number }>(
          `/api/admin/crm/messages?contact_id=${contactId}&limit=50`
        ),
        adminFetch<{ messages: InboxEntry[] }>(`/api/admin/messages?contact_id=${contactId}`),
      ]);
      setMessages(manual.messages);
      setTotal(manual.total);
      setInbox(linked.messages);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (saving) return;
    if (!body.trim()) {
      setFormError(t("Messages.body_required"));
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      let occurred_at: string | undefined;
      if (occurredAt.trim()) {
        const d = new Date(occurredAt);
        occurred_at = Number.isNaN(d.getTime()) ? occurredAt.trim() : d.toISOString();
      }
      const data = await adminFetch<{ message: CrmMessage }>("/api/admin/crm/messages", {
        method: "POST",
        body: JSON.stringify({
          contact_id: contactId,
          direction,
          channel,
          sender: sender.trim() ? sender.trim() : undefined,
          subject: subject.trim() ? subject.trim() : undefined,
          body: body.trim(),
          occurred_at,
        }),
      });
      setMessages((prev) => (prev ? [data.message, ...prev] : [data.message]));
      setTotal((prev) => prev + 1);
      setBody("");
      setSubject("");
      setOccurredAt("");
      onChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleInboxRead = async (m: InboxEntry): Promise<void> => {
    const nextRead = m.read === 0 ? 1 : 0;
    setInbox((prev) =>
      prev ? prev.map((x) => (x.id === m.id ? { ...x, read: nextRead } : x)) : prev
    );
    try {
      await adminFetch("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: m.id, read: m.read === 0 }),
      });
    } catch (err) {
      setInbox((prev) =>
        prev ? prev.map((x) => (x.id === m.id ? { ...x, read: m.read } : x)) : prev
      );
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const startEdit = (m: CrmMessage): void => {
    setEditingId(m.id);
    setEditBody(m.body);
    setFormError(null);
  };

  const saveEdit = async (id: number): Promise<void> => {
    if (editSaving) return;
    if (!editBody.trim()) {
      setFormError(t("Messages.body_required"));
      return;
    }
    setFormError(null);
    setEditSaving(true);
    try {
      const data = await adminFetch<{ message: CrmMessage }>("/api/admin/crm/messages", {
        method: "PATCH",
        body: JSON.stringify({ id, fields: { body: editBody.trim() } }),
      });
      setMessages((prev) => (prev ? prev.map((m) => (m.id === id ? data.message : m)) : prev));
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
      await adminFetch(`/api/admin/crm/messages?id=${target.id}`, { method: "DELETE" });
      setMessages((prev) => (prev ? prev.filter((m) => m.id !== target.id) : prev));
      setTotal((prev) => Math.max(0, prev - 1));
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
            <label htmlFor={`crm-msg-dir-${contactId}`} className={labelClass}>
              {t("Messages.direction_label")}
            </label>
            <select
              id={`crm-msg-dir-${contactId}`}
              value={direction}
              onChange={(e) => setDirection(e.target.value as CrmMessageDirection)}
              className={inputClass}
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {t(`Messages.direction_${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`crm-msg-channel-${contactId}`} className={labelClass}>
              {t("Messages.channel_label")}
            </label>
            <select
              id={`crm-msg-channel-${contactId}`}
              value={channel}
              onChange={(e) => setChannel(e.target.value as CrmMessageChannel)}
              className={inputClass}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t(`Messages.channel_${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`crm-msg-sender-${contactId}`} className={labelClass}>
              {t("Messages.sender_label")}
            </label>
            <input
              id={`crm-msg-sender-${contactId}`}
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder={t("Messages.sender_placeholder")}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`crm-msg-when-${contactId}`} className={labelClass}>
              {t("Messages.occurred_label")}
            </label>
            <input
              id={`crm-msg-when-${contactId}`}
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor={`crm-msg-subject-${contactId}`} className={labelClass}>
            {t("Messages.subject_label")}
          </label>
          <input
            id={`crm-msg-subject-${contactId}`}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("Messages.subject_placeholder")}
            className={inputClass}
          />
        </div>
        <div className="mt-3">
          <label htmlFor={`crm-msg-body-${contactId}`} className={labelClass}>
            {t("Messages.body_label")}
          </label>
          <textarea
            id={`crm-msg-body-${contactId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={t("Messages.body_placeholder")}
            className={`${inputClass} min-h-[88px]`}
          />
        </div>
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
          {saving ? t("Messages.saving") : t("Messages.add_button")}
        </Button>
      </form>

      <div
        className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`crm-msg-search-${contactId}`} className={labelClass}>
              {t("Messages.search_label")}
            </label>
            <input
              id={`crm-msg-search-${contactId}`}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Messages.search_placeholder")}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`crm-msg-from-${contactId}`} className={labelClass}>
                {t("Messages.from_label")}
              </label>
              <input
                id={`crm-msg-from-${contactId}`}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`crm-msg-to-${contactId}`} className={labelClass}>
                {t("Messages.to_label")}
              </label>
              <input
                id={`crm-msg-to-${contactId}`}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Messages.channel_label")}>
          {(["all", ...CHANNELS] as const).map((c) => {
            const active = channelFilter === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setChannelFilter(c)}
                className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm
                font-medium ${
                  active
                    ? "bg-brand-600 dark:bg-brand-500 text-white"
                    : `bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800
                      dark:text-gray-200 dark:hover:bg-gray-700`
                }`}
              >
                {c === "all" ? t("Messages.channel_all") : t(`Messages.channel_${c}`)}
              </button>
            );
          })}
        </div>
      </div>

      {messages === null && !loadError ? (
        <p className="py-6 text-center text-gray-600 dark:text-gray-300">{t("Messages.loading")}</p>
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
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-gray-600 dark:text-gray-300">{t("Messages.empty")}</p>
      ) : (
        <>
          <p aria-live="polite" className="text-sm text-gray-600 dark:text-gray-300">
            {t("Messages.count", { shown: filtered.length, total })}
          </p>
          <ol className="space-y-2">
            {filtered.map((entry) => {
              if (entry.source === "inbox" && entry.inbox) {
                const m = entry.inbox;
                return (
                  <li
                    key={entry.key}
                    className={`flex items-start justify-between gap-3 rounded-2xl border
                      border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 ${
                        m.read === 0 ? "border-brand-600 dark:border-brand-400" : ""
                      }`}
                  >
                    <div
                      className={`min-w-0 flex-1
                        ${m.read === 0 ? "" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      <p
                        className="flex flex-wrap items-center gap-2 text-sm font-semibold
                          text-gray-900 dark:text-gray-100"
                      >
                        <span
                          className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                            dark:text-brand-200 inline-flex items-center rounded-full px-2 py-0.5
                            text-xs"
                        >
                          {t("Messages.channel_email")}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5
                            text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                        >
                          {t("Messages.website_badge")}
                        </span>
                        {m.read === 0 ? (
                          <span
                            className="bg-brand-600 inline-block h-2 w-2 rounded-full"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          {m.name}
                        </span>
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          {formatDateTime(m.created_at)}
                        </span>
                      </p>
                      <p className="mt-1 max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                        {m.email}
                      </p>
                      {m.subject ? (
                        <p
                          className="mt-1 truncate text-sm font-medium text-gray-800
                            dark:text-gray-200"
                        >
                          {m.subject}
                        </p>
                      ) : null}
                      <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                        {formatCrmPreview(m.message)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setViewEntry(entry)}
                        className="text-brand-700 dark:text-brand-300 mt-1 inline-flex min-h-[44px]
                          items-center gap-1.5 text-sm font-medium underline-offset-2
                          hover:underline"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true"/>
                        {t("Messages.read_more")}
                      </button>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-[44px]"
                        aria-label={t("Messages.open_message")}
                        onClick={() => setViewEntry(entry)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true"/>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-[44px]"
                        aria-label={m.read === 0 ? t("Inbox.mark_read") : t("Inbox.mark_unread")}
                        onClick={() => void toggleInboxRead(m)}
                      >
                        {m.read === 0 ? (
                          <MailOpen className="h-4 w-4" aria-hidden="true"/>
                        ) : (
                          <Mail className="h-4 w-4" aria-hidden="true"/>
                        )}
                      </Button>
                    </div>
                  </li>
                );
              }
              const m = entry.manual;
              if (!m) return null;
              const isEditing = editingId === m.id;
              return (
                <li
                  key={entry.key}
                  className="flex items-start justify-between gap-3 rounded-2xl border
                    border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="flex flex-wrap items-center gap-2 text-sm font-semibold
                        text-gray-900 dark:text-gray-100"
                    >
                      <span
                        className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                          dark:text-brand-200 inline-flex items-center rounded-full px-2 py-0.5
                          text-xs"
                      >
                        {t(`Messages.channel_${m.channel}`)}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5
                          text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {t(`Messages.direction_${m.direction}`)}
                      </span>
                      <span className="font-normal text-gray-500 dark:text-gray-400">
                        {m.sender ?? "—"}
                      </span>
                      <span className="font-normal text-gray-500 dark:text-gray-400">
                        {formatDateTime(m.occurred_at)}
                      </span>
                    </p>
                    {m.subject ? (
                      <p
                        className="mt-1 truncate text-sm font-medium text-gray-800
                          dark:text-gray-200"
                      >
                        {m.subject}
                      </p>
                    ) : null}
                    {isEditing ? (
                      <div className="mt-2">
                        <label
                          htmlFor={`crm-msg-edit-${m.id}`}
                          className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          {t("Messages.body_label")}
                        </label>
                        <textarea
                          id={`crm-msg-edit-${m.id}`}
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
                            onClick={() => void saveEdit(m.id)}
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
                    ) : (
                      <>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                          {formatCrmPreview(m.body)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setViewEntry(entry)}
                          className="text-brand-700 dark:text-brand-300 mt-1 inline-flex
                            min-h-[44px] items-center gap-1.5 text-sm font-medium underline-offset-2
                            hover:underline"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true"/>
                          {t("Messages.read_more")}
                        </button>
                      </>
                    )}
                  </div>
                  {isEditing ? null : (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-[44px]"
                        aria-label={t("Messages.open_message")}
                        onClick={() => setViewEntry(entry)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true"/>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-[44px]"
                        aria-label={t("Messages.edit_message")}
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true"/>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="min-h-[44px]"
                        aria-label={t("Messages.delete_message")}
                        onClick={() => setDeleteTarget(m)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true"/>
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
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
            <h2 id={confirmTitleId} className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("Messages.delete_title")}
            </h2>
            <p id={confirmDescId} className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t("Messages.delete_confirm")}
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

      {viewEntry?.source === "inbox" && viewEntry.inbox ? (
        <CrmMessageModal
          title={viewEntry.inbox.subject || viewEntry.inbox.name}
          subtitle={`${viewEntry.inbox.name} · ${viewEntry.inbox.email}`}
          date={formatDateTime(viewEntry.inbox.created_at)}
          badges={
            <>
              <span
                className="bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200
                  inline-flex items-center rounded-full px-2 py-0.5 text-xs"
              >
                {t("Messages.channel_email")}
              </span>
              <span
                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs
                  text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
              >
                {t("Messages.website_badge")}
              </span>
            </>
          }
          body={viewEntry.inbox.message}
          footer={
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[44px]"
              onClick={() => {
                const m = viewEntry.inbox;
                setViewEntry(null);
                if (m) void toggleInboxRead(m);
              }}
            >
              {viewEntry.inbox.read === 0 ? t("Inbox.mark_read") : t("Inbox.mark_unread")}
            </Button>
          }
          onClose={() => setViewEntry(null)}
        />
      ) : null}

      {viewEntry?.source === "manual" && viewEntry.manual ? (
        <CrmMessageModal
          title={viewEntry.manual.subject || t(`Messages.channel_${viewEntry.manual.channel}`)}
          subtitle={viewEntry.manual.sender ?? undefined}
          date={formatDateTime(viewEntry.manual.occurred_at)}
          badges={
            <>
              <span
                className="bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200
                  inline-flex items-center rounded-full px-2 py-0.5 text-xs"
              >
                {t(`Messages.channel_${viewEntry.manual.channel}`)}
              </span>
              <span
                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs
                  text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              >
                {t(`Messages.direction_${viewEntry.manual.direction}`)}
              </span>
            </>
          }
          body={viewEntry.manual.body}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[44px]"
                onClick={() => {
                  const m = viewEntry.manual;
                  setViewEntry(null);
                  if (m) startEdit(m);
                }}
              >
                {t("Messages.edit_message")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="min-h-[44px]"
                onClick={() => {
                  const m = viewEntry.manual;
                  setViewEntry(null);
                  if (m) setDeleteTarget(m);
                }}
              >
                {t("Messages.delete_message")}
              </Button>
            </>
          }
          onClose={() => setViewEntry(null)}
        />
      ) : null}
    </div>
  );
}
