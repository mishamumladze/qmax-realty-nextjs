'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { MessageSummary } from '@/types/admin';
import { AdminButton } from '@/components/ui/AdminButton';
import { AlertCircle, Mail, MailOpen, Trash2 } from 'lucide-react';

type InboxMessage = MessageSummary & { read: number };

function normalize(raw: MessageSummary): InboxMessage {
  const rawRead: unknown = (raw as { read?: unknown }).read;
  const read = typeof rawRead === 'number' && Number.isFinite(rawRead) ? rawRead : 0;
  return { ...raw, read };
}

function sortByNewest(list: InboxMessage[]): InboxMessage[] {
  const timeOf = (iso: string): number => {
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return [...list].sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at));
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error('Network request failed.');
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new Error('Unexpected server response.');
  }

  if (!res.ok) {
    const errObj = parsed as { error?: unknown };
    const message =
      typeof errObj.error === 'string'
        ? errObj.error
        : res.statusText || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return parsed as T;
}

export function MessagesList() {
  const [messages, setMessages] = useState<InboxMessage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [cardErrors, setCardErrors] = useState<Record<number, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InboxMessage | null>(null);
  const [undoItem, setUndoItem] = useState<{ msg: InboxMessage } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const titleId = useId();
  const descId = useId();

  const load = useCallback(async (): Promise<void> => {
    setMessages(null);
    setLoadError(null);
    try {
      const data = await adminFetch<{ messages: MessageSummary[] }>('/api/admin/messages');
      setMessages(sortByNewest(data.messages.map(normalize)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const closeDialog = (): void => setDeleteTarget(null);

  const toggleRead = async (msg: InboxMessage): Promise<void> => {
    const nextRead = msg.read === 0 ? 1 : 0;
    setMessages((prev) =>
      prev ? prev.map((m) => (m.id === msg.id ? { ...m, read: nextRead } : m)) : prev
    );
    setCardErrors((prev) => {
      const next = { ...prev };
      delete next[msg.id];
      return next;
    });
    try {
      await adminFetch('/api/admin/messages', {
        method: 'PATCH',
        body: JSON.stringify({ id: msg.id, read: msg.read === 0 }),
      });
    } catch (err) {
      setMessages((prev) =>
        prev ? prev.map((m) => (m.id === msg.id ? { ...m, read: msg.read } : m)) : prev
      );
      setCardErrors((prev) => ({
        ...prev,
        [msg.id]: err instanceof Error ? err.message : String(err),
      }));
    }
  };

  const requestDelete = (msg: InboxMessage, e: ReactMouseEvent<HTMLButtonElement>): void => {
    triggerRef.current = e.currentTarget;
    setDeleteTarget(msg);
  };

  const confirmDelete = async (): Promise<void> => {
    const target = deleteTarget;
    if (!target) return;
    const id = target.id;
    setMessages((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
    closeDialog();
    try {
      await adminFetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
      if (timerRef.current) clearTimeout(timerRef.current);
      setUndoItem({ msg: target });
      timerRef.current = setTimeout(() => setUndoItem(null), 8000);
    } catch (err) {
      setMessages((prev) => sortByNewest([...(prev ?? []), target]));
      setCardErrors((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : String(err),
      }));
    }
  };

  const performUndo = async (): Promise<void> => {
    if (!undoItem) return;
    const m = undoItem.msg;
    const payload: Record<string, unknown> = {
      name: m.name,
      email: m.email,
      message: m.message,
      ...(m.phone !== null && { phone: m.phone }),
      subject: m.subject,
    };
    try {
      const res = await adminFetch<Partial<MessageSummary>>('/api/admin/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const restored: InboxMessage = {
        ...m,
        id: res.id ?? m.id,
        created_at: res.created_at ?? m.created_at,
        read: 0,
      };
      setMessages((prev) => sortByNewest([...(prev ?? []), restored]));
      setUndoItem(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (deleteTarget) {
      cancelRef.current =
        panelRef.current?.querySelector<HTMLButtonElement>('button') ?? null;
      cancelRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [deleteTarget]);

  return (
    <section>
      <p aria-live="polite" role="status" className="sr-only">
        {globalError}
      </p>

      {messages === null && !loadError ? (
        <p className="text-gray-600 dark:text-gray-300">Loading…</p>
      ) : loadError !== null ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p>{loadError}</p>
            <AdminButton
              variant="secondary"
              size="sm"
              className="mt-3 min-h-[44px]"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Retry
            </AdminButton>
          </div>
        </div>
      ) : messages === null ? null : messages.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No messages yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {messages.map((m) => (
            <li key={m.id} className="flex justify-between gap-4 py-4">
              <div className={m.read === 0 ? '' : 'text-gray-500 dark:text-gray-400'}>
                <p className={m.read === 0 ? 'font-semibold text-gray-900 dark:text-white' : ''}>
                  {m.read === 0 ? (
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-600"
                      aria-hidden="true"
                    />
                  ) : null}
                  {m.name}
                </p>
                <p className="max-w-xs truncate">{m.email}</p>
                {m.subject ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{m.subject}</p>
                ) : null}
                <p className="line-clamp-2 text-sm">{m.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(m.created_at)}
                </p>
                {cardErrors[m.id] ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{cardErrors[m.id]}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => void toggleRead(m)}
                >
                  {m.read === 0 ? (
                    <MailOpen className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {m.read === 0 ? 'Mark as read' : 'Mark as unread'}
                  </span>
                </AdminButton>
                <AdminButton
                  variant="destructive"
                  size="sm"
                  className="min-h-[44px]"
                  aria-label={`Delete message from ${m.name}`}
                  onClick={(e) => requestDelete(m, e)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget ? (
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
              if (e.key === 'Escape') closeDialog();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete this message?
            </h2>
            <p id={descId} className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {`This will permanently remove the message from ${deleteTarget.name}. You can undo for 8 seconds.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <AdminButton
                variant="secondary"
                autoFocus
                onClick={closeDialog}
                className="min-h-[44px]"
              >
                Cancel
              </AdminButton>
              <AdminButton variant="destructive" onClick={() => void confirmDelete()} className="min-h-[44px]">
                Delete
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      {undoItem ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg dark:bg-white dark:text-gray-900"
        >
          <span>Message deleted.</span>
          <AdminButton
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            onClick={() => void performUndo()}
          >
            Undo
          </AdminButton>
        </div>
      ) : null}
    </section>
  );
}
