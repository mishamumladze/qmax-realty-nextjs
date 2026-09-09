"use client";
import { Fragment, useEffect, useId, useRef, useState, useCallback } from "react";
import type { PropertyFormData } from "@/types/admin";
import type { Property } from "@/types/property";
import type { MediaImage } from "./PropertyMediaUploader";
import { Button } from "@/components/ui/Buttons";
import { useLocale, useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyGeneralTab } from "./PropertyGeneralTab";
import { PropertySpecsTab } from "./PropertySpecsTab";
import { PropertyAmenitiesTab } from "./PropertyAmenitiesTab";
import { PropertyMediaTab } from "./PropertyMediaTab";
import { PropertySeoTab } from "./PropertySeoTab";
import { PropertyActionsTab } from "./PropertyActionsTab";
interface PropertyFormModalProps {
  open: boolean;
  property: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
  onDelete?: (ids: number[]) => Promise<void>;
  onActivate?: (ids: number[]) => Promise<void>;
  onDeactivate?: (ids: number[]) => Promise<void>;
}
const DRAFT_KEY = "property-form-draft";
// Translatable text fields edited in the UI locale. Absent keys in the save
// payload mean "unchanged", so these are diffed against a snapshot on save.
const TRANSLATABLE_KEYS = [
  "title",
  "neighborhood",
  "city",
  "country",
  "meta_description",
  "description",
  "sale_type",
] as const;
type TranslatableKey = (typeof TRANSLATABLE_KEYS)[number];
type SavePayload = Omit<PropertyFormData, "title"> & { title?: string; sourceLocale: string };
interface FormState {
  fields: Record<string, string>;
  booleans: Record<string, boolean>;
  view: string[];
  kitchenAppliances: string[];
  images: MediaImage[];
  lat: number | null;
  lng: number | null;
}
function defaultFormState(): FormState {
  return {
    fields: {
      title: "",
      type: "",
      property_subtype: "",
      sale_type: "",
      currency: "EUR",
      country: "",
      city: "",
      neighborhood: "",
      street_address: "",
      listing_status: "",
      price: "",
      price_type: "",
      cadastral_code: "",
      sqmt: "",
      lot_sqmt: "",
      ceiling_height: "",
      bedrooms: "",
      bathrooms: "",
      floor: "",
      total_floors: "",
      year_built: "",
      renovation_year: "",
      energy_class: "",
      building_status: "",
      condition: "",
      project_type: "",
      furnishing: "",
      balcony_sqmt: "",
      heating_type: "",
      hot_water_type: "",
      parking_type: "",
      video_url: "",
      virtual_tour_url: "",
      floor_plan_url: "",
      meta_title: "",
      meta_description: "",
      description: "",
      slug: "",
    },
    booleans: {
      is_featured: false,
      balcony: false,
      natural_gas: false,
      internet: false,
      water_supply: false,
      electricity: false,
      tv: false,
      sewerage: false,
      elevator: false,
      ac: false,
      security: false,
      swimming_pool: false,
      sauna_jacuzzi: false,
      gym: false,
      private_yard: false,
      bbq_area: false,
      concierge: false,
      fireplace: false,
      storage: false,
      intercom: false,
      pet_friendly: false,
      wheelchair_accessible: false,
    },
    view: [],
    kitchenAppliances: [],
    images: [],
    lat: null,
    lng: null,
  };
}
function formStateToDraft(state: FormState): string {
  return JSON.stringify(state);
}
function parseDraft(draft: string): FormState | null {
  try {
    const parsed = JSON.parse(draft);
    return {
      fields: parsed.fields || defaultFormState().fields,
      booleans: parsed.booleans || defaultFormState().booleans,
      view: Array.isArray(parsed.view) ? parsed.view : [],
      kitchenAppliances: Array.isArray(parsed.kitchenAppliances) ? parsed.kitchenAppliances : [],
      images: Array.isArray(parsed.images) ? parsed.images : [],
      lat: typeof parsed.lat === "number" ? parsed.lat : null,
      lng: typeof parsed.lng === "number" ? parsed.lng : null,
    };
  } catch {
    return null;
  }
}
function imagesToStrings(images: MediaImage[]): {
  gallery: string[];
  card_image: string | undefined;
  floor_plan: string | undefined;
} {
  const gallery = images.map((img) => img.url);
  const coverImage = images.find((img) => img.isCover);
  const floorPlanImage = images.find((img) => img.isFloorPlan);
  return {
    gallery,
    card_image: coverImage?.url,
    floor_plan: floorPlanImage?.url,
  };
}
function stringsToImages(
  gallery: string[] | undefined,
  card_image: string | undefined,
  floor_plan: string | undefined
): MediaImage[] {
  const images: MediaImage[] = [];
  const galleryUrls = gallery || [];
  const coverUrl = card_image;
  const floorPlanUrl = floor_plan;
  for (const url of galleryUrls) {
    const isCover = url === coverUrl;
    const isFloorPlan = url === floorPlanUrl;
    images.push({ id: crypto.randomUUID(), url, isCover, isFloorPlan });
  }
  if (coverUrl && !galleryUrls.includes(coverUrl)) {
    images.unshift({ id: crypto.randomUUID(), url: coverUrl, isCover: true, isFloorPlan: false });
  }
  if (floorPlanUrl && !galleryUrls.includes(floorPlanUrl) && floorPlanUrl !== coverUrl) {
    images.push({ id: crypto.randomUUID(), url: floorPlanUrl, isCover: false, isFloorPlan: true });
  }
  return images;
}
export function PropertyFormModal({
  open,
  property,
  onClose,
  onSaved,
  onDelete,
  onActivate,
  onDeactivate,
}: PropertyFormModalProps) {
  const t = useTranslations("Components.Admin.PropertyFormModal");
  const locale = useLocale();
  const snapshotRef = useRef<Record<TranslatableKey, string> | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const baseId = useId();
  const titleId = useId();
  const saveDraftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldId = (name: string) => `${baseId}-${name}`;
  const booleanFields = new Set([
    "is_featured",
    "balcony",
    "natural_gas",
    "internet",
    "water_supply",
    "electricity",
    "tv",
    "sewerage",
    "elevator",
    "ac",
    "security",
    "swimming_pool",
    "sauna_jacuzzi",
    "gym",
    "private_yard",
    "bbq_area",
    "concierge",
    "fireplace",
    "storage",
    "intercom",
    "pet_friendly",
    "wheelchair_accessible",
  ]);
  const getValue = useCallback(
    (name: string) => {
      if (booleanFields.has(name)) {
        return formState.booleans[name] ? "true" : "false";
      }
      return formState.fields[name] ?? "";
    },
    [formState.fields, formState.booleans]
  );
  const setField = useCallback((name: string, value: string) => {
    setFormState((prev) => {
      const next = { ...prev, fields: { ...prev.fields, [name]: value } };
      if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, formStateToDraft(next));
      }, 500);
      return next;
    });
  }, []);
  const setBoolean = useCallback((name: string, value: boolean) => {
    setFormState((prev) => {
      const next = { ...prev, booleans: { ...prev.booleans, [name]: value } };
      if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, formStateToDraft(next));
      }, 500);
      return next;
    });
  }, []);
  const setView = useCallback((view: string[]) => {
    setFormState((prev) => {
      const next = { ...prev, view };
      if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, formStateToDraft(next));
      }, 500);
      return next;
    });
  }, []);
  const setKitchenAppliances = useCallback((appliances: string[]) => {
    setFormState((prev) => {
      const next = { ...prev, kitchenAppliances: appliances };
      if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, formStateToDraft(next));
      }, 500);
      return next;
    });
  }, []);
  const setImages = useCallback((images: MediaImage[]) => {
    setFormState((prev) => {
      const next = { ...prev, images };
      if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, formStateToDraft(next));
      }, 500);
      return next;
    });
  }, []);
  const setCoords = useCallback((lat: number, lng: number) => {
    setFormState((prev) => {
      const next = { ...prev, lat, lng };
      if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, formStateToDraft(next));
      }, 500);
      return next;
    });
  }, []);
  const loadFromProperty = useCallback(
    (prop: Property) => {
      const images = stringsToImages(prop.gallery, prop.card_image, prop.floor_plan);
      const extra = prop as unknown as Record<string, unknown>;
      const localizedText = (key: TranslatableKey, base: unknown): string => {
        if (locale === "en") return (base as string | undefined) ?? "";
        const variant = extra[`${key}_${locale}`] as string | undefined;
        return variant ?? (base as string | undefined) ?? "";
      };
      const localized: Record<TranslatableKey, string> = {
        title: localizedText("title", prop.title),
        neighborhood: localizedText("neighborhood", prop.neighborhood),
        city: localizedText("city", prop.city),
        country: localizedText("country", prop.country),
        meta_description: localizedText("meta_description", prop.meta_description),
        description: localizedText("description", prop.description),
        sale_type: localizedText("sale_type", prop.sale_type),
      };
      snapshotRef.current = { ...localized };
      const nextState: FormState = {
        fields: {
          title: localized.title,
          type: prop.type ?? "",
          property_subtype: prop.property_subtype ?? "",
          sale_type: localized.sale_type,
          currency: prop.currency ?? "EUR",
          country: localized.country,
          city: localized.city,
          neighborhood: localized.neighborhood,
          street_address: prop.street_address ?? "",
          listing_status: prop.listing_status ?? "",
          price: prop.price?.toString() ?? "",
          price_type: (extra.price_type as string | undefined) ?? "",
          cadastral_code: (extra.cadastral_code as string | undefined) ?? "",
          sqmt: prop.sqmt?.toString() ?? "",
          lot_sqmt: prop.lot_sqmt?.toString() ?? "",
          ceiling_height: prop.ceiling_height?.toString() ?? "",
          bedrooms: prop.bedrooms?.toString() ?? "",
          bathrooms: prop.bathrooms?.toString() ?? "",
          floor: prop.floor?.toString() ?? "",
          total_floors: prop.total_floors?.toString() ?? "",
          year_built: prop.year_built?.toString() ?? "",
          renovation_year: (extra.renovation_year as number | undefined)?.toString() ?? "",
          energy_class: (extra.energy_class as string | undefined) ?? "",
          building_status: prop.building_status ?? "",
          condition: prop.condition ?? "",
          project_type: prop.project_type ?? "",
          furnishing: prop.furnishing ?? "",
          balcony_sqmt: prop.balcony_sqmt?.toString() ?? "",
          heating_type: prop.heating_type ?? "",
          hot_water_type: prop.hot_water_type ?? "",
          parking_type: prop.parking_type ?? "",
          video_url: prop.video_url ?? "",
          virtual_tour_url: prop.virtual_tour_url ?? "",
          floor_plan_url: (extra.floor_plan_url as string | undefined) ?? "",
          meta_title: (extra.meta_title as string | undefined) ?? "",
          meta_description: localized.meta_description,
          description: localized.description,
          slug: "",
        },
        booleans: {
          is_featured: prop.is_featured ?? false,
          balcony: prop.balcony ?? false,
          natural_gas: prop.natural_gas ?? false,
          internet: prop.internet ?? false,
          water_supply: prop.water_supply ?? false,
          electricity: prop.electricity ?? false,
          tv: prop.tv ?? false,
          sewerage: prop.sewerage ?? false,
          elevator: prop.elevator ?? false,
          ac: prop.ac ?? false,
          security: prop.security ?? false,
          swimming_pool: prop.swimming_pool ?? false,
          sauna_jacuzzi: prop.sauna_jacuzzi ?? false,
          gym: prop.gym ?? false,
          private_yard: prop.private_yard ?? false,
          bbq_area: prop.bbq_area ?? false,
          concierge: prop.concierge ?? false,
          fireplace: prop.fireplace ?? false,
          storage: prop.storage ?? false,
          intercom: prop.intercom ?? false,
          pet_friendly: prop.pet_friendly ?? false,
          wheelchair_accessible: prop.wheelchair_accessible ?? false,
        },
        view: prop.view ?? [],
        kitchenAppliances: prop.kitchen_appliances ?? [],
        images,
        lat: prop.coords ? prop.coords[0] : null,
        lng: prop.coords ? prop.coords[1] : null,
      };
      // Batch state updates
      setFormState(nextState);
      setErrors({});
      setFormError(null);
      setSubmitting(false);
      setActiveTab(0);
    },
    [locale]
  );

  // Separate effect to load data when modal opens
  // This follows React patterns for initialization
  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      const parsed = parseDraft(draft);
      if (parsed) {
        setFormState(parsed);
      }
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    if (property) {
      loadFromProperty(property);
    } else {
      snapshotRef.current = null;
      loadDraft();
    }
  }, [open, property, loadFromProperty, loadDraft]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  const adminFetch = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("admin_token") : null;
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      throw new Error("Network request failed.");
    }
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      throw new Error("Unexpected server response.");
    }
    if (!res.ok) {
      throw new Error(
        (parsed as { error?: string }).error || res.statusText || `Request failed (${res.status})`
      );
    }
    return parsed as T;
  }, []);
  const validateTab = useCallback(
    (tabIndex: number): Record<string, string> => {
      const nextErrors: Record<string, string> = {};
      const { fields, booleans } = formState;
      const checkRequired = (name: string, labelKey: string) => {
        const value = fields[name]?.trim();
        if (!value) {
          nextErrors[name] = t("Validation.title_required").replace(
            "Title",
            t(`Fields.${labelKey}`)
          );
        }
      };
      const checkNumeric = (name: string) => {
        const raw = fields[name]?.trim();
        if (!raw || raw.trim() === "") return;
        if (!Number.isFinite(Number(raw.trim()))) {
          nextErrors[name] = t("Validation.must_be_number");
        }
      };
      if (tabIndex === 0) {
        checkRequired("title", "title");
        checkNumeric("price");
      }
      if (tabIndex === 1) {
        checkNumeric("sqmt");
        checkNumeric("lot_sqmt");
        checkNumeric("ceiling_height");
        checkNumeric("renovation_year");
        checkNumeric("bedrooms");
        checkNumeric("bathrooms");
        checkNumeric("total_floors");
        checkNumeric("year_built");
        checkNumeric("balcony_sqmt");
      }
      if (tabIndex === 2) {
        // No required fields in Amenities
      }
      if (tabIndex === 3) {
        // No required fields in Media
      }
      return nextErrors;
    },
    [formState, t]
  );
  const validateAll = useCallback((): Record<string, string> => {
    let allErrors: Record<string, string> = {};
    const tabCount = property ? 6 : 5;
    for (let i = 0; i < tabCount; i++) {
      allErrors = { ...allErrors, ...validateTab(i) };
    }
    return allErrors;
  }, [validateTab, property]);
  const handleTabChange = useCallback(
    (newTab: number) => {
      if (newTab === activeTab) return;
      const currentTabErrors = validateTab(activeTab);
      if (Object.keys(currentTabErrors).length > 0) {
        setErrors(currentTabErrors);
        const firstInvalid = Object.keys(currentTabErrors)[0];
        document.getElementById(fieldId(firstInvalid))?.focus();
        return;
      }
      setErrors({});
      setActiveTab(newTab);
    },
    [activeTab, validateTab]
  );
  const handleKeyDownTab = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      let newIndex = index;
      const tabCount = property ? 6 : 5;
      switch (event.key) {
        case "ArrowRight":
          newIndex = (index + 1) % tabCount;
          break;
        case "ArrowLeft":
          newIndex = (index - 1 + tabCount) % tabCount;
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = tabCount - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      handleTabChange(newIndex);
      const tabButton = document.getElementById(`tab-${newIndex}`);
      tabButton?.focus();
    },
    [handleTabChange, property]
  );
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const allErrors = validateAll();
    setErrors(allErrors);
    const firstInvalid = Object.keys(allErrors)[0];
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    const { fields, booleans, view, kitchenAppliances, images, lat, lng } = formState;
    const { gallery, card_image, floor_plan } = imagesToStrings(images);
    const payload: SavePayload & Record<string, unknown> = {
      sourceLocale: locale,
      type: fields.type || undefined,
      bedrooms: fields.bedrooms ? Number(fields.bedrooms) : undefined,
      bathrooms: fields.bathrooms ? Number(fields.bathrooms) : undefined,
      sqmt: fields.sqmt ? Number(fields.sqmt) : undefined,
      price: fields.price ? Number(fields.price) : undefined,
      price_type: fields.price_type || undefined,
      cadastral_code: fields.cadastral_code || undefined,
      energy_class: fields.energy_class || undefined,
      renovation_year: fields.renovation_year ? Number(fields.renovation_year) : undefined,
      floor_plan_url: fields.floor_plan_url || undefined,
      currency: fields.currency || undefined,
      year_built: fields.year_built ? Number(fields.year_built) : undefined,
      floor: fields.floor || undefined,
      gallery: gallery.length > 0 ? gallery : undefined,
      floor_plan: floor_plan,
      card_image: card_image,
      property_subtype: fields.property_subtype || undefined,
      furnishing: fields.furnishing || undefined,
      balcony: booleans.balcony,
      balcony_sqmt: fields.balcony_sqmt ? Number(fields.balcony_sqmt) : undefined,
      lot_sqmt: fields.lot_sqmt ? Number(fields.lot_sqmt) : undefined,
      view: view.length > 0 ? view : undefined,
      video_url: fields.video_url || undefined,
      virtual_tour_url: fields.virtual_tour_url || undefined,
      listing_status: fields.listing_status || undefined,
      is_featured: booleans.is_featured,
      street_address: fields.street_address || undefined,
      building_status: fields.building_status || undefined,
      condition: fields.condition || undefined,
      project_type: fields.project_type || undefined,
      ceiling_height: fields.ceiling_height ? Number(fields.ceiling_height) : undefined,
      heating_type: fields.heating_type || undefined,
      hot_water_type: fields.hot_water_type || undefined,
      parking_type: fields.parking_type || undefined,
      kitchen_appliances: kitchenAppliances.length > 0 ? kitchenAppliances : undefined,
      total_floors: fields.total_floors ? Number(fields.total_floors) : undefined,
      natural_gas: booleans.natural_gas,
      internet: booleans.internet,
      water_supply: booleans.water_supply,
      electricity: booleans.electricity,
      tv: booleans.tv,
      sewerage: booleans.sewerage,
      elevator: booleans.elevator,
      ac: booleans.ac,
      security: booleans.security,
      swimming_pool: booleans.swimming_pool,
      sauna_jacuzzi: booleans.sauna_jacuzzi,
      gym: booleans.gym,
      private_yard: booleans.private_yard,
      bbq_area: booleans.bbq_area,
      concierge: booleans.concierge,
      fireplace: booleans.fireplace,
      storage: booleans.storage,
      intercom: booleans.intercom,
      pet_friendly: booleans.pet_friendly,
      wheelchair_accessible: booleans.wheelchair_accessible,
    };
    // Translatable fields: absent keys mean "unchanged". In edit mode include
    // a key only when it differs from the snapshot taken at load; in
    // new-property mode (no snapshot) include all non-empty values.
    const candidates: Record<TranslatableKey, string | undefined> = {
      title: fields.title.trim(),
      neighborhood: fields.neighborhood || undefined,
      city: fields.city || undefined,
      country: fields.country || undefined,
      meta_description: fields.meta_description || undefined,
      description: fields.description || undefined,
      sale_type: fields.sale_type || undefined,
    };
    const out = payload as unknown as Record<string, string | undefined>;
    const snapshot = snapshotRef.current;
    if (snapshot) {
      for (const key of TRANSLATABLE_KEYS) {
        if (candidates[key] !== snapshot[key]) {
          out[key] = candidates[key];
        }
      }
    } else {
      for (const key of TRANSLATABLE_KEYS) {
        const value = candidates[key];
        if (value) out[key] = value;
      }
    }
    if (lat !== null && lng !== null) {
      payload.coords = [lat, lng];
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const data = await adminFetch<{ property: Property }>("/api/admin/properties", {
        method: property ? "PUT" : "POST",
        body: JSON.stringify(property ? { id: property.id, ...payload } : payload),
      });
      localStorage.removeItem(DRAFT_KEY);
      onSaved(data.property);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("Validation.something_wrong"));
    } finally {
      setSubmitting(false);
    }
  };
  if (!open) return null;
  const tabLabels = property
    ? [
        t("Tabs.general"),
        t("Tabs.specs"),
        t("Tabs.amenities"),
        t("Tabs.media"),
        t("Tabs.seo"),
        t("Tabs.actions"),
      ]
    : [t("Tabs.general"), t("Tabs.specs"), t("Tabs.amenities"), t("Tabs.media"), t("Tabs.seo")];
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-8 flex max-h-[92dvh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6
          shadow-2xl md:p-8 dark:bg-gray-800"
      >
        <div
          className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-4 bg-white pb-4
            dark:bg-gray-800"
        >
          <h2 id={titleId} className="text-h2 font-bold text-gray-900 dark:text-gray-100">
            {property ? t("Titles.edit") : t("Titles.add")}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            aria-label={t("Aria.close_dialog")}
            className="min-h-11 min-w-11"
          >
            <X className="h-5 w-5" aria-hidden="true"/>
          </Button>
        </div>
        <div
          role="tablist"
          className="-mx-1 mb-4 flex snap-x overflow-x-auto border-b border-gray-200 px-1
            dark:border-gray-700"
          aria-label={t("Aria.tabs")}
        >
          {tabLabels.map((label, index) => (
            <button
              key={index}
              id={`tab-${index}`}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls={`tabpanel-${index}`}
              tabIndex={activeTab === index ? 0 : -1}
              onClick={() => handleTabChange(index)}
              onKeyDown={(e) => handleKeyDownTab(e, index)}
              className={`min-h-[44px] border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap
                transition-colors ${
                activeTab === index
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : `border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400
                    dark:hover:text-gray-200`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto">
          <div
            id="tabpanel-0"
            role="tabpanel"
            aria-labelledby="tab-0"
            style={{ display: activeTab !== 0 ? "none" : "block" }}
          >
            <PropertyGeneralTab
              fields={formState.fields}
              setField={setField}
              setBoolean={setBoolean}
              getValue={getValue}
              errors={errors}
              t={t}
              property={property}
              lat={formState.lat}
              lng={formState.lng}
              onCoordsChange={setCoords}
            />
          </div>
          <div
            id="tabpanel-1"
            role="tabpanel"
            aria-labelledby="tab-1"
            style={{ display: activeTab !== 1 ? "none" : "block" }}
          >
            <PropertySpecsTab
              fields={formState.fields}
              setField={setField}
              setBoolean={setBoolean}
              getValue={getValue}
              errors={errors}
              t={t}
              view={formState.view}
              setView={setView}
              kitchenAppliances={formState.kitchenAppliances}
              setKitchenAppliances={setKitchenAppliances}
              propertyType={formState.fields.type}
              propertySubtype={formState.fields.property_subtype}
            />
          </div>
          <div
            id="tabpanel-2"
            role="tabpanel"
            aria-labelledby="tab-2"
            style={{ display: activeTab !== 2 ? "none" : "block" }}
          >
            <PropertyAmenitiesTab
              fields={formState.fields}
              setField={setField}
              setBoolean={setBoolean}
              getValue={getValue}
              errors={errors}
              t={t}
              kitchenAppliances={formState.kitchenAppliances}
              setKitchenAppliances={setKitchenAppliances}
            />
          </div>
          <div
            id="tabpanel-3"
            role="tabpanel"
            aria-labelledby="tab-3"
            style={{ display: activeTab !== 3 ? "none" : "block" }}
          >
            <PropertyMediaTab
              fields={formState.fields}
              setField={setField}
              setBoolean={setBoolean}
              getValue={getValue}
              errors={errors}
              t={t}
              images={formState.images}
              onImagesChange={setImages}
            />
          </div>
          <div
            id="tabpanel-4"
            role="tabpanel"
            aria-labelledby="tab-4"
            style={{ display: activeTab !== 4 ? "none" : "block" }}
          >
            <PropertySeoTab
              fields={formState.fields}
              setField={setField}
              setBoolean={setBoolean}
              getValue={getValue}
              errors={errors}
              t={t}
            />
          </div>
          {property && (
            <div
              id="tabpanel-5"
              role="tabpanel"
              aria-labelledby="tab-5"
              style={{ display: activeTab !== 5 ? "none" : "block" }}
            >
              <PropertyActionsTab
                propertyId={property.id}
                propertyTitle={property.title}
                onDelete={onDelete ?? (async () => {})}
                onActivate={onActivate ?? (async () => {})}
                onDeactivate={onDeactivate ?? (async () => {})}
                onDeleted={onClose}
              />
            </div>
          )}
          <div aria-live="polite" className="mt-4">
            {formError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            ) : null}
          </div>
          <div
            className="sticky bottom-0 mt-4 flex flex-col-reverse justify-end gap-3 border-t
              border-gray-200 bg-white pt-4 sm:flex-row dark:border-gray-700 dark:bg-gray-800"
          >
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              className="min-h-11 w-full sm:w-auto"
            >
              {t("Buttons.cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting}
              className="min-h-11 w-full sm:w-auto"
            >
              {submitting ? t("Buttons.saving") : t("Buttons.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
