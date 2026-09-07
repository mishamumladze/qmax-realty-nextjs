"use client";
import { useId } from "react";
import {
  Building2,
  CookingPot,
  Fence,
  Flame,
  Microwave,
  Mountain,
  Refrigerator,
  Sailboat,
  Sun,
  TreePine,
  UtensilsCrossed,
  WashingMachine,
} from "lucide-react";
import { AdminPillToggle } from "./AdminPillToggle";
interface SharedTabProps {
  fields: Record<string, string>;
  setField: (name: string, value: string) => void;
  setBoolean: (name: string, value: boolean) => void;
  getValue: (name: string) => string;
  errors: Record<string, string>;
  t: ((key: string) => string) & { raw: (key: string) => Record<string, unknown> };
  view: string[];
  setView: (view: string[]) => void;
  kitchenAppliances: string[];
  setKitchenAppliances: (appliances: string[]) => void;
}
interface PropertySpecsTabProps extends SharedTabProps {
  propertyType: string;
  propertySubtype: string;
}
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-11";
const errorBorderClass = " border-red-500 dark:border-red-500";
const errorTextClass = "mt-1 text-sm text-red-600 dark:text-red-400";
const hintClass = "mt-1 text-xs text-gray-500 dark:text-gray-400";
const VIEW_OPTIONS = [
  { value: "city", icon: Building2 },
  { value: "mountain", icon: Mountain },
  { value: "sea", icon: Sailboat },
  { value: "courtyard", icon: Fence },
  { value: "park", icon: TreePine },
] as const;
const KITCHEN_APPLIANCES = [
  { value: "oven", icon: CookingPot },
  { value: "stove", icon: Flame },
  { value: "refrigerator", icon: Refrigerator },
  { value: "microwave", icon: Microwave },
  { value: "dishwasher", icon: UtensilsCrossed },
  { value: "washing_machine", icon: WashingMachine },
] as const;
export function PropertySpecsTab({
  fields,
  setField,
  setBoolean,
  getValue,
  errors,
  t,
  view,
  setView,
  kitchenAppliances,
  setKitchenAppliances,
  propertyType,
  propertySubtype,
}: PropertySpecsTabProps) {
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;
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
          placeholder={t(`Fields.${placeholderKey}`)}
        />
        {error ? <p className={errorTextClass}>{error}</p> : null}
      </div>
    );
  };
  const renderSelect = (name: string, placeholderKey: string, optionsKey: string) => {
    const id = fieldId(name);
    const error = errors[name];
    const optionsObject = t.raw(`SelectOptions.${optionsKey}`);
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
          {Object.entries(optionsObject).map(([value, label]) => (
            <option key={value} value={value}>
              {label as string}
            </option>
          ))}
        </select>
        {error ? <p className={errorTextClass}>{error}</p> : null}
      </div>
    );
  };
  const renderPillToggle = (name: string, labelKey: string) => {
    const checked = getValue(name) === "true";
    return (
      <div className="flex items-end">
        <AdminPillToggle checked={checked} onChange={() => setBoolean(name, !checked)} icon={Sun}>
          {t(labelKey)}
        </AdminPillToggle>
      </div>
    );
  };
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
  const toggleView = (value: string) => {
    const newView = view.includes(value) ? view.filter((v) => v !== value) : [...view, value];
    setView(newView);
  };
  const toggleKitchenAppliance = (value: string) => {
    const newAppliances = kitchenAppliances.includes(value)
      ? kitchenAppliances.filter((a) => a !== value)
      : [...kitchenAppliances, value];
    setKitchenAppliances(newAppliances);
  };
  const balconyChecked = getValue("balcony") === "true";
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="tabpanel">
      {renderNumericInput("sqmt", "sqmt")}
      {renderNumericInput("lot_sqmt", "lot_sqmt")}
      {renderNumericInput("ceiling_height", "ceiling_height")}
      {renderNumericInput("bedrooms", "bedrooms")}
      {renderNumericInput("bathrooms", "bathrooms")}
      {!(propertyType === "house" || propertyType === "land" || propertySubtype === "villa") &&
        renderTextInput("floor", "floor")}
      {renderNumericInput("total_floors", "total_floors")}
      {renderNumericInput("year_built", "year_built")}
      {renderNumericInput("renovation_year", "renovation_year")}
      {renderSelect("energy_class", "energy_class", "energy_class")}
      {renderSelect("building_status", "building_status", "building_status")}
      {renderSelect("condition", "condition", "condition")}
      {renderSelect("project_type", "project_type", "project_type")}
      {renderSelect("furnishing", "furnishing", "furnishing")}
      <div className="col-span-2">
        <label className={labelClass}>{t("Fields.view")}</label>
        <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("Fields.view")}>
          {VIEW_OPTIONS.map((option) => (
            <AdminPillToggle
              key={option.value}
              checked={view.includes(option.value)}
              onChange={() => toggleView(option.value)}
              icon={option.icon}
            >
              {t(`SelectOptions.view.${option.value}`)}
            </AdminPillToggle>
          ))}
        </div>
        {errors.view && <p className={errorTextClass}>{errors.view}</p>}
      </div>
      {renderPillToggle("balcony", "Fields.balcony")}
      {balconyChecked && renderNumericInput("balcony_sqmt", "balcony_sqmt")}
      <div className="col-span-2">
        <label className={labelClass}>{t("Fields.kitchen_appliances")}</label>
        <div
          className="mt-1 flex flex-wrap gap-2"
          role="group"
          aria-label={t("Fields.kitchen_appliances")}
        >
          {KITCHEN_APPLIANCES.map((appliance) => (
            <AdminPillToggle
              key={appliance.value}
              checked={kitchenAppliances.includes(appliance.value)}
              onChange={() => toggleKitchenAppliance(appliance.value)}
              icon={appliance.icon}
            >
              {t(`SelectOptions.kitchen_appliances.${appliance.value}`)}
            </AdminPillToggle>
          ))}
        </div>
        {errors.kitchen_appliances && <p className={errorTextClass}>{errors.kitchen_appliances}</p>}
      </div>
    </div>
  );
}
