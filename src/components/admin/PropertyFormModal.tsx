"use client";

import { Fragment, useEffect, useId, useRef, useState, useCallback } from "react";
import type { PropertyFormData } from "@/types/admin";
import type { Property } from "@/types/property";
import type { MediaImage } from "./PropertyMediaUploader";
import { Button } from "@/components/ui/Buttons";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyGeneralTab } from "./PropertyGeneralTab";
import { PropertySpecsTab } from "./PropertySpecsTab";
import { PropertyAmenitiesTab } from "./PropertyAmenitiesTab";
import { PropertyMediaTab } from "./PropertyMediaTab";

interface PropertyFormModalProps {
  open: boolean;
  property: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
}

const DRAFT_KEY = "property-form-draft";

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
      region: "",
      price: "",
      sqmt: "",
      lot_sqmt: "",
      ceiling_height: "",
      rooms: "",
      bedrooms: "",
      bathrooms: "",
      floor: "",
      total_floors: "",
      year_built: "",
      building_status: "",
      condition: "",
      project_type: "",
      furnishing: "",
      heating_type: "",
      hot_water_type: "",
      parking_type: "",
      video_url: "",
      virtual_tour_url: "",
      meta_title: "",
      meta_description: "",
      description: "",
      slug: "",
    },
    booleans: {
      listing_status: false,
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

function imagesToStrings(images: MediaImage[]): { gallery: string[]; card_image: string | undefined; floor_plan: string | undefined } {
  const gallery = images.map((img) => img.url);
  const coverImage = images.find((img) => img.isCover);
  const floorPlanImage = images.find((img) => img.isFloorPlan);
  return {
    gallery,
    card_image: coverImage?.url,
    floor_plan: floorPlanImage?.url,
  };
}

function stringsToImages(gallery: string[] | undefined, card_image: string | undefined, floor_plan: string | undefined): MediaImage[] {
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

export function PropertyFormModal({ open, property, onClose, onSaved }: PropertyFormModalProps) {
  const t = useTranslations("Components.Admin.PropertyFormModal");
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const baseId = useId();
  const titleId = useId();
  const saveDraftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldId = (name: string) => `${baseId}-${name}`;

  const getValue = useCallback((name: string) => formState.fields[name] ?? "", [formState.fields]);

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

  const loadFromProperty = useCallback((prop: Property) => {
    const images = stringsToImages(prop.gallery, prop.card_image, prop.floor_plan);
    const nextState: FormState = {
      fields: {
        title: prop.title ?? "",
        type: prop.type ?? "",
        property_subtype: prop.property_subtype ?? "",
        sale_type: prop.sale_type ?? "",
        currency: prop.currency ?? "EUR",
        country: prop.country ?? "",
        city: prop.city ?? "",
        neighborhood: prop.neighborhood ?? "",
        street_address: prop.street_address ?? "",
        region: prop.region ?? "",
        price: prop.price?.toString() ?? "",
        sqmt: prop.sqmt?.toString() ?? "",
        lot_sqmt: prop.lot_sqmt?.toString() ?? "",
        ceiling_height: prop.ceiling_height?.toString() ?? "",
        rooms: prop.rooms?.toString() ?? "",
        bedrooms: prop.bedrooms?.toString() ?? "",
        bathrooms: prop.bathrooms?.toString() ?? "",
        floor: prop.floor?.toString() ?? "",
        total_floors: prop.total_floors?.toString() ?? "",
        year_built: prop.year_built?.toString() ?? "",
        building_status: prop.building_status ?? "",
        condition: prop.condition ?? "",
        project_type: prop.project_type ?? "",
        furnishing: prop.furnishing ?? "",
        heating_type: prop.heating_type ?? "",
        hot_water_type: prop.hot_water_type ?? "",
        parking_type: prop.parking_type ?? "",
        video_url: prop.video_url ?? "",
        virtual_tour_url: prop.virtual_tour_url ?? "",
        meta_description: prop.meta_description ?? "",
        description: prop.description ?? "",
        slug: "",
      },
      booleans: {
        listing_status: prop.listing_status === "published",
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
      },
      view: prop.view ?? [],
      kitchenAppliances: prop.kitchen_appliances ?? [],
      images,
      lat: prop.coords ? prop.coords[0] : null,
      lng: prop.coords ? prop.coords[1] : null,
    };
    setFormState(nextState);
    setErrors({});
    setFormError(null);
    setSubmitting(false);
    setActiveTab(0);
  }, []);

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
          nextErrors[name] = t("Validation.title_required").replace("Title", t(`Fields.${labelKey}`));
        }
      };

      const checkNumeric = (name: string) => {
        const raw = fields[name]?.trim();
        if (raw !== "" && !Number.isFinite(Number(raw))) {
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
        checkNumeric("rooms");
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
    for (let i = 0; i < 4; i++) {
      allErrors = { ...allErrors, ...validateTab(i) };
    }
    return allErrors;
  }, [validateTab]);

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
      switch (event.key) {
        case "ArrowRight":
          newIndex = (index + 1) % 4;
          break;
        case "ArrowLeft":
          newIndex = (index - 1 + 4) % 4;
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = 3;
          break;
        default:
          return;
      }
      event.preventDefault();
      handleTabChange(newIndex);
      const tabButton = document.getElementById(`tab-${newIndex}`);
      tabButton?.focus();
    },
    [handleTabChange]
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

    const payload: PropertyFormData = {
      title: fields.title.trim(),
      type: fields.type || undefined,
      neighborhood: fields.neighborhood || undefined,
      city: fields.city || undefined,
      region: fields.region || undefined,
      country: fields.country || undefined,
      rooms: fields.rooms ? Number(fields.rooms) : undefined,
      bedrooms: fields.bedrooms ? Number(fields.bedrooms) : undefined,
      bathrooms: fields.bathrooms ? Number(fields.bathrooms) : undefined,
      sqmt: fields.sqmt ? Number(fields.sqmt) : undefined,
      price: fields.price ? Number(fields.price) : undefined,
      currency: fields.currency || undefined,
      sale_type: fields.sale_type || undefined,
      year_built: fields.year_built ? Number(fields.year_built) : undefined,
      floor: fields.floor || undefined,
      meta_description: fields.meta_description || undefined,
      description: fields.description || undefined,
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
    };

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

  const tabLabels = [
    t("Tabs.general"),
    t("Tabs.specs"),
    t("Tabs.amenities"),
    t("Tabs.media"),
  ];

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
        className="my-8 w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] flex flex-col"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {property ? t("Titles.edit") : t("Titles.add")}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            aria-label={t("Aria.close_dialog")}
            className="min-h-11 min-w-11"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div role="tablist" className="flex border-b border-gray-200 dark:border-gray-700 mb-4" aria-label={t("Aria.tabs")}>
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
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === index
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto">
          <div id="tabpanel-0" role="tabpanel" aria-labelledby="tab-0" style={{ display: activeTab !== 0 ? "none" : "block" }}>
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

          <div id="tabpanel-1" role="tabpanel" aria-labelledby="tab-1" style={{ display: activeTab !== 1 ? "none" : "block" }}>
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
            />
          </div>

          <div id="tabpanel-2" role="tabpanel" aria-labelledby="tab-2" style={{ display: activeTab !== 2 ? "none" : "block" }}>
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

          <div id="tabpanel-3" role="tabpanel" aria-labelledby="tab-3" style={{ display: activeTab !== 3 ? "none" : "block" }}>
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

          <div aria-live="polite" className="mt-4">
            {formError ? <p className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 mt-4">
            <Button variant="secondary" type="button" onClick={onClose} className="min-h-11">
              {t("Buttons.cancel")}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="min-h-11">
              {submitting ? t("Buttons.saving") : t("Buttons.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}