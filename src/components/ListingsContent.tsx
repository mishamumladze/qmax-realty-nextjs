"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
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

interface ListingsContentProps {
  initialProperties: Property[];
  geoCountries: string[];
  geoCities: string[];
  initialFilter?: string;
  initialOffer?: string;
}

export default function ListingsContent({
  initialProperties,
  geoCountries,
  geoCities,
  initialFilter = "all",
  initialOffer = "all",
}: ListingsContentProps) {
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
        className="from-brand-600 to-brand-700 dark:from-brand-700 dark:to-brand-800 relative
          bg-gradient-to-r py-16 text-white md:py-24"
      >
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">Properties & Listings</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg md:text-xl">
            Buy, sell, or rent properties worldwide.
          </p>
          <div className="relative mx-auto max-w-xl">
            <label htmlFor="property-search" className="sr-only">
              Search properties
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
                placeholder="Search by title, location, neighborhood…"
                autoComplete="off"
                className="focus:ring-brand-300 w-full rounded-xl bg-white/95 py-3.5 pr-4 pl-12
                  text-base text-gray-800 shadow-lg focus:ring-2 focus:outline-none dark:bg-gray-800
                  dark:text-white dark:placeholder-gray-400"
                aria-label="Search properties"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filter & Sort Bar */}
      <div
        className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700
          dark:bg-gray-900"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            {/* Type Filter Tabs */}
            <div
              className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:pb-0"
              aria-label="Filter by property type"
            >
              {[
                { key: "all", label: "All", icon: LayoutGrid },
                { key: "apartment", label: "Apartments", icon: Building2 },
                { key: "house", label: "Houses", icon: HomeIcon },
              ].map(({ key, label, icon: Icon }) => {
                const isActive = typeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTypeFilter(key)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4
                    py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? `bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500
                          text-white`
                        : `border-gray-200 bg-white text-gray-700 hover:bg-gray-50
                          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
                          dark:hover:bg-gray-700`
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
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
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                ref={filtersButtonRef}
                type="button"
                onClick={openModal}
                className="border-brand-600 text-brand-700 bg-brand-50 hover:bg-brand-100
                  dark:border-brand-500 dark:text-brand-400 dark:bg-brand-900/30
                  dark:hover:bg-brand-900/50 relative inline-flex cursor-pointer items-center
                  gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors
                  duration-200"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
                {activeModalFiltersCount > 0 && (
                  <span
                    className="bg-brand-600 absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem]
                      items-center justify-center rounded-full px-1 text-[11px] font-bold
                      text-white"
                  >
                    {activeModalFiltersCount}
                  </span>
                )}
              </button>
              <label
                htmlFor="sort-select"
                className="text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="focus:ring-brand-400 rounded-lg border border-gray-200 bg-white px-3 py-2
                  text-sm text-gray-700 focus:ring-2 focus:outline-none dark:border-gray-700
                  dark:bg-gray-800 dark:text-white"
              >
                <option value="default">Relevance</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="sqmt-asc">Size: Smallest</option>
                <option value="sqmt-desc">Size: Largest</option>
              </select>
            </div>
          </div>

          {/* Active Filters Chips */}
          {(activeModalFiltersCount > 0 || searchTerm) && (
            <div
              className="flex flex-wrap items-center gap-2 border-t border-gray-200 py-2.5
                dark:border-gray-700"
            >
              <span
                className="text-xs font-semibold tracking-wide text-gray-600 uppercase
                  dark:text-gray-400"
              >
                Active:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {searchTerm && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label="Remove search filter"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                )}
                {offerFilter !== "all" && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    For {offerFilter}
                    <button
                      onClick={() => setOfferFilter("all")}
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label="Remove offer filter"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
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
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label={`Remove ${countryFilter} filter`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
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
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label={`Remove ${cityFilter} filter`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                )}
                {bedroomsFilter > 0 && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {bedroomsFilter}+ Beds
                    <button
                      onClick={() => setBedroomsFilter(0)}
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label="Remove bedrooms filter"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                )}
                {bathroomsFilter > 0 && (
                  <span
                    className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                      border-brand-200 dark:border-brand-800 inline-flex items-center gap-1
                      rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {bathroomsFilter}+ Baths
                    <button
                      onClick={() => setBathroomsFilter(0)}
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label="Remove bathrooms filter"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
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
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                      aria-label="Remove price filter"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-brand-700 dark:text-brand-400 cursor-pointer text-xs font-medium
                  hover:underline"
              >
                Clear all
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
          aria-label="Filter properties"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={closeModal} />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <div
              ref={modalRef}
              tabIndex={-1}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl
                outline-none dark:bg-gray-900"
            >
              <div
                className="flex items-center justify-between border-b border-gray-200 px-6 py-4
                  dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="text-brand-600 h-5 w-5" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Filter Properties
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center
                    justify-center rounded-lg p-2 text-gray-600 hover:text-gray-800
                    dark:hover:text-gray-200"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
                {/* Offer Pill Selection */}
                <div>
                  <span
                    className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                      uppercase dark:text-gray-400"
                  >
                    <Tag className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top" />
                    Availability
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All", icon: LayoutGrid },
                      { key: "sale", label: "For Sale", icon: Tag },
                      { key: "rent", label: "For Rent", icon: Check },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraftOffer(key)}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full
                        border px-4 py-2 text-sm font-medium transition-all ${
                          draftOffer === key
                            ? `bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500
                              text-white`
                            : `border-gray-200 bg-white text-gray-600 hover:bg-gray-50
                              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                              dark:hover:bg-gray-700`
                        }`}
                      >
                        <Icon className="h-4 w-4" />
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
                    Property Type
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All", icon: LayoutGrid },
                      { key: "apartment", label: "Apartments", icon: Building2 },
                      { key: "house", label: "Houses", icon: HomeIcon },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraftType(key)}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full
                        border px-4 py-2 text-sm font-medium transition-all ${
                          draftType === key
                            ? `bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500
                              text-white`
                            : `border-gray-200 bg-white text-gray-600 hover:bg-gray-50
                              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                              dark:hover:bg-gray-700`
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country & City */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <Globe className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top" />
                      Country
                    </label>
                    <select
                      value={draftCountry}
                      onChange={(e) => setDraftCountry(e.target.value)}
                      className="focus:ring-brand-400 w-full rounded-lg border border-gray-200
                        bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:outline-none
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All countries</option>
                      {geoCountries.map((gc) => (
                        <option key={gc} value={gc}>
                          {gc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <MapPin
                        className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                      />
                      City
                    </label>
                    <select
                      value={draftCity}
                      onChange={(e) => setDraftCity(e.target.value)}
                      className="focus:ring-brand-400 w-full rounded-lg border border-gray-200
                        bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:outline-none
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All cities</option>
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
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <BedDouble
                        className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top"
                      />
                      Bedrooms
                    </label>
                    <select
                      value={draftBedrooms}
                      onChange={(e) => setDraftBedrooms(Number(e.target.value))}
                      className="focus:ring-brand-400 w-full rounded-lg border border-gray-200
                        bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:outline-none
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value={0}>Any</option>
                      <option value={1}>1+</option>
                      <option value={2}>2+</option>
                      <option value={3}>3+</option>
                      <option value={4}>4+</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold tracking-wide text-gray-600
                        uppercase dark:text-gray-400"
                    >
                      <Bath className="text-brand-500 mr-1 inline-block h-3.5 w-3.5 align-text-top" />
                      Bathrooms
                    </label>
                    <select
                      value={draftBathrooms}
                      onChange={(e) => setDraftBathrooms(Number(e.target.value))}
                      className="focus:ring-brand-400 w-full rounded-lg border border-gray-200
                        bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:outline-none
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value={0}>Any</option>
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
                    Price Range (USD)
                  </span>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("u200")}
                      className="hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300
                        text-brand-700 dark:text-brand-400 rounded-full border border-gray-200 px-3
                        py-1.5 text-xs font-semibold transition-colors dark:border-gray-700"
                    >
                      Under $200k
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("200-400")}
                      className="hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300
                        text-brand-700 dark:text-brand-400 rounded-full border border-gray-200 px-3
                        py-1.5 text-xs font-semibold transition-colors dark:border-gray-700"
                    >
                      $200k – $400k
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("400-600")}
                      className="hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300
                        text-brand-700 dark:text-brand-400 rounded-full border border-gray-200 px-3
                        py-1.5 text-xs font-semibold transition-colors dark:border-gray-700"
                    >
                      $400k – $600k
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("600p")}
                      className="hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300
                        text-brand-700 dark:text-brand-400 rounded-full border border-gray-200 px-3
                        py-1.5 text-xs font-semibold transition-colors dark:border-gray-700"
                    >
                      Over $600k
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      placeholder="Min $"
                      className="focus:ring-brand-400 w-1/2 rounded-lg border border-gray-200
                        bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:outline-none
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-gray-600">–</span>
                    <input
                      type="number"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      placeholder="Max $"
                      className="focus:ring-brand-400 w-1/2 rounded-lg border border-gray-200
                        bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:outline-none
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-3 border-t border-gray-200
                  bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium
                    text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={applyModalFilters}
                  className="bg-brand-600 hover:bg-brand-700 inline-flex flex-1 cursor-pointer
                    items-center justify-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold
                    text-white transition-colors duration-200"
                >
                  <Check className="h-4 w-4" />
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Area */}
      <div className="bg-gray-50 py-10 md:py-14 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
            Showing <span className="font-semibold">{filteredProperties.length}</span> of{" "}
            {initialProperties.length} properties
          </p>

          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => {
                const type = property.type || "apartment";
                const isHouse = type === "house";
                const saleType = property.sale_type || "For Sale";
                const price = property.price || 0;
                const title = property.title || "Property";
                const city = property.city || "Tbilisi";

                return (
                  <article
                    key={property.id}
                    className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md
                      transition-shadow duration-300 hover:shadow-xl dark:bg-gray-800"
                  >
                    <div className="relative h-48 w-full flex-shrink-0">
                      <Image
                        src={property.card_image || "/img/placeholder_2.webp"}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <span
                        className={`absolute top-3 left-3 flex items-center gap-1 rounded-full
                          px-2.5 py-1 text-xs font-semibold shadow-sm ${
                            isHouse
                              ? `bg-brand-100 text-brand-800 dark:bg-brand-900/40
                                dark:text-brand-300`
                              : `bg-brand-100 text-brand-800 dark:bg-brand-900/40
                                dark:text-brand-300`
                          }`}
                      >
                        {isHouse ? (
                          <HomeIcon className="h-3 w-3" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        {isHouse ? "House" : "Apartment"}
                      </span>

                      <span
                        className="bg-brand-600 absolute top-3 right-3 rounded-full px-3 py-1
                          text-sm font-bold text-white shadow"
                      >
                        ${price.toLocaleString()}
                      </span>

                      <span
                        className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1
                          text-xs text-white backdrop-blur-sm"
                      >
                        {saleType}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3
                        className="mb-1 text-lg leading-snug font-bold text-gray-800
                          dark:text-white"
                      >
                        {title}
                      </h3>
                      <p
                        className="mb-4 flex items-center gap-1 text-sm text-gray-500
                          dark:text-gray-400"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {property.neighborhood ? `${property.neighborhood}, ` : ""}
                        {city}
                      </p>

                      <div
                        className="mt-auto mb-5 grid grid-cols-3 gap-2 text-sm text-gray-600
                          dark:text-gray-300"
                      >
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <DoorOpen className="text-brand-500 h-4 w-4 shrink-0" />
                          <span>
                            {property.rooms || 0} {(property.rooms || 0) === 1 ? "Room" : "Rooms"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <Bed className="text-brand-500 h-4 w-4 shrink-0" />
                          <span>
                            {property.bedrooms || 0}{" "}
                            {(property.bedrooms || 0) === 1 ? "Bed" : "Beds"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <SquareDashed className="text-brand-500 h-4 w-4 shrink-0" />
                          <span>{(property.sqmt || 0).toLocaleString()} m²</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/properties/details/${property.id}`}
                          className="bg-brand-600 hover:bg-brand-700 flex-1 rounded-lg px-4 py-2.5
                            text-center text-sm font-semibold text-white transition-colors
                            duration-200"
                        >
                          View Details
                        </Link>
                        <a
                          href={`${CONTACT_INFO.whatsapp.href}&text=Hi!%20I'm%20interested%20in%20${encodeURIComponent(
                            title
                          )}%20listed%20at%20$${price}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand-600 hover:bg-brand-700 flex items-center
                            justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold
                            text-white transition-colors duration-200"
                        >
                          <Image
                            src="/img/Logos/si-whatsapp-w.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                          Enquire
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <SearchX className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mb-2 text-xl font-semibold text-gray-500 dark:text-gray-400">
                No properties found
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Try a different search term or clear your filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-brand-700 dark:text-brand-400 cursor-pointer font-semibold
                  hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section
        className="section bg-brand-300/5 dark:bg-brand-900/10"
        aria-labelledby="why-heading"
      >
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2
              id="why-heading"
              className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl dark:text-white"
            >
              Why QMAX Realty?
            </h2>
            <p className="mx-auto max-w-xl text-gray-600 dark:text-gray-400">
              Expert guidance for buying, selling, or renting properties.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              {
                icon: Star,
                title: "5 Rated",
                hasStar: true,
                desc: "Hundreds of 5-star reviews from satisfied clients.",
              },
              {
                icon: ShieldCheck,
                title: "Trusted & Transparent",
                hasStar: false,
                desc: "Clear communication and ethical practices throughout.",
              },
              {
                icon: MapPin,
                title: "Local Expertise",
                hasStar: false,
                desc: "Deep knowledge of Tbilisi neighborhoods and emerging markets.",
              },
              {
                icon: MessageCircle,
                title: "24/7 Support",
                hasStar: false,
                desc: "We're available 7 days a week via WhatsApp.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="text-center">
                  <div
                    className="bg-brand-100 dark:bg-brand-900/40 mx-auto mb-3 flex h-14 w-14
                      items-center justify-center rounded-full"
                  >
                    <Icon className="text-brand-600 dark:text-brand-400 h-7 w-7" />
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-800 dark:text-white">
                    {item.title}
                    {item.hasStar && (
                      <Star
                        className="text-brand-600 dark:text-brand-400 ml-1 inline-block h-4 w-4
                          align-text-bottom"
                      />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA Section */}
      <section className="section">
        <div className="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800">
          <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
            Looking for Something Specific?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
            Tell us what you're looking for and we'll find the perfect property for you.
          </p>
          <a
            href={`${CONTACT_INFO.whatsapp.href}&text=Hi!%20I'm%20looking%20for%20a%20property.`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center rounded-xl px-8 py-3
              font-semibold text-white transition-colors duration-200"
          >
            <Image
              src="/img/Logos/si-whatsapp-w.svg"
              alt=""
              width={20}
              height={20}
              className="mr-2"
            />
            Ask Us on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
