"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/Buttons";
import { useTranslations } from "next-intl";
import { Check, ChevronUp, ChevronDown, Minus, Trash2, Power } from "lucide-react";

type PropertyTableProps = {
  properties: Property[];
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  onBulkDelete?: (ids: number[]) => Promise<void>;
};

// `status` is not part of the Property interface yet; read it defensively
// without touching the shared type definition.
type PropertyWithStatus = Property & { status?: string };

type SortKey = "title" | "type" | "location" | "price" | "status";

type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

function getSortValue(property: PropertyWithStatus, key: SortKey): string | number {
  switch (key) {
    case "title":
      return property.title.toLowerCase();
    case "type":
      return (property.type ?? "").toLowerCase();
    case "location":
      return formatLocation(property).toLowerCase();
    case "price":
      return property.price ?? 0;
    case "status":
      return (property.status ?? "").toLowerCase();
    default:
      return "";
  }
}

function formatPrice(p: Property): string {
  return `${p.price ?? "—"} ${p.currency ?? ""}`.trim();
}

function formatLocation(p: Property): string {
  return [p.location, p.city].filter(Boolean).join(", ") || "—";
}

function StatusBadge({ status }: { status?: string }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        }`}
    >
      {status ?? "—"}
    </span>
  );
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const isSelected = checked || indeterminate;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-colors
        ${
          isSelected
            ? "border-brand-500 bg-brand-500 text-white"
            : `border-gray-300 bg-transparent text-transparent hover:border-gray-400
              dark:border-gray-600`
        }`}
    >
      {indeterminate ? (
        <Minus className="h-3 w-3" strokeWidth={3}/>
      ) : checked ? (
        <Check className="h-3 w-3" strokeWidth={3}/>
      ) : null}
    </button>
  );
}

function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  t,
}: {
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const isActive = sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;
  const ariaLabel = isActive
    ? direction === "asc"
      ? t("Sort.descending")
      : t("Sort.ascending")
    : t("Sort.ascending");

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 px-3 py-3 font-semibold text-gray-500 transition-colors
        hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      aria-label={ariaLabel}
    >
      {label}
      {isActive && (
        <span className="flex flex-col leading-none">
          {direction === "asc" ? (
            <ChevronUp className="text-brand-500 h-3 w-3"/>
          ) : (
            <ChevronDown className="text-brand-500 h-3 w-3"/>
          )}
        </span>
      )}
    </button>
  );
}

function ActionButtons({
  property,
  onEdit,
  onDelete,
}: {
  property: Property;
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
}) {
  const t = useTranslations("Components.Admin.PropertyTable");
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEdit?.(property)}
        aria-label={t("Aria.edit_property", { title: property.title })}
      >
        {t("Buttons.edit")}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete?.(property)}
        aria-label={t("Aria.delete_property", { title: property.title })}
      >
        {t("Buttons.delete")}
      </Button>
    </div>
  );
}

export function PropertyTable({
  properties,
  onEdit,
  onDelete,
  onSelectionChange,
  onBulkDelete,
}: PropertyTableProps) {
  const t = useTranslations("Components.Admin.PropertyTable");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "title", direction: "asc" });

  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map((p) => p.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      const aVal = getSortValue(a as PropertyWithStatus, sortConfig.key);
      const bVal = getSortValue(b as PropertyWithStatus, sortConfig.key);

      let comparison = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [properties, sortConfig]);

  const isAllSelected = selectedIds.size === properties.length && properties.length > 0;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < properties.length;

  const handleDeactivate = useCallback(async (newStatus: "active" | "inactive") => {
    const ids = sortedProperties.filter((p) => selectedIds.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;

    try {
      const res = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ ids, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, [sortedProperties, selectedIds]);

  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = useCallback(async () => {
    const ids = sortedProperties.filter((p) => selectedIds.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${ids.length} property${ids.length > 1 ? "ies" : "y"}? This cannot be undone.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete properties");
      
      const data = await res.json();
      console.log(`Deleted ${data.deleted} properties`);
      setSelectedIds(new Set());
      if (onBulkDelete) {
        await onBulkDelete(ids);
      }
    } catch (err) {
      console.error("Failed to delete properties:", err);
    } finally {
      setBulkDeleting(false);
    }
  }, [sortedProperties, selectedIds, onBulkDelete]);

  if (properties.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        {t("Empty.none")}
      </p>
    );
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div
          className="bg-brand-50 dark:bg-brand-900/20 mb-4 flex items-center justify-between gap-4
            rounded-lg p-3"
          role="status"
          aria-live="polite"
        >
          <span className="text-brand-800 dark:text-brand-200 text-sm font-medium">
            {t("Selected.count", { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>
              {t("Buttons.deselect_all")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDeactivate("inactive")}
            >
              <Power className="mr-1.5 h-3.5 w-3.5"/>
              {t("Buttons.deactivate_selected")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleDeactivate("active")}
            >
              <Power className="mr-1.5 h-3.5 w-3.5"/>
              {t("Buttons.activate_selected")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5"/>
              {bulkDeleting ? t("Buttons.deleting") : t("Buttons.delete_selected")}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop: data table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" className="px-3 py-3">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    ariaLabel={t("Buttons.select_all")}
                  />
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "title"
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <SortableHeader
                    label={t("Columns.title")}
                    sortKey="title"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    t={t}
                  />
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "type"
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <SortableHeader
                    label={t("Columns.type")}
                    sortKey="type"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    t={t}
                  />
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "location"
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <SortableHeader
                    label={t("Columns.location")}
                    sortKey="location"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    t={t}
                  />
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "price"
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <SortableHeader
                    label={t("Columns.price")}
                    sortKey="price"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    t={t}
                  />
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "status"
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <SortableHeader
                    label={t("Columns.status")}
                    sortKey="status"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    t={t}
                  />
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400"
                >
                  {t("Columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedProperties.map((p) => {
                const status = (p as PropertyWithStatus).status;
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectOne(p.id)}
                        ariaLabel={t("Aria.select_row", { title: p.title })}
                      />
                    </td>
                    <td
                      className="max-w-[16rem] truncate px-3 py-3 font-medium text-gray-900
                        dark:text-gray-100"
                    >
                      {p.title}
                    </td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{p.type ?? "—"}</td>
                    <td
                      className="max-w-[14rem] truncate px-3 py-3 text-gray-700 dark:text-gray-300"
                    >
                      {formatLocation(p)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {formatPrice(p)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={status}/>
                    </td>
                    <td className="px-3 py-3">
                      <ActionButtons property={p} onEdit={onEdit} onDelete={onDelete}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-4 md:hidden">
        {sortedProperties.map((p) => {
          const status = (p as PropertyWithStatus).status;
          const isSelected = selectedIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleSelectOne(p.id)}
                    ariaLabel={t("Aria.select_row", { title: p.title })}
                  />
                  <h3
                    className="min-w-0 truncate text-base font-semibold text-gray-900
                      dark:text-gray-100"
                  >
                    {p.title}
                  </h3>
                </div>
                <StatusBadge status={status}/>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">{t("Mobile.type")}</dt>
                  <dd className="truncate text-right text-gray-700 dark:text-gray-300">
                    {p.type ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">{t("Mobile.location")}</dt>
                  <dd className="truncate text-right text-gray-700 dark:text-gray-300">
                    {formatLocation(p)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">{t("Mobile.price")}</dt>
                  <dd className="text-right text-gray-700 dark:text-gray-300">{formatPrice(p)}</dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                <ActionButtons property={p} onEdit={onEdit} onDelete={onDelete}/>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
