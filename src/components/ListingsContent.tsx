"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Search,
  LayoutGrid,
  Building2,
  Home as HomeIcon,
  SlidersHorizontal,
  X,
  Tag,
  Globe,
  MapPin,
  BedDouble,
  Bath,
  CircleDollarSign,
  RotateCcw,
  Check,
  SearchX,
  DoorOpen,
  Bed,
  SquareDashed,
  Star,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { Property } from "@/types/property";
import { CONTACT_INFO } from "@/config/contact";
import { PropertyCardSkeleton } from "@/components/ui/Skeleton";

interface ListingsContentProps {
  initialProperties: Property[];
  geoCountries: string[];
  geoCities: string[];
  initialFilter?: string;
  initialOffer?: string;
  isLoading?: boolean;
}

export default function ListingsContent({
  initialProperties,
  geoCountries,
  geoCities,
  initialFilter = "all",
  initialOffer = "all",
  isLoading = false,
}: ListingsContentProps) {
  const t = useTranslations("Pages.Listings");

  // ─── Filter State ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(initialFilter);
  const [offerFilter, setOfferFilter] = useState<string>(initialOffer);
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [bedroomsFilter, setBedroomsFilter] = useState<number>(0);
  const [bathroomsFilter, setBathroomsFilter] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");

  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Temporary draft state for the modal options
  const [draftOffer, setDraftOffer] = useState(offerFilter);
  const [draftType, setDraftType] = useState(typeFilter);
  const [draftCountry, setDraftCountry] = useState(countryFilter);
  const [draftCity, setDraftCity] = useState(cityFilter);
  const [draftBedrooms, setDraftBedrooms] = useState(bedroomsFilter);
  const [draftBathrooms, setDraftBathrooms] = useState(bathroomsFilter);
  const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);

  // ─── Modal Refs & Focus Management ────────────────────────────────────────────
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      filtersButtonRef.current?.focus();
    }, 0);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    modal.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  // ─── Preset Price Handlers ──────────────────────────────────────────────────
  const applyPresetPrice = (preset: string) => {
    switch (preset) {
      case "u200":
        setDraftMinPrice("");
        setDraftMaxPrice("200000");
        break;
      case "200-400":
        setDraftMinPrice("200000");
        setDraftMaxPrice("400000");
        break;
      case "400-600":
        setDraftMinPrice("400000");
        setDraftMaxPrice("600000");
        break;
      case "600p":
        setDraftMinPrice("600000");
        setDraftMaxPrice("");
        break;
    }
  };

  const openModal = () => {
    setDraftOffer(offerFilter);
    setDraftType(typeFilter);
    setDraftCountry(countryFilter);
    setDraftCity(cityFilter);
    setDraftBedrooms(bedroomsFilter);
    setDraftBathrooms(bathroomsFilter);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setIsModalOpen(true);
  };

  const applyModalFilters = () => {
    setOfferFilter(draftOffer);
    setTypeFilter(draftType);
    setCountryFilter(draftCountry);
    setCityFilter(draftCity);
    setBedroomsFilter(draftBedrooms);
    setBathroomsFilter(draftBathrooms);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setIsModalOpen(false);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setOfferFilter("all");
    setCountryFilter("");
    setCityFilter("");
    setBedroomsFilter(0);
    setBathroomsFilter(0);
    setMinPrice("");
    setMaxPrice("");
    setDraftOffer("all");
    setDraftType("all");
    setDraftCountry("");
    setDraftCity("");
    setDraftBedrooms(0);
    setDraftBathrooms(0);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setSortBy("default");
  };

  // ─── Filter & Sort Logic ────────────────────────────────────────────────────
  const filteredProperties = useMemo(() => {
    return initialProperties
      .filter((p) => {
        // Tab type filter
        if (typeFilter !== "all" && p.type !== typeFilter) return false;

        // Purpose / Offer filter
        if (offerFilter !== "all") {
          const isRent = (p.sale_type || "").toLowerCase().includes("rent");
          if (offerFilter === "rent" && !isRent) return false;
          if (offerFilter === "sale" && isRent) return false;
        }

        // Location & Search
        if (countryFilter && p.country !== countryFilter) return false;
        if (cityFilter && p.city !== cityFilter) return false;

        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchTitle = (p.title || "").toLowerCase().includes(query);
          const matchLocation = (p.location || "").toLowerCase().includes(query);
          const matchNeighborhood = (p.neighborhood || "").toLowerCase().includes(query);
          if (!matchTitle && !matchLocation && !matchNeighborhood) return false;
        }

        // Specs & Price
        if (bedroomsFilter > 0 && (p.bedrooms || 0) < bedroomsFilter) return false;
        if (bathroomsFilter > 0 && (p.bathrooms || 0) < bathroomsFilter) return false;

        const price = p.price || 0;
        if (minPrice !== "" && price < Number(minPrice)) return false;
        if (maxPrice !== "" && price > Number(maxPrice)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
        if (sortBy === "sqmt-asc") return (a.sqmt || 0) - (b.sqmt || 0);
        if (sortBy === "sqmt-desc") return (b.sqmt || 0) - (a.sqmt || 0);
        return 0;
      });
  }, [
    initialProperties,
    typeFilter,
    offerFilter,
    countryFilter,
    cityFilter,
    searchTerm,
    bedroomsFilter,
    bathroomsFilter,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // Dynamic counts per tab
  const counts = useMemo(() => {
    const c = { all: initialProperties.length, apartment: 0, house: 0 };
    initialProperties.forEach((p) => {
      const type = p.type as "apartment" | "house";
      if (type && c[type] !== undefined) c[type]++;
    });
    return c;
  }, [initialProperties]);

  // Active filter badge count calculation
  const activeModalFiltersCount = useMemo(() => {
    let count = 0;
    if (offerFilter !== "all") count++;
    if (countryFilter) count++;
    if (cityFilter) count++;
    if (bedroomsFilter > 0) count++;
    if (bathroomsFilter > 0) count++;
    if (minPrice || maxPrice) count++;
    return count;
  }, [offerFilter, countryFilter, cityFilter, bedroomsFilter, bathroomsFilter, minPrice, maxPrice]);

  return (
    <>
      {/* Hero Banner */}
      <header
        aria-labelledby="listings-hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800
          to-brand-800 text-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"/>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 md:py-20">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/25
              bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-200"/>
            QMAX Realty
          </span>
          <h1 id="listings-hero-heading" className="mt-5 text-h1 font-bold text-balance">
            {t("Hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-50/90 md:text-lg">
            {t("Hero.subtitle")}
          </p>
          <div className="relative mx-auto mt-8 max-w-xl">
            <label htmlFor="property-search" className="sr-only">
              {t("Hero.search")}
            </label>
            <div className="relative">
              <Search
                className="text-brand-500 pointer-events-none absolute top-1/2 left-4 h-5 w-5
                  -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="property-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("Hero.search_text")}
                autoComplete="off"
                className="focus:ring-brand-300 min-h-[44px] w-full rounded-xl bg-white/95 py-3.5
                  pr-12 pl-12 text-base text-gray-800 shadow-lg focus:ring-2 focus:outline-none
                  dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                aria-label={t("Hero.search")}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label={t("Filters.Aria.remove_search")}
                  className="absolute top-1/2 right-2 flex min-h-11 min-w-11 -translate-y-1/2
                    items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100
                    hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700
                    dark:hover:text-white"
                >
                  <X className="h-5 w-5" aria-hidden="true"/>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter & Sort Bar */}
      <div
        className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur
          md:top-16 dark:border-gray-700 dark:bg-gray-900/95"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            {/* Type Filter Tabs */}
            <div
              className="scrollbar-hide -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0
                sm:pb-0 sm:px-0"
              aria-label={t("Filters.Aria.type_filter")}
            >
              <h3 className="sr-only">{t("Filters.Aria.type_filter")}</h3>
              {[
                { key: "all", label: t("Sort.all"), icon: LayoutGrid },
                { key: "apartment", label: t("Sort.apartments"), icon: Building2 },
                { key: "house", label: t("Sort.houses"), icon: HomeIcon },
              ].map(({ key, label, icon: Icon }) => {
                const isActive = typeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTypeFilter(key)}
                    className={`flex min-h-[44px] cursor-pointer snap-start items-center gap-1.5
                    rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap
                    transition-all duration-200 ${
                      isActive
                        ? `bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500
                          text-white`
                        : `border-gray-200 bg-white text-gray-700 hover:bg-gray-50
                          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
                          dark:hover:bg-gray-700`
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true"/>
                    {label}
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {counts[key as keyof typeof counts] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Trigger & Sort */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0 sm:items-center">
              <button
                ref={filtersButtonRef}
                type="button"
                onClick={openModal}
                className="border-brand-600 text-brand-700 bg-brand-50 hover:bg-brand-100
                  dark:border-brand-500 dark:text-brand-300 dark:bg-brand-900/30
                  dark:hover:bg-brand-900/50 relative inline-flex min-h-[44px] w-full cursor-pointer
                  items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm
                  font-semibold transition-colors duration-200 sm:w-auto"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true"/>
                {t("Sort.Filters.title")}
                {activeModalFiltersCount > 0 && (
                  <span
                    className="bg-brand-600 absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem]
                      items-center justify-center rounded-full px-1 text-[11px] font-bold
                      text-white"
                    aria-hidden="true"
                  >
                    {activeModalFiltersCount}
                  </span>
                )}
              </button>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <label
                  htmlFor="sort-select"
                  className="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  {t("Filters.Labels.sort")}
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="focus:ring-brand-400 min-h-[44px] w-full rounded-lg border
                    border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2
                    focus:outline-none sm:w-auto dark:border-gray-700 dark:bg-gray-800
                    dark:text-white"
                >
                <option value="default">{t("Sort.Filters.revelance")}</option>
                <option value="price-asc">{t("Sort.Filters.price_asc")}</option>
                <option value="price-desc">{t("Sort.Filters.price_desc")}</option>
                <option value="sqmt-asc">{t("Sort.Filters.sqmt_asc")}</option>
                <option value="sqmt-desc">{t("Sort.Filters.sqmt_desc")}</option>
              </select>
              </div>
            </div>
          </div>

          {/* Active Filters Chips */}
          {(activeModalFiltersCount > 0 || searchTerm) && (
            <div
              className="flex items-center gap-2 border-t border-gray-200 py-2 dark:border-gray-700"
            >
              <h3
                className="shrink-0 text-xs font-semibold tracking-wide text-gray-600 uppercase
                  dark:text-gray-400"
              >
                {t("Filters.Labels.active")}
              </h3>
              <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
                {searchTerm && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {t("Filters.Labels.search_chip", { term: searchTerm })}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11
                        min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_search")}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
                {offerFilter !== "all" && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {t("Filters.Labels.offer_chip", { offer: offerFilter })}
                    <button
                      onClick={() => setOfferFilter("all")}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_offer")}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
                {countryFilter && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {countryFilter}
                    <button
                      onClick={() => setCountryFilter("")}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_item", { item: countryFilter })}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
                {cityFilter && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {cityFilter}
                    <button
                      onClick={() => setCityFilter("")}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_item", { item: cityFilter })}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
                {bedroomsFilter > 0 && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {t("Filters.Labels.beds_chip", { n: bedroomsFilter })}
                    <button
                      onClick={() => setBedroomsFilter(0)}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_bedrooms")}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
                {bathroomsFilter > 0 && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {t("Filters.Labels.baths_chip", { n: bathroomsFilter })}
                    <button
                      onClick={() => setBathroomsFilter(0)}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_bathrooms")}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    ${minPrice || "0"} - ${maxPrice || "Any"}
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="hover:text-brand-900 dark:hover:text-brand-100 -m-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1"
                      aria-label={t("Filters.Aria.remove_price")}
                    >
                      <X className="h-4 w-4" aria-hidden="true"/>
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-brand-700 dark:text-brand-300 inline-flex min-h-[44px] shrink-0
                  cursor-pointer items-center text-xs font-semibold hover:underline"
              >
                {t("Filters.Labels.clear_all")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t("Filters.Aria.open")}
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={closeModal}/>
          <div className="relative flex min-h-full items-center justify-center p-4 pb-20 md:pb-4">
            <div
              ref={modalRef}
              tabIndex={-1}
              className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden
                rounded-2xl bg-white shadow-2xl outline-none dark:bg-gray-900"
            >
              <div
                className="flex items-center justify-between border-b border-gray-200 px-6 py-4
                  dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="text-brand-600 h-5 w-5" aria-hidden="true"/>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    {t("Filters.Labels.filter_properties")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center
                    rounded-lg p-2 text-gray-600 hover:text-gray-800 dark:hover:text-gray-200"
                  aria-label={t("Filters.Aria.close")}
                >
                  <X className="h-5 w-5" aria-hidden="true"/>
                </button>
              </div>

              <div className="max-h-[60vh] flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {/* Offer Pill Selection */}
                <div>
                  <span
                    className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                      uppercase dark:text-gray-400"
                  >
                    <Tag className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"/>
                    {t("Filters.Labels.availability")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: t("Sort.all"), icon: LayoutGrid },
                      { key: "sale", label: t("Filters.for_sale"), icon: Tag },
                      { key: "rent", label: t("Filters.for_rent"), icon: Check },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraftOffer(key)}
                        aria-pressed={draftOffer === key}
                        className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2
                        rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          draftOffer === key
                            ? `bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500
                              text-white`
                            : `border-gray-200 bg-white text-gray-600 hover:bg-gray-50
                              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                              dark:hover:bg-gray-700`
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true"/>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type Selection */}
                <div>
                  <span
                    className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                      uppercase dark:text-gray-400"
                  >
                    <LayoutGrid
                      className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                    />
                    {t("Filters.Labels.property_type")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: t("Sort.all"), icon: LayoutGrid },
                      { key: "apartment", label: t("Sort.apartments"), icon: Building2 },
                      { key: "house", label: t("Sort.houses"), icon: HomeIcon },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraftType(key)}
                        aria-pressed={draftType === key}
                        className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2
                        rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          draftType === key
                            ? `bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500
                              text-white`
                            : `border-gray-200 bg-white text-gray-600 hover:bg-gray-50
                              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                              dark:hover:bg-gray-700`
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true"/>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country & City */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="filter-country"
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <Globe
                        className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                        aria-hidden="true"
                      />
                      {t("Filters.Labels.country")}
                    </label>
                    <select
                      id="filter-country"
                      value={draftCountry}
                      onChange={(e) => setDraftCountry(e.target.value)}
                      className="focus:ring-brand-400 min-h-[44px] w-full rounded-lg border
                        border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2
                        focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">{t("Filters.Options.all_countries")}</option>
                      {geoCountries.map((gc) => (
                        <option key={gc} value={gc}>
                          {gc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="filter-city"
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <MapPin
                        className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                        aria-hidden="true"
                      />
                      {t("Filters.Labels.city")}
                    </label>
                    <select
                      id="filter-city"
                      value={draftCity}
                      onChange={(e) => setDraftCity(e.target.value)}
                      className="focus:ring-brand-400 min-h-[44px] w-full rounded-lg border
                        border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2
                        focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">{t("Filters.Options.all_cities")}</option>
                      {geoCities.map((gc) => (
                        <option key={gc} value={gc}>
                          {gc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="filter-bedrooms"
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <BedDouble
                        className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                        aria-hidden="true"
                      />
                      {t("Filters.Labels.bedrooms")}
                    </label>
                    <select
                      id="filter-bedrooms"
                      value={draftBedrooms}
                      onChange={(e) => setDraftBedrooms(Number(e.target.value))}
                      className="focus:ring-brand-400 min-h-[44px] w-full rounded-lg border
                        border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2
                        focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value={0}>{t("Filters.Options.any")}</option>
                      <option value={1}>1+</option>
                      <option value={2}>2+</option>
                      <option value={3}>3+</option>
                      <option value={4}>4+</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="filter-bathrooms"
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <Bath
                        className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                        aria-hidden="true"
                      />
                      {t("Filters.Labels.bathrooms")}
                    </label>
                    <select
                      id="filter-bathrooms"
                      value={draftBathrooms}
                      onChange={(e) => setDraftBathrooms(Number(e.target.value))}
                      className="focus:ring-brand-400 min-h-[44px] w-full rounded-lg border
                        border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2
                        focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value={0}>{t("Filters.Options.any")}</option>
                      <option value={1}>1+</option>
                      <option value={2}>2+</option>
                      <option value={3}>3+</option>
                    </select>
                  </div>
                </div>

                {/* Price Presets & Range */}
                <div>
                  <span
                    className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                      uppercase dark:text-gray-400"
                  >
                    <CircleDollarSign
                      className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                    />
                    {t("Filters.Labels.price_range")}
                  </span>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("u200")}
                      aria-pressed={draftMinPrice === "" && draftMaxPrice === "200000"}
                      className={`min-h-[44px] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        draftMinPrice === "" && draftMaxPrice === "200000"
                          ? `border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500`
                          : `hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300 text-brand-700 dark:text-brand-300 border-gray-200 dark:border-gray-700`
                      }`}
                    >
                      {t("Filters.Presets.under_200k")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("200-400")}
                      aria-pressed={draftMinPrice === "200000" && draftMaxPrice === "400000"}
                      className={`min-h-[44px] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        draftMinPrice === "200000" && draftMaxPrice === "400000"
                          ? `border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500`
                          : `hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300 text-brand-700 dark:text-brand-300 border-gray-200 dark:border-gray-700`
                      }`}
                    >
                      {t("Filters.Presets.r_200_400")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("400-600")}
                      aria-pressed={draftMinPrice === "400000" && draftMaxPrice === "600000"}
                      className={`min-h-[44px] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        draftMinPrice === "400000" && draftMaxPrice === "600000"
                          ? `border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500`
                          : `hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300 text-brand-700 dark:text-brand-300 border-gray-200 dark:border-gray-700`
                      }`}
                    >
                      {t("Filters.Presets.r_400_600")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("600p")}
                      aria-pressed={draftMinPrice === "600000" && draftMaxPrice === ""}
                      className={`min-h-[44px] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        draftMinPrice === "600000" && draftMaxPrice === ""
                          ? `border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500`
                          : `hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300 text-brand-700 dark:text-brand-300 border-gray-200 dark:border-gray-700`
                      }`}
                    >
                      {t("Filters.Presets.over_600k")}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      placeholder="Min $"
                      aria-label="Min $"
                      className="focus:ring-brand-400 min-h-[44px] w-1/2 rounded-lg border
                        border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2
                        focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-gray-600 dark:text-gray-400" aria-hidden="true">–</span>
                    <input
                      type="number"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      placeholder="Max $"
                      aria-label="Max $"
                      className="focus:ring-brand-400 min-h-[44px] w-1/2 rounded-lg border
                        border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2
                        focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div
                className="sticky bottom-0 flex items-center justify-between gap-3 border-t
                  border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm
                    font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400
                    dark:hover:text-gray-200"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true"/>
                  {t("Filters.Labels.clear_all")}
                </button>
                <button
                  type="button"
                  onClick={applyModalFilters}
                  className="bg-brand-600 hover:bg-brand-700 inline-flex min-h-[44px] w-full flex-1
                    cursor-pointer items-center justify-center gap-1.5 rounded-lg px-6 py-2.5 text-sm
                    font-semibold text-white transition-colors duration-200"
                >
                  <Check className="h-4 w-4" aria-hidden="true"/>
                  {t("Filters.Labels.apply")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Area */}
      <section
        aria-labelledby="listings-results-heading"
        className="border-y border-gray-100 bg-gray-50 py-12 md:py-20 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="listings-results-heading" className="sr-only">
            {t("Hero.title")}
          </h2>
          {!isLoading && (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              {t.rich("Results.showing", {
                shown: filteredProperties.length,
                total: initialProperties.length,
                b: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>
          )}

          {isLoading ? (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
              aria-busy="true"
              aria-live="polite"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i}/>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filteredProperties.map((property) => {
                const type = property.type || "apartment";
                const isHouse = type === "house";
                const saleType = property.sale_type || t("Filters.for_sale");
                const price = property.price || 0;
                const title = property.title || t("Fallback.property");
                const city = property.city || t("Fallback.city");

                return (
                  <article
                    key={property.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-100
                      bg-white shadow-sm transition-all duration-200
                      motion-safe:hover:-translate-y-0.5 hover:shadow-xl dark:border-gray-600
                      dark:bg-gray-700/40"
                  >
                    <div className="relative h-52 w-full flex-shrink-0 md:h-56">
                      <Image
                        src={property.card_image || "/img/placeholder_2.webp"}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <span
                        className="bg-brand-100 text-brand-800 dark:bg-brand-900/40
                          dark:text-brand-300 absolute top-3 left-3 flex max-w-[45%] items-center
                          gap-1 truncate rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm"
                      >
                        {isHouse ? (
                          <HomeIcon className="h-3 w-3 shrink-0" aria-hidden="true"/>
                        ) : (
                          <Building2 className="h-3 w-3 shrink-0" aria-hidden="true"/>
                        )}
                        <span className="truncate">
                          {isHouse ? t("Card.house") : t("Card.apartment")}
                        </span>
                      </span>

                      <span
                        className="bg-brand-600 absolute top-3 right-3 max-w-[50%] truncate
                          rounded-full px-3 py-1 text-sm font-bold text-white shadow"
                      >
                        ${price.toLocaleString()}
                      </span>

                      <span
                        className="absolute right-3 bottom-3 max-w-[60%] truncate rounded-full
                          bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm"
                      >
                        {saleType}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-1 line-clamp-2 text-lg leading-snug font-bold text-gray-900 dark:text-white">
                        {title}
                      </h3>
                      <p className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
                        <span className="truncate">
                          {property.neighborhood ? `${property.neighborhood}, ` : ""}
                          {city}
                        </span>
                      </p>

                      <div className="mt-auto mb-5 grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <DoorOpen
                            className="text-brand-500 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {property.rooms || 0}{" "}
                            {(property.rooms || 0) === 1 ? t("Card.room") : t("Card.rooms")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <Bed className="text-brand-500 h-4 w-4 shrink-0" aria-hidden="true"/>
                          <span>
                            {property.bedrooms || 0}{" "}
                            {(property.bedrooms || 0) === 1 ? t("Card.bed") : t("Card.beds")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <SquareDashed
                            className="text-brand-500 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{(property.sqmt || 0).toLocaleString()} m²</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/properties/details/${property.id}`}
                          aria-label={`${t("Card.btn")}: ${title}`}
                          className="bg-brand-600 hover:bg-brand-700 inline-flex min-h-[44px] flex-1
                            items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm
                            font-semibold text-white transition-colors duration-200"
                        >
                          {t("Card.btn")}
                        </Link>
                        <a
                          href={`${CONTACT_INFO.whatsapp.href}&text=${encodeURIComponent(
                            t("Card.whatsapp_prefill", { title, price })
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${t("Card.enquire")}: ${title}`}
                          className="border-brand-600 text-brand-700 hover:bg-brand-50
                            dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-900/30
                            inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5
                            rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold
                            transition-colors duration-200 dark:bg-transparent"
                        >
                          <Image
                            src="/img/Logos/si-whatsapp.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                          {t("Card.enquire")}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <SearchX
                className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                {t("Results.no_results_title")}
              </h3>
              <p className="mx-auto mb-6 max-w-md text-base text-gray-600 dark:text-gray-300">
                {t("Results.no_results_text")}
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="bg-brand-600 hover:bg-brand-700 inline-flex min-h-[44px] w-full
                    cursor-pointer items-center justify-center rounded-lg px-6 py-2.5 text-sm
                    font-semibold text-white transition-colors duration-200 sm:w-auto"
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true"/>
                  {t("Results.clear_all_filters")}
                </button>
                <a
                  href={`${CONTACT_INFO.whatsapp.href}&text=${encodeURIComponent(
                    t("ContactBanner.whatsapp_prefill")
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-brand-600 text-brand-700 hover:bg-brand-50
                    dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-900/30
                    inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg
                    border bg-white px-6 py-2.5 text-sm font-semibold transition-colors
                    duration-200 sm:w-auto dark:bg-transparent"
                >
                  <Image
                    src="/img/Logos/si-whatsapp.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  {t("ContactBanner.btn")}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section
        aria-labelledby="listings-why-heading"
        className="bg-white py-12 md:py-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <h2
              id="listings-why-heading"
              className="text-h2 font-bold text-balance text-gray-900 dark:text-white"
            >
              {t("WhyUs.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("WhyUs.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {[
              {
                icon: Star,
                title: t("WhyUs.rated_title"),
                hasStar: true,
                desc: t("WhyUs.rated_desc"),
              },
              {
                icon: ShieldCheck,
                title: t("WhyUs.trust_title"),
                hasStar: false,
                desc: t("WhyUs.trust_desc"),
              },
              {
                icon: MapPin,
                title: t("WhyUs.expertise_title"),
                hasStar: false,
                desc: t("WhyUs.expertise_desc"),
              },
              {
                icon: MessageCircle,
                title: t("WhyUs.support_title"),
                hasStar: false,
                desc: t("WhyUs.support_desc"),
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm
                    transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg
                    dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl
                      bg-brand-50 dark:bg-brand-900/40"
                  >
                    <Icon
                      className="h-6 w-6 text-brand-700 dark:text-brand-300"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    {item.title}
                    {item.hasStar && (
                      <Star
                        className="ml-1 inline-block h-4 w-4 align-text-bottom text-brand-700
                          dark:text-brand-300"
                        aria-hidden="true"
                      />
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA Section */}
      <section
        aria-labelledby="listings-cta-heading"
        className="bg-white pb-12 md:pb-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-brand-700 bg-brand-800
              px-6 py-10 shadow-xl sm:px-10 md:p-14"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"/>
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_auto]">
              <div>
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/25
                    bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase"
                >
                  QMAX Realty
                </span>
                <h2
                  id="listings-cta-heading"
                  className="mt-4 text-h2 font-bold text-balance text-white"
                >
                  {t("ContactBanner.title")}
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-brand-50/85 md:text-lg">
                  {t("ContactBanner.description")}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                <a
                  href={`${CONTACT_INFO.whatsapp.href}&text=${encodeURIComponent(
                    t("ContactBanner.whatsapp_prefill")
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-600 hover:bg-brand-700 inline-flex min-h-[44px] w-full
                    items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold
                    text-white transition-colors duration-200 sm:w-auto lg:w-full"
                >
                  <Image
                    src="/img/Logos/si-whatsapp-w.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                  {t("ContactBanner.btn")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
