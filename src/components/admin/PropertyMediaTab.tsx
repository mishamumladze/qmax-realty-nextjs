"use client";

import { useId } from "react";
import type { MediaImage } from "./PropertyMediaUploader";
import { PropertyMediaUploader } from "./PropertyMediaUploader";

interface SharedTabProps {
  fields: Record<string, string>;
  setField: (name: string, value: string) => void;
  setBoolean: (name: string, value: boolean) => void;
  getValue: (name: string) => string;
  errors: Record<string, string>;
  t: (key: string) => string;
}

interface PropertyMediaTabProps extends SharedTabProps {
  images: MediaImage[];
  onImagesChange: (images: MediaImage[]) => void;
}

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-11";
const errorBorderClass = " border-red-500 dark:border-red-500";
const errorTextClass = "mt-1 text-sm text-red-600 dark:text-red-400";

export function PropertyMediaTab({
  fields,
  setField,
  setBoolean,
  getValue,
  errors,
  t,
  images,
  onImagesChange,
}: PropertyMediaTabProps) {
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  const renderTextInput = (name: string, placeholderKey: string) => {
    const id = fieldId(name);
    const error = errors[name];
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {t(`Fields.${name}`)}
        </label>
        <input
          id={id}
          type="text"
          value={getValue(name)}
          onChange={(e) => setField(name, e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${inputClass}${error ? errorBorderClass : ""}`}
          placeholder={t(`Placeholders.${placeholderKey}`)}
        />
        {error ? <p className={errorTextClass}>{error}</p> : null}
      </div>
    );
  };

  const renderTextarea = (name: string, labelKey: string, rows: number, placeholderKey: string) => {
    const id = fieldId(name);
    const error = errors[name];
    return (
      <div className="col-span-2">
        <label htmlFor={id} className={labelClass}>
          {t(labelKey)}
        </label>
        <textarea
          id={id}
          rows={rows}
          value={getValue(name)}
          onChange={(e) => setField(name, e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${inputClass}${error ? errorBorderClass : ""}`}
          placeholder={t(`Placeholders.${placeholderKey}`)}
        />
        {error ? <p className={errorTextClass}>{error}</p> : null}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="tabpanel">
      <div className="col-span-2">
        <label className={labelClass}>{t("Labels.property_media")}</label>
        <PropertyMediaUploader
          images={images}
          onChange={onImagesChange}
          maxImages={20}
          maxSizeMb={10}
        />
      </div>

      {renderTextInput("video_url", "video_url")}

      {renderTextInput("virtual_tour_url", "virtual_tour_url")}

      {renderTextInput("meta_title", "meta_title")}

      {renderTextarea("meta_description", "Textareas.meta_description", 3, "meta_description")}

      {renderTextInput("slug", "slug")}
    </div>
  );
}