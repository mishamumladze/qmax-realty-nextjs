"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Eye, Link2, Mail, MailOpen, Trash2, UserPlus, UserRound } from "lucide-react";
import type { CrmContact, MessageSummary } from "@/types/admin";
import { Button } from "@/components/ui/Buttons";
import { CrmMessageModal, formatCrmPreview } from "./CrmMessageModal";

type InboxMessage = MessageSummary & { read: number };

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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function displayContactName(c: CrmContact): string {
  return [c.first_name, c.last_name ?? ""].join(" ").trim() || c.email || c.phone || `#${c.id}`;
}

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

export function CrmInboxView({ onLinked }: { onLinked?: () => void }) {
  const t = useTranslations("Components.Admin.Crm");
  const [messages, setMessages] = useState<InboxMessage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [linkTarget, setLinkTarget] = useState<InboxMessage | null>(null);
  const [viewMessage, setViewMessage] = useState<InboxMessage | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<CrmContact[] | null>(null);
  const [contactSearching, setContactSearching] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const linkPanelRef = useRef<HTMLDivElement | null>(null);
  const linkTitleId = useId();

  useEffect(() => {
    let cancelled = false;
    const request = adminFetch<{ messages: InboxMessage[] }>("/api/admin/messages?unlinked=1");
    const handle = (async (): Promise<void> => {
      try {
        const data = await request;
        if (cancelled) return;
        setMessages(data.messages);
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
  }, []);

  useEffect(() => {
    if (!linkTarget) return;
    linkPanelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [linkTarget]);

  const openLinkDialog = (m: InboxMessage): void => {
    setContactQuery("");
    setContactResults(null);
    setLinkTarget(m);
  };

  const reload = async (): Promise<void> => {
    try {
      const data = await adminFetch<{ messages: InboxMessage[] }>("/api/admin/messages?unlinked=1");
      setMessages(data.messages);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  };

  const toggleRead = async (msg: InboxMessage): Promise<void> => {
    const nextRead = msg.read === 0 ? 1 : 0;
    setMessages((prev) =>
      prev ? prev.map((m) => (m.id === msg.id ? { ...m, read: nextRead } : m)) : prev
    );
    try {
      await adminFetch("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: msg.id, read: msg.read === 0 }),
      });
    } catch (err) {
      setMessages((prev) =>
        prev ? prev.map((m) => (m.id === msg.id ? { ...m, read: msg.read } : m)) : prev
      );
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const searchContacts = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!contactQuery.trim() || contactSearching) return;
    setContactSearching(true);
    setActionError(null);
    try {
      const params = new URLSearchParams({ q: contactQuery.trim(), limit: "10" });
      const data = await adminFetch<{ contacts: CrmContact[] }>(
        `/api/admin/crm/contacts?${params.toString()}`
      );
      setContactResults(data.contacts);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setContactSearching(false);
    }
  };

  const linkTo = async (contactId: number): Promise<void> => {
    const target = linkTarget;
    if (!target || linkBusy) return;
    setLinkBusy(true);
    setActionError(null);
    try {
      await adminFetch("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: target.id, contact_id: contactId }),
      });
      setMessages((prev) => (prev ? prev.filter((m) => m.id !== target.id) : prev));
      setLinkTarget(null);
      onLinked?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setLinkBusy(false);
    }
  };

  const createAndLink = async (): Promise<void> => {
    const target = linkTarget;
    if (!target || createBusy) return;
    setCreateBusy(true);
    setActionError(null);
    try {
      const created = await adminFetch<{ contact: CrmContact }>("/api/admin/crm/contacts", {
        method: "POST",
        body: JSON.stringify({
          first_name: target.name || target.email,
          email: target.email,
          phone: target.phone,
          status: "prospect",
          source: "website",
        }),
      });
      await adminFetch("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: target.id, contact_id: created.contact.id }),
      });
      setMessages((prev) => (prev ? prev.filter((m) => m.id !== target.id) : prev));
      setLinkTarget(null);
      onLinked?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreateBusy(false);
    }
  };

  const remove = async (id: number): Promise<void> => {
    setBusyId(id);
    setActionError(null);
    try {
      await adminFetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
      setMessages((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
      onLinked?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section aria-labelledby="crm-inbox-heading">
      <h2 id="crm-inbox-heading" className="sr-only">
        {t("Inbox.view_inbox")}
      </h2>
      {actionError ? (
        <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </p>
      ) : null}
      {messages === null && !loadError ? (
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
      ) : messages !== null && messages.length === 0 ? (
        <p className="py-12 text-center text-gray-600 dark:text-gray-300">{t("Inbox.empty")}</p>
      ) : (
        <ul className="grid gap-3">
          {(messages ?? []).map((m) => (
            <li
              key={m.id}
              className={`flex justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4
                dark:border-gray-700 dark:bg-gray-800 ${
                  m.read === 0 ? "border-brand-600 dark:border-brand-400" : ""
                }`}
            >
              <div className={`min-w-0 ${m.read === 0 ? "" : "text-gray-500 dark:text-gray-400"}`}>
                <p className={m.read === 0 ? "font-semibold text-gray-900 dark:text-white" : ""}>
                  {m.read === 0 ? (
                    <span
                      className="bg-brand-600 mr-2 inline-block h-2 w-2 rounded-full"
                      aria-hidden="true"
                    />
                  ) : null}
                  {m.name}
                </p>
                <p className="max-w-xs truncate">{m.email}</p>
                {m.subject ? (
                  <p className="truncate text-sm text-gray-700 dark:text-gray-300">{m.subject}</p>
                ) : null}
                <p className="line-clamp-2 text-sm">{formatCrmPreview(m.message)}</p>
                <button
                  type="button"
                  onClick={() => setViewMessage(m)}
                  className="text-brand-700 dark:text-brand-300 mt-1 inline-flex min-h-[44px]
                    items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
                >
                  <Eye className="h-4 w-4" aria-hidden="true"/>
                  {t("Messages.read_more")}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(m.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px]"
                  aria-label={t("Messages.open_message")}
                  onClick={() => setViewMessage(m)}
                >
                  <Eye className="h-4 w-4" aria-hidden="true"/>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => void toggleRead(m)}
                >
                  {m.read === 0 ? (
                    <MailOpen className="h-4 w-4" aria-hidden="true"/>
                  ) : (
                    <Mail className="h-4 w-4" aria-hidden="true"/>
                  )}
                  <span className="sr-only">
                    {m.read === 0 ? t("Inbox.mark_read") : t("Inbox.mark_unread")}
                  </span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="min-h-[44px]"
                  aria-label={t("Inbox.link_to_contact", { name: m.name })}
                  onClick={() => openLinkDialog(m)}
                >
                  <Link2 className="h-4 w-4" aria-hidden="true"/>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-[44px]"
                  disabled={busyId === m.id}
                  aria-label={t("Inbox.delete_message", { name: m.name })}
                  onClick={() => void remove(m.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true"/>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {linkTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLinkTarget(null);
          }}
        >
          <div
            ref={linkPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={linkTitleId}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6
              shadow-2xl dark:bg-gray-800"
            onKeyDown={(e) => {
              if (e.key === "Escape") setLinkTarget(null);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={linkTitleId} className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("Inbox.link_title", { name: linkTarget.name })}
            </h2>
            <form onSubmit={(e) => void searchContacts(e)} className="mt-4">
              <label htmlFor="crm-inbox-contact-search" className={labelClass}>
                {t("Inbox.link_search_label")}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="crm-inbox-contact-search"
                  type="search"
                  value={contactQuery}
                  onChange={(e) => setContactQuery(e.target.value)}
                  placeholder={t("Inbox.link_search_placeholder")}
                  className="min-h-[44px] flex-1 rounded-md border border-gray-300 bg-white px-3
                    text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px]"
                  disabled={contactSearching}
                >
                  {t("Inbox.link_search_button")}
                </Button>
              </div>
            </form>
            {contactResults !== null && contactResults.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                {t("Inbox.link_no_results")}
              </p>
            ) : null}
            {contactResults !== null && contactResults.length > 0 ? (
              <ul className="mt-3 grid gap-2">
                {contactResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={linkBusy}
                      onClick={() => void linkTo(c.id)}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border
                        border-gray-200 px-3 text-left text-sm text-gray-900 hover:bg-gray-50
                        dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <UserRound className="h-4 w-4 shrink-0" aria-hidden="true"/>
                      <span className="min-w-0 flex-1 truncate">{displayContactName(c)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                variant="primary"
                size="sm"
                className="min-h-[44px] w-full"
                disabled={createBusy}
                onClick={() => void createAndLink()}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true"/>
                {createBusy ? t("Inbox.create_busy") : t("Inbox.create_contact")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 min-h-[44px] w-full"
                onClick={() => setLinkTarget(null)}
              >
                {t("Buttons.cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {viewMessage ? (
        <CrmMessageModal
          title={viewMessage.subject || viewMessage.name}
          subtitle={`${viewMessage.name} · ${viewMessage.email}${viewMessage.phone ? ` · ${viewMessage.phone}` : ""}`}
          date={formatDateTime(viewMessage.created_at)}
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
          body={viewMessage.message}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[44px]"
                onClick={() => void toggleRead(viewMessage)}
              >
                {viewMessage.read === 0 ? t("Inbox.mark_read") : t("Inbox.mark_unread")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="min-h-[44px]"
                onClick={() => {
                  setViewMessage(null);
                  openLinkDialog(viewMessage);
                }}
              >
                {t("Inbox.link_to_contact", { name: viewMessage.name })}
              </Button>
            </>
          }
          onClose={() => setViewMessage(null)}
        />
      ) : null}
    </section>
  );
}
