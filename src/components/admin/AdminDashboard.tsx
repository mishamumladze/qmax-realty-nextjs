"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid, Mail, Users, LogOut, Plus } from "lucide-react";
import type { Property } from "@/types/property";
import { PropertyTable } from "@/components/admin/PropertyTable";
import { MessagesList } from "@/components/admin/MessagesList";
import { NewsletterSubscribersList } from "@/components/admin/NewsletterSubscribersList";
import { PropertyFormModal } from "@/components/admin/PropertyFormModal";
import { Button } from "@/components/ui/Buttons";

type Tab = "properties" | "messages" | "newsletter";

interface UndoState {
  property: Property;
}

const UNDO_MS = 8000;

function bearerHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (
      data !== null &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
  } catch {
    // response had no JSON body
  }
  return `Request failed (${res.status})`;
}

export function AdminDashboard({ initialProperties }: { initialProperties: Property[] }) {
  const router = useRouter();
  const t = useTranslations("Components.Admin.Dashboard");
  const [activeTab, setActiveTab] = useState<Tab>("properties");
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [undoProperty, setUndoProperty] = useState<UndoState | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const clearUndoTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!deleteTarget) return;
    const btn = panelRef.current?.querySelector<HTMLButtonElement>("button");
    btn?.focus();
  }, [deleteTarget]);

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "properties", label: t("Tabs.properties"), icon: LayoutGrid },
    { id: "messages", label: t("Tabs.messages"), icon: Mail },
    { id: "newsletter", label: t("Tabs.newsletter"), icon: Users },
  ];

  const handleLogout = () => {
    window.localStorage.removeItem("admin_token");
    document.cookie = "admin_token=; path=/; max-age=0; samesite=lax";
    router.push("/admin/login");
  };

  const cancelDialog = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    setProperties((prev) => prev.filter((x) => x.id !== target.id));
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/admin/properties?id=${target.id}`, {
        method: "DELETE",
        headers: bearerHeaders(),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      clearUndoTimer();
      setUndoProperty({ property: target });
      timerRef.current = setTimeout(() => setUndoProperty(null), UNDO_MS);
    } catch (err) {
      setProperties((prev) => [...prev, target]);
      setGlobalError(err instanceof Error ? err.message : t("Errors.delete_failed"));
    }
  };

  const performUndo = async () => {
    const undo = undoProperty;
    if (!undo) return;
    const old = undo.property;
    const asStr = (value: unknown): string | undefined =>
      typeof value === "string" && value !== "" ? value : undefined;
    const asNum = (value: unknown): number | undefined => {
      if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
      if (typeof value === "string" && value !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };
    const isStrArray = (value: unknown): value is string[] =>
      Array.isArray(value) && value.every((item) => typeof item === "string");
    const payload: Record<string, unknown> = {};
    for (const key of [
      "title",
      "type",
      "subtitle",
      "location",
      "neighborhood",
      "city",
      "region",
      "country",
      "currency",
      "sale_type",
      "meta_description",
      "description",
      "floor_plan",
      "card_image",
    ] as const) {
      const value = asStr(old[key]);
      if (value !== undefined) payload[key] = value;
    }
    for (const key of ["rooms", "bedrooms", "bathrooms", "sqmt", "price", "year_built"] as const) {
      const value = asNum(old[key]);
      if (value !== undefined) payload[key] = value;
    }
    const rawSlug = (old as { slug?: unknown }).slug;
    const slug = asStr(rawSlug);
    if (slug !== undefined) payload.slug = slug;
    if (typeof old.floor === "number" || (typeof old.floor === "string" && old.floor !== "")) {
      payload.floor = old.floor;
    }
    const rawParking = (old as { parking?: unknown }).parking;
    payload.parking = rawParking === true || rawParking === 1;
    if (isStrArray(old.inclusions)) payload.inclusions = old.inclusions;
    if (isStrArray(old.gallery)) payload.gallery = old.gallery;
    const coords = old.coords;
    if (
      Array.isArray(coords) &&
      coords.length === 2 &&
      Number.isFinite(coords[0]) &&
      Number.isFinite(coords[1])
    ) {
      payload.coords = coords;
    }
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...bearerHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data: unknown = await res.json();
      if (
        data === null ||
        typeof data !== "object" ||
        !("property" in data) ||
        data.property === null ||
        typeof data.property !== "object"
      ) {
        throw new Error("Unexpected server response.");
      }
      const saved = data.property as Property;
      const oldId = old.id;
      clearUndoTimer();
      setUndoProperty(null);
      setProperties((prev) =>
        prev.some((x) => x.id === oldId)
          ? prev.map((x) => (x.id === oldId ? saved : x))
          : [saved, ...prev]
      );
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : t("Errors.restore_failed"));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row dark:bg-gray-900">
      <nav
        aria-label={t("nav_aria")}
        className="w-full shrink-0 border-b border-gray-200 bg-white p-4 md:w-60 md:border-r
          md:border-b-0 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex gap-2 md:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <Button
                key={id}
                variant={active ? "primary" : "secondary"}
                className="min-h-11 w-full justify-start"
                aria-current={active ? "true" : undefined}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Button>
            );
          })}
          <div className="hidden flex-1 md:block" />
          <Button
            variant="destructive"
            size="sm"
            className="min-h-11 w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("logout")}</span>
          </Button>
        </div>
      </nav>

      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        {activeTab === "properties" && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {t("Headings.properties")}
              </h1>
              <Button
                variant="primary"
                className="min-h-11"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("add_property")}</span>
              </Button>
            </div>
            {properties.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">{t("Empty.no_properties")}</p>
            ) : (
              <PropertyTable
                properties={properties}
                onEdit={(p) => {
                  setEditing(p);
                  setModalOpen(true);
                }}
                onDelete={(p) => setDeleteTarget(p)}
              />
            )}
          </>
        )}

        {activeTab === "messages" && (
          <>
            <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t("Headings.messages")}
            </h1>
            <MessagesList />
          </>
        )}

        {activeTab === "newsletter" && (
          <>
            <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t("Headings.newsletter")}
            </h1>
            <NewsletterSubscribersList />
          </>
        )}
      </main>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cancelDialog();
          }}
        >
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelDialog();
            }}
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("DeleteDialog.title")}
            </h2>
            <p id={descId} className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t("DeleteDialog.description", { title: deleteTarget.title })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                className="min-h-11"
                autoFocus
                onClick={cancelDialog}
              >
                {t("DeleteDialog.Buttons.cancel")}
              </Button>
              <Button
                variant="destructive"
                className="min-h-11"
                onClick={() => {
                  void confirmDelete();
                }}
              >
                {t("DeleteDialog.Buttons.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {undoProperty && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3
            rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg dark:bg-white dark:text-gray-900"
        >
          <span>{t("Toast.deleted")}</span>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11"
            onClick={() => {
              void performUndo();
            }}
          >
            {t("DeleteDialog.Buttons.undo")}
          </Button>
        </div>
      )}

      <PropertyFormModal
        open={modalOpen}
        property={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={(saved) => {
          setProperties((prev) =>
            editing && saved.id === editing.id
              ? prev.map((p) => (p.id === saved.id ? saved : p))
              : [saved, ...prev]
          );
          setModalOpen(false);
          setEditing(null);
        }}
      />

      <div aria-live="polite" className="sr-only">
        {globalError}
      </div>
    </div>
  );
}
