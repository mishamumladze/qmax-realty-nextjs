"use client";
import { useId } from "react";
import {
  Accessibility,
  AirVent,
  ArrowUpDown,
  Beef,
  BellRing,
  CookingPot,
  Droplets,
  Dumbbell,
  Fence,
  Flame,
  FlameKindling,
  Microwave,
  Package,
  PawPrint,
  PlugZap,
  Refrigerator,
  ShieldCheck,
  ShowerHead,
  Tv,
  UtensilsCrossed,
  Video,
  WashingMachine,
  WavesLadder,
  Wifi,
} from "lucide-react";
import { AdminPillToggle } from "./AdminPillToggle";
interface SharedTabProps {
  fields: Record<string, string>;
  setField: (name: string, value: string) => void;
  setBoolean: (name: string, value: boolean) => void;
  getValue: (name: string) => string;
  errors: Record<string, string>;
  t: ((key: string) => string) & { raw: (key: string) => Record<string, unknown> };
  kitchenAppliances: string[];
  setKitchenAppliances: (appliances: string[]) => void;
}
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-11";
const errorBorderClass = " border-red-500 dark:border-red-500";
const errorTextClass = "mt-1 text-sm text-red-600 dark:text-red-400";
const AMENITY_BOOLEANS = [
  { value: "natural_gas", icon: Flame },
  { value: "internet", icon: Wifi },
  { value: "water_supply", icon: Droplets },
  { value: "electricity", icon: PlugZap },
  { value: "tv", icon: Tv },
  { value: "sewerage", icon: ShowerHead },
  { value: "elevator", icon: ArrowUpDown },
  { value: "ac", icon: AirVent },
  { value: "security", icon: ShieldCheck },
  { value: "swimming_pool", icon: WavesLadder },
  { value: "sauna_jacuzzi", icon: FlameKindling },
  { value: "gym", icon: Dumbbell },
  { value: "private_yard", icon: Fence },
  { value: "bbq_area", icon: Beef },
  { value: "concierge", icon: BellRing },
  { value: "fireplace", icon: Flame },
  { value: "storage", icon: Package },
  { value: "intercom", icon: Video },
  { value: "pet_friendly", icon: PawPrint },
  { value: "wheelchair_accessible", icon: Accessibility },
] as const;
const KITCHEN_APPLIANCES = [
  { value: "oven", icon: CookingPot },
  { value: "stove", icon: Flame },
  { value: "refrigerator", icon: Refrigerator },
  { value: "microwave", icon: Microwave },
  { value: "dishwasher", icon: UtensilsCrossed },
  { value: "washing_machine", icon: WashingMachine },
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
}: SharedTabProps) {
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;
  const renderSelect = (name: string, placeholderKey: string, optionsKey: string) => {
    const id = fieldId(name);
    const error = errors[name];
    // Fetch the object using t.raw() here
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
          {/* Map over the extracted object */}
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
  const toggleKitchenAppliance = (value: string) => {
    const newAppliances = kitchenAppliances.includes(value)
      ? kitchenAppliances.filter((a) => a !== value)
      : [...kitchenAppliances, value];
    setKitchenAppliances(newAppliances);
  };
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" role="tabpanel">
      <div className="md:col-span-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Tabs.amenities")}>
          {AMENITY_BOOLEANS.map((amenity) => (
            <AdminPillToggle
              key={amenity.value}
              checked={getValue(amenity.value) === "true"}
              onChange={() => setBoolean(amenity.value, !(getValue(amenity.value) === "true"))}
              icon={amenity.icon}
            >
              {t(`Fields.${amenity.value}`)}
            </AdminPillToggle>
          ))}
        </div>
      </div>
      <div className="md:col-span-3">
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
      <div className="grid grid-cols-1 gap-4 md:col-span-3 md:grid-cols-3">
        {renderSelect("heating_type", "heating_type", "heating_type")}
        {renderSelect("hot_water_type", "hot_water_type", "hot_water_type")}
        {renderSelect("parking_type", "parking_type", "parking_type")}
      </div>
    </div>
  );
}
