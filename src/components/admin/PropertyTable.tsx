"use client";

import React from "react";
import { Property } from "@/types/property";
import { AdminButton } from "@/components/ui/AdminButton";

type PropertyTableProps = {
  properties: Property[];
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
};

// `status` is not part of the Property interface yet; read it defensively
// without touching the shared type definition.
type PropertyWithStatus = Property & { status?: string };

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

function ActionButtons({
  property,
  onEdit,
  onDelete,
}: {
  property: Property;
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <AdminButton
        variant="secondary"
        size="sm"
        onClick={() => onEdit?.(property)}
        aria-label={`Edit ${property.title}`}
      >
        Edit
      </AdminButton>
      <AdminButton
        variant="destructive"
        size="sm"
        onClick={() => onDelete?.(property)}
        aria-label={`Delete ${property.title}`}
      >
        Delete
      </AdminButton>
    </div>
  );
}

export function PropertyTable({ properties, onEdit, onDelete }: PropertyTableProps) {
  if (properties.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        No properties yet.
      </p>
    );
  }

  return (
    <>
      {/* Desktop: data table */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Properties</caption>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th scope="col" className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">
                Title
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">
                Type
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">
                Location
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {properties.map((p) => {
              const status = (p as PropertyWithStatus).status;
              return (
                <tr key={p.id}>
                  <td className="max-w-[16rem] truncate px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {p.title}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{p.type ?? "—"}</td>
                  <td className="max-w-[14rem] truncate px-3 py-3 text-gray-700 dark:text-gray-300">
                    {formatLocation(p)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-gray-300">
                    {formatPrice(p)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-3 py-3">
                    <ActionButtons property={p} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-4 md:hidden">
        {properties.map((p) => {
          const status = (p as PropertyWithStatus).status;
          return (
            <div
              key={p.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                  {p.title}
                </h3>
                <StatusBadge status={status} />
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="truncate text-right text-gray-700 dark:text-gray-300">
                    {p.type ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="truncate text-right text-gray-700 dark:text-gray-300">
                    {formatLocation(p)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Price</dt>
                  <dd className="text-right text-gray-700 dark:text-gray-300">{formatPrice(p)}</dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                <ActionButtons property={p} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
