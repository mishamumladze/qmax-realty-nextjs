"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Buttons";
import { useTranslations } from "next-intl";
import { Trash2, Power, AlertCircle, CheckCircle } from "lucide-react";

interface PropertyActionsTabProps {
  propertyId: number;
  propertyTitle?: string;
  onDelete: (ids: number[]) => Promise<void>;
  onActivate: (ids: number[]) => Promise<void>;
  onDeactivate: (ids: number[]) => Promise<void>;
  onDeleted: () => void;
}

export function PropertyActionsTab({
  propertyId,
  propertyTitle,
  onDelete,
  onActivate,
  onDeactivate,
  onDeleted,
}: PropertyActionsTabProps) {
  const t = useTranslations("Components.Admin.PropertyActionsTab");
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setLastAction(null);
    try {
      await onDelete([propertyId]);
      onDeleted();
    } catch (_err) {
      setLastAction({ type: "error", message: t("Feedback.delete_failed") });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    setLastAction(null);
    try {
      await onActivate([propertyId]);
      setLastAction({ type: "success", message: t("Feedback.activated") });
    } catch (_err) {
      setLastAction({ type: "error", message: t("Feedback.activate_failed") });
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    setLastAction(null);
    try {
      await onDeactivate([propertyId]);
      setLastAction({ type: "success", message: t("Feedback.deactivated") });
    } catch (_err) {
      setLastAction({ type: "error", message: t("Feedback.deactivate_failed") });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div role="alert" aria-live="polite" className="text-sm text-gray-500 dark:text-gray-400">
        {propertyTitle ? t("Description_with_title", { title: propertyTitle }) : t("Description")}
      </div>

      <section aria-labelledby="danger-zone-heading" className="space-y-4">
        <h3
          id="danger-zone-heading"
          className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true"/>
          {t("Sections.danger_zone")}
        </h3>
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800
            dark:bg-red-900/20"
        >
          <p className="mb-3 text-sm text-red-700 dark:text-red-300">
            {t("Sections.danger_zone_description")}
          </p>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true"/>
            {deleting ? t("Buttons.deleting") : t("Buttons.delete_property")}
          </Button>
        </div>

        {showDeleteConfirm && (
          <div
            className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700
              dark:bg-red-900/30"
          >
            <p className="text-sm text-red-700 dark:text-red-300">
              {propertyTitle
                ? t("Confirm.delete_message_with_title", { title: propertyTitle })
                : t("Confirm.delete_message")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? t("Buttons.deleting") : t("Buttons.confirm_delete")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                {t("Buttons.cancel")}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="status-actions-heading" className="space-y-4">
        <h3
          id="status-actions-heading"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          <Power className="h-4 w-4" aria-hidden="true"/>
          {t("Sections.status_actions")}
        </h3>
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              className="h-12"
              onClick={handleActivate}
              disabled={activating || deactivating}
            >
              <Power className="mr-2 h-4 w-4" aria-hidden="true"/>
              {activating ? t("Buttons.activating") : t("Buttons.activate")}
            </Button>
            <Button
              variant="secondary"
              className="h-12"
              onClick={handleDeactivate}
              disabled={activating || deactivating}
            >
              <Power className="mr-2 h-4 w-4" aria-hidden="true"/>
              {deactivating ? t("Buttons.deactivating") : t("Buttons.deactivate")}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t("Sections.status_actions_description")}
          </p>
        </div>
      </section>

      {lastAction && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            lastAction.type === "success"
              ? `border border-green-200 bg-green-50 text-green-700 dark:border-green-800
                dark:bg-green-900/30 dark:text-green-300`
              : `border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30
                dark:text-red-300`
          }`}
          role="status"
          aria-live="polite"
        >
          {lastAction.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true"/>
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true"/>
          )}
          <span>{lastAction.message}</span>
        </div>
      )}
    </div>
  );
}
