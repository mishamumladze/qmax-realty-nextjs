"use client";

import { useId } from "react";

interface SharedTabProps {
  fields: Record<string, string>;
  setField: (name: string, value: string) => void;
  setBoolean: (name: string, value: boolean) => void;
  getValue: (name: string) => string;
  errors: Record<string, string>;
  t: (key: string) => string;
  kitchenAppliances: string[];
  setKitchenAppliances: (appliances: string[]) => void;
}

interface PropertyAmenitiesTabProps extends SharedTabProps {}

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-11";
const errorBorderClass = " border-red-500 dark:border-red-500";
const errorTextClass = "mt-1 text-sm text-red-600 dark:text-red-400";

const AMENITY_BOOLEANS = [
  "natural_gas",
  "internet",
  "water_supply",
  "electricity",
  "tv",
  "sewerage",
  "elevator",
  "ac",
  "security",
] as const;

const KITCHEN_APPLIANCES = [
  "oven",
  "stove",
  "refrigerator",
  "microwave",
  "dishwasher",
  "washing_machine",
] as const;

export function PropertyAmenitiesTab({
  fields,
  setField,
  setBoolean,
  getValue,
  errors,
  t,
  kitchenAppliances,
  setKitchenAppliances,
}: PropertyAmenitiesTabProps) {
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

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

  const toggleKitchenAppliance = (value: string) => {
    const newAppliances = kitchenAppliances.includes(value)
      ? kitchenAppliances.filter((a) => a !== value)
      : [...kitchenAppliances, value];
    setKitchenAppliances(newAppliances);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" role="tabpanel">
      {AMENITY_BOOLEANS.map((amenity) => (
        <div key={amenity}>{renderCheckbox(amenity, `Fields.${amenity}`)}</div>
      ))}

      <div className="md:col-span-3">
        <label className={labelClass}>{t("Fields.kitchen_appliances")}</label>
        <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("Fields.kitchen_appliances")}>
          {KITCHEN_APPLIANCES.map((appliance) => (
            <label
              key={appliance}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                kitchenAppliances.includes(appliance)
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={kitchenAppliances.includes(appliance)}
                onChange={() => toggleKitchenAppliance(appliance)}
                className="sr-only"
              />
              {t(`SelectOptions.kitchen_appliances.${appliance}`)}
            </label>
          ))}
        </div>
        {errors.kitchen_appliances && <p className={errorTextClass}>{errors.kitchen_appliances}</p>}
      </div>

      <div className="md:col-span-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {renderSelect("heating_type", "heating_type", "heating_type")}
        {renderSelect("hot_water_type", "hot_water_type", "hot_water_type")}
        {renderSelect("parking_type", "parking_type", "parking_type")}
      </div>
    </div>
  );
}