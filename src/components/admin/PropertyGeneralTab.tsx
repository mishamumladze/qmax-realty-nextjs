"use client";

import { useEffect, useId } from "react";
import type { Property } from "@/types/property";
import { PropertyMapPicker } from "./PropertyMapPicker";

interface SharedTabProps {
  fields: Record<string, string>;
  setField: (name: string, value: string) => void;
  setBoolean: (name: string, value: boolean) => void;
  getValue: (name: string) => string;
  errors: Record<string, string>;
  t: (key: string) => string;
}

interface PropertyGeneralTabProps extends SharedTabProps {
  property: Property | null;
  lat: number | null;
  lng: number | null;
  onCoordsChange: (lat: number, lng: number) => void;
}

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-11";
const errorBorderClass = " border-red-500 dark:border-red-500";
const errorTextClass = "mt-1 text-sm text-red-600 dark:text-red-400";

export function PropertyGeneralTab({
  fields,
  setField,
  setBoolean,
  getValue,
  errors,
  t,
  property,
  lat,
  lng,
  onCoordsChange,
}: PropertyGeneralTabProps) {
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  useEffect(() => {
    if (property?.coords && (lat === null || lng === null)) {
      onCoordsChange(property.coords[0], property.coords[1]);
    }
  }, [property, lat, lng, onCoordsChange]);

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

  const renderNumericInput = (name: string, placeholderKey: string) => {
    const id = fieldId(name);
    const error = errors[name];
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {t(`Fields.${name}`)}
        </label>
        <input
          id={id}
          type="number"
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

  const renderSelect = (name: string, placeholderKey: string, optionsKey: string) => {
    const id = fieldId(name);
    const error = errors[name];
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {t(`Fields.${name}`)}
        </label>
        <select
          id={id}
          value={getValue(name)}
          onChange={(e) => setField(name, e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${inputClass}${error ? errorBorderClass : ""}`}
        >
          <option value="">{t(`Placeholders.${placeholderKey}`)}</option>
          {Object.entries(t(`SelectOptions.${optionsKey}`)).map(([value, label]) => (
            <option key={value} value={value}>
              {label as string}
            </option>
          ))}
        </select>
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

  const renderCheckbox = (name: string, labelKey: string) => {
    const id = fieldId(name);
    const checked = getValue(name) === "true";
    return (
      <div>
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => setBoolean(name, e.target.checked)}
            className="accent-brand-600 dark:accent-brand-500 h-5 w-5 cursor-pointer"
          />
          {t(labelKey)}
        </label>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="tabpanel">
      {renderTextInput("title", "title")}

      {renderSelect("listing_status", "listing_status", "listing_status")}

      {renderCheckbox("is_featured", "Fields.is_featured")}

      {renderSelect("type", "type", "type")}

      {renderSelect("property_subtype", "property_subtype", "property_subtype")}

      {renderSelect("sale_type", "sale_type", "sale_type")}

      {renderNumericInput("price", "price")}

      {renderSelect("currency", "currency", "currency")}

      {renderTextInput("country", "country")}

      {renderTextInput("city", "city")}

      {renderTextInput("neighborhood", "neighborhood")}

      {renderTextInput("street_address", "street_address")}

      {renderTextInput("region", "region")}

      <div className="col-span-2">
        <label className={labelClass}>{t("Fields.coords")}</label>
        <PropertyMapPicker
          lat={lat}
          lng={lng}
          onChange={onCoordsChange}
          placeholder={t("Placeholders.coords")}
        />
      </div>

      {renderTextarea("description", "Textareas.description", 4, "description")}

      {renderTextarea("meta_description", "Textareas.meta_description", 3, "meta_description")}
    </div>
  );
}