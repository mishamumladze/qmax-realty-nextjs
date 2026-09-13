"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  Minus,
  Phone,
  Trash2,
} from "lucide-react";
import type { CrmContact } from "@/types/admin";
import { Button } from "@/components/ui/Buttons";

export type CrmSortKey = "name" | "created_at" | "last_activity_at";
export type CrmSortDir = "asc" | "desc";

export interface CrmBulkUndo {
  contacts: CrmContact[];
  statusBefore?: CrmContact["status"][];
}

interface CrmTableProps {
  contacts: CrmContact[];
  sort: { key: CrmSortKey; dir: CrmSortDir };
  onSortChange: (next: { key: CrmSortKey; dir: CrmSortDir }) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onOpenDetail: (contact: CrmContact) => void;
  onEdit: (contact: CrmContact) => void;
  onQuickActivity: (contact: CrmContact, kind: "call" | "email" | "meeting") => void;
  onDeleteOne: (contact: CrmContact, trigger: HTMLElement | null) => void;
  onBulkExport: () => void;
  onBulkStatus: (status: CrmContact["status"]) => void;
  onBulkDelete: () => void;
  bulkBusy: boolean;
}

export function crmDisplayName(c: CrmContact): string {
  return [c.first_name, c.last_name ?? ""].join(" ").trim() || c.email || c.phone || `#${c.id}`;
}

export function formatCrmDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function formatCrmRelative(iso: string | null, nowMs = Date.now()): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = nowMs - ts;
  if (diff < 0) return "";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function CrmStatusBadge({ status }: { status: CrmContact["status"] }) {
  const t = useTranslations("Components.Admin.Crm");
  const styles: Record<CrmContact["status"], string> = {
    prospect: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    lead: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
    customer: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${styles[status]}`}
    >
      {t(`Status.${status}`)}
    </span>
  );
}

function CrmCheckbox({
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
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded"
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded border-2
          transition-colors ${
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
      </span>
    </button>
  );
}

export function CrmTable({
  contacts,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  onOpenDetail,
  onEdit,
  onQuickActivity,
  onDeleteOne,
  onBulkExport,
  onBulkStatus,
  onBulkDelete,
  bulkBusy,
}: CrmTableProps) {
  const t = useTranslations("Components.Admin.Crm");
  const [bulkStatus, setBulkStatus] = useState<CrmContact["status"]>("lead");

  const sorted = contacts;

  const toggleSort = (key: CrmSortKey): void => {
    if (sort.key === key) {
      onSortChange({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, dir: key === "name" ? "asc" : "desc" });
    }
  };

  const headerBtn = (key: CrmSortKey, label: string) => {
    const active = sort.key === key;
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        aria-label={active && sort.dir === "asc" ? t("Sort.descending") : t("Sort.ascending")}
        className={`flex min-h-[44px] w-full items-center gap-1.5 px-3 py-3.5 text-left
          font-semibold transition-colors ${
            active
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
      >
        <span className="truncate">{label}</span>
        {active ? (
          sort.dir === "asc" ? (
            <ChevronUp className="text-brand-500 h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
          ) : (
            <ChevronDown className="text-brand-500 h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
          )
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-30" aria-hidden="true"/>
        )}
      </button>
    );
  };

  const isAllSelected = sorted.length > 0 && sorted.every((c) => selectedIds.has(c.id));
  const isIndeterminate = sorted.some((c) => selectedIds.has(c.id)) && !isAllSelected;

  const toggleAll = (): void => {
    if (isAllSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(sorted.map((c) => c.id)));
  };
  const toggleOne = (id: number): void => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const ariaSortFor = (key: CrmSortKey): "ascending" | "descending" | "none" =>
    sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <>
      {selectedIds.size > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-brand-50 dark:bg-brand-900/20 sticky bottom-4 z-30 mb-4 flex flex-wrap
            items-center justify-between gap-4 rounded-2xl border border-gray-100 p-3 shadow-xl
            dark:border-gray-700"
        >
          <span className="text-brand-800 dark:text-brand-200 text-sm font-medium">
            {t("Selected.count", { count: selectedIds.size })}
          </span>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto"
              onClick={onBulkExport}
              disabled={bulkBusy}
            >
              {t("Buttons.export_csv")}
            </Button>
            <label className="sr-only" htmlFor="crm-bulk-status">
              {t("Buttons.change_status")}
            </label>
            <select
              id="crm-bulk-status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as CrmContact["status"])}
              className="min-h-[44px] rounded-md border border-gray-300 bg-white px-3 text-sm
                text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              {(["prospect", "lead", "customer", "archived"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`Status.${s}`)}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto"
              onClick={() => onBulkStatus(bulkStatus)}
              disabled={bulkBusy}
            >
              {t("Buttons.change_status")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto"
              onClick={onBulkDelete}
              disabled={bulkBusy}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true"/>
              {bulkBusy ? t("Buttons.deleting") : t("Buttons.delete_selected")}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white md:block
          dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("Headings.crm")}</caption>
            <thead className="sticky top-0 bg-white dark:bg-gray-800">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" className="px-3 py-3">
                  <CrmCheckbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={toggleAll}
                    ariaLabel={t("Buttons.select_all")}
                  />
                </th>
                <th scope="col" aria-sort={ariaSortFor("name")}>
                  {headerBtn("name", t("Columns.name"))}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400"
                >
                  {t("Columns.contact")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400"
                >
                  {t("Columns.status")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400"
                >
                  {t("Columns.tags")}
                </th>
                <th scope="col" aria-sort={ariaSortFor("last_activity_at")}>
                  {headerBtn("last_activity_at", t("Columns.last_activity"))}
                </th>
                <th scope="col" aria-sort={ariaSortFor("created_at")}>
                  {headerBtn("created_at", t("Columns.created"))}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 font-semibold text-gray-500 dark:text-gray-400"
                >
                  {t("Columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {sorted.map((c) => {
                const selected = selectedIds.has(c.id);
                const tags = c.tags ?? [];
                const visibleTags = tags.slice(0, 2);
                const hiddenCount = tags.length - visibleTags.length;
                const activityRel = formatCrmRelative(c.last_activity_at);
                const createdRel = formatCrmRelative(c.created_at);
                return (
                  <tr
                    key={c.id}
                    className={
                      selected
                        ? "bg-brand-50 dark:bg-brand-900/20"
                        : `bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800
                          dark:hover:bg-gray-800/70`
                    }
                  >
                    <td className="w-12 px-2 py-4 align-top">
                      <CrmCheckbox
                        checked={selected}
                        onChange={() => toggleOne(c.id)}
                        ariaLabel={t("Aria.select_row", { name: crmDisplayName(c) })}
                      />
                    </td>
                    <td className="max-w-[13rem] px-3 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(c)}
                        className="text-brand-700 dark:text-brand-300 block min-h-[24px] max-w-full
                          truncate text-left text-sm font-semibold underline-offset-2
                          hover:underline"
                      >
                        {crmDisplayName(c)}
                      </button>
                      {c.source ? (
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          {c.source}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[15rem] px-3 py-4 align-top">
                      {c.email ? (
                        <p className="max-w-full truncate text-sm text-gray-700 dark:text-gray-300">
                          {c.email}
                        </p>
                      ) : null}
                      {c.phone ? (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
                      ) : null}
                      {!c.email && !c.phone ? <span className="text-gray-400">—</span> : null}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <CrmStatusBadge status={c.status}/>
                    </td>
                    <td className="max-w-[11rem] px-3 py-4 align-top">
                      {tags.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-1">
                          {visibleTags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                                dark:text-brand-200 inline-flex max-w-[8rem] items-center truncate
                                rounded-full px-2 py-0.5 text-xs"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {hiddenCount > 0 ? (
                            <span className="text-xs font-medium text-gray-400">
                              +{hiddenCount}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap">
                      {c.last_activity_at ? (
                        <>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatCrmDateTime(c.last_activity_at)}
                          </p>
                          {activityRel ? (
                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                              {activityRel}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatCrmDateTime(c.created_at)}
                      </p>
                      {createdRel ? (
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {createdRel}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <div className="flex items-center gap-1">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            aria-label={t("Aria.call_contact", { name: crmDisplayName(c) })}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center
                              justify-center rounded-md text-gray-600 hover:bg-gray-100
                              dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Phone className="h-4 w-4" aria-hidden="true"/>
                          </a>
                        ) : null}
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            aria-label={t("Aria.email_contact", { name: crmDisplayName(c) })}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center
                              justify-center rounded-md text-gray-600 hover:bg-gray-100
                              dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Mail className="h-4 w-4" aria-hidden="true"/>
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onQuickActivity(c, "meeting")}
                          aria-label={t("Aria.log_meeting", { name: crmDisplayName(c) })}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center
                            justify-center rounded-md text-gray-600 hover:bg-gray-100
                            dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <CalendarPlus className="h-4 w-4" aria-hidden="true"/>
                        </button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="min-h-[44px]"
                          onClick={() => onEdit(c)}
                          aria-label={t("Aria.edit_contact", { name: crmDisplayName(c) })}
                        >
                          {t("Buttons.edit")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="min-h-[44px]"
                          aria-label={t("Aria.delete_contact", { name: crmDisplayName(c) })}
                          onClick={(e) => onDeleteOne(c, e?.currentTarget ?? null)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true"/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {sorted.map((c) => {
          const selected = selectedIds.has(c.id);
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 transition-colors ${
                selected
                  ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <CrmCheckbox
                    checked={selected}
                    onChange={() => toggleOne(c.id)}
                    ariaLabel={t("Aria.select_row", { name: crmDisplayName(c) })}
                  />
                  <button
                    type="button"
                    onClick={() => onOpenDetail(c)}
                    className="min-h-[44px] min-w-0 flex-1 truncate text-left text-base
                      font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {crmDisplayName(c)}
                  </button>
                </div>
                <CrmStatusBadge status={c.status}/>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                    {t("Columns.contact")}
                  </dt>
                  <dd className="min-w-0 text-right text-gray-700 dark:text-gray-300">
                    {c.email ? <p className="truncate">{c.email}</p> : null}
                    {c.phone ? (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
                    ) : null}
                    {!c.email && !c.phone ? "—" : null}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                    {t("Columns.last_activity")}
                  </dt>
                  <dd className="min-w-0 text-right text-gray-700 dark:text-gray-300">
                    {c.last_activity_at ? (
                      <>
                        <p className="truncate">{formatCrmDateTime(c.last_activity_at)}</p>
                        {formatCrmRelative(c.last_activity_at) ? (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatCrmRelative(c.last_activity_at)}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                    {t("Columns.created")}
                  </dt>
                  <dd className="min-w-0 text-right text-gray-700 dark:text-gray-300">
                    <p className="truncate">{formatCrmDateTime(c.created_at)}</p>
                    {formatCrmRelative(c.created_at) ? (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatCrmRelative(c.created_at)}
                      </p>
                    ) : null}
                  </dd>
                </div>
                {(c.tags ?? []).length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-1 pt-1">
                    {(c.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                          dark:text-brand-200 inline-flex max-w-[9rem] items-center truncate
                          rounded-full px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {(c.tags ?? []).length > 3 ? (
                      <span className="text-xs font-medium text-gray-400">
                        +{(c.tags ?? []).length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </dl>
              <div
                className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3
                  dark:border-gray-700"
              >
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    aria-label={t("Aria.call_contact", { name: crmDisplayName(c) })}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                      rounded-md border border-gray-300 text-gray-700 dark:border-gray-600
                      dark:text-gray-200"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true"/>
                  </a>
                ) : null}
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    aria-label={t("Aria.email_contact", { name: crmDisplayName(c) })}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                      rounded-md border border-gray-300 text-gray-700 dark:border-gray-600
                      dark:text-gray-200"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true"/>
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => onQuickActivity(c, "meeting")}
                  aria-label={t("Aria.log_meeting", { name: crmDisplayName(c) })}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                    rounded-md border border-gray-300 text-gray-700 dark:border-gray-600
                    dark:text-gray-200"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true"/>
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => onEdit(c)}
                >
                  {t("Buttons.edit")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-[44px]"
                  aria-label={t("Aria.delete_contact", { name: crmDisplayName(c) })}
                  onClick={(e) => onDeleteOne(c, e?.currentTarget ?? null)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true"/>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
