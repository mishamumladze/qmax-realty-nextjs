"use client";

import { useState, useMemo } from "react";
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
}

export default function ListingsContent({
  initialProperties,
  geoCountries,
  geoCities,
  initialFilter = "all",
}: ListingsContentProps) {
  // ─── Filter State ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(initialFilter);
  const [offerFilter, setOfferFilter] = useState<string>("all");
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
      <header className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Properties & Listings
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Buy, sell, or rent properties worldwide.
          </p>
          <div className="max-w-xl mx-auto relative">
            <label htmlFor="property-search" className="sr-only">
              Search properties
            </label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="property-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, location, neighborhood…"
                autoComplete="off"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-800 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white/95"
                aria-label="Search properties"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filter & Sort Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
            {/* Type Filter Tabs */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide"
              role="tablist"
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
                    className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    role="tab"
                    aria-selected={isActive}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                    <span
                      className={`ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {counts[key as keyof typeof counts] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Trigger & Sort */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={openModal}
                className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                Filters
                {activeModalFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center rounded-full">
                    {activeModalFiltersCount}
                  </span>
                )}
              </button>
              <label htmlFor="sort-select" className="text-sm text-gray-500 font-medium">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
            <div className="border-t border-gray-200 py-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Active:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {offerFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    For {offerFilter}
                    <button onClick={() => setOfferFilter("all")} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {countryFilter && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {countryFilter}
                    <button onClick={() => setCountryFilter("")} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {cityFilter && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {cityFilter}
                    <button onClick={() => setCityFilter("")} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {bedroomsFilter > 0 && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {bedroomsFilter}+ Beds
                    <button onClick={() => setBedroomsFilter(0)} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {bathroomsFilter > 0 && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {bathroomsFilter}+ Baths
                    <button onClick={() => setBathroomsFilter(0)} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    ${minPrice || "0"} - ${maxPrice || "Any"}
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer"
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
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-gray-800">Filter Properties</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Offer Pill Selection */}
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    <Tag className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
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
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-all ${
                          draftOffer === key
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type Selection */}
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    <LayoutGrid className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
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
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-all ${
                          draftType === key
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country & City */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      <Globe className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
                      Country
                    </label>
                    <select
                      value={draftCountry}
                      onChange={(e) => setDraftCountry(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      <MapPin className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
                      City
                    </label>
                    <select
                      value={draftCity}
                      onChange={(e) => setDraftCity(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      <BedDouble className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
                      Bedrooms
                    </label>
                    <select
                      value={draftBedrooms}
                      onChange={(e) => setDraftBedrooms(Number(e.target.value))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value={0}>Any</option>
                      <option value={1}>1+</option>
                      <option value={2}>2+</option>
                      <option value={3}>3+</option>
                      <option value={4}>4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      <Bath className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
                      Bathrooms
                    </label>
                    <select
                      value={draftBathrooms}
                      onChange={(e) => setDraftBathrooms(Number(e.target.value))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    <CircleDollarSign className="w-3.5 h-3.5 inline-block align-text-top mr-1 text-emerald-500" />
                    Price Range (USD)
                  </span>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("u200")}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 transition-colors"
                    >
                      Under $200k
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("200-400")}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 transition-colors"
                    >
                      $200k – $400k
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("400-600")}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 transition-colors"
                    >
                      $400k – $600k
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPrice("600p")}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 transition-colors"
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
                      className="w-1/2 text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      placeholder="Max $"
                      className="w-1/2 text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={applyModalFilters}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Area */}
      <div className="py-10 md:py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <p className="text-sm text-gray-500 mb-6" aria-live="polite">
            Showing <span className="font-semibold">{filteredProperties.length}</span> of{" "}
            {initialProperties.length} properties
          </p>

          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => {
                const type = property.type || "apartment";
                const isHouse = type === "house";
                const saleType = property.sale_type || "For Sale";
                const price = property.price || 0;
                const title = property.title || "Property";
                const city = property.city || "Tbilisi";

                return (
                  <article
                  // we will replace slug to id
                    key={property.slug}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                  >
                    <div className="relative flex-shrink-0 h-48 w-full">
                      <Image
                        src={property.card_image || "/img/placeholder.webp"}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <span
                        className={`absolute top-3 left-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
                          isHouse
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isHouse ? (
                          <HomeIcon className="w-3 h-3" />
                        ) : (
                          <Building2 className="w-3 h-3" />
                        )}
                        {isHouse ? "House" : "Apartment"}
                      </span>

                      <span className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow">
                        ${price.toLocaleString()}
                      </span>

                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {saleType}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 leading-snug">
                        {title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {property.neighborhood ? `${property.neighborhood}, ` : ""}
                        {city}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mb-5 text-sm text-gray-600 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <DoorOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>
                            {property.rooms || 0}{" "}
                            {(property.rooms || 0) === 1 ? "Room" : "Rooms"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <Bed className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>
                            {property.bedrooms || 0}{" "}
                            {(property.bedrooms || 0) === 1 ? "Bed" : "Beds"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <SquareDashed className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{(property.sqmt || 0).toLocaleString()} m²</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                        // we will replace slug to id
                          href={`/properties/details/${property.slug}`}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200"
                        >
                          View Details
                        </Link>
                        <a
                          href={`${CONTACT_INFO.whatsapp.href}&text=Hi!%20I'm%20interested%20in%20${encodeURIComponent(
                            title
                          )}%20listed%20at%20$${price}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200"
                        >
                          <Image
                            src="/img/Logos/si-whatsapp-w.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="w-4 h-4"
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
            <div className="text-center py-20">
              <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">
                No properties found
              </h3>
              <p className="text-gray-400 mb-6">
                Try a different search term or clear your filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-emerald-600 font-semibold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section className="section bg-emerald-300/5" aria-labelledby="why-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 id="why-heading" className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Why QMAX Realty?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Expert guidance for buying, selling, or renting properties.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
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
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {item.title}
                    {item.hasStar && (
                      <Star className="w-4 h-4 inline-block ml-1 text-emerald-600 align-text-bottom" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA Section */}
      <section className="section">
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Looking for Something Specific?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Tell us what you're looking for and we'll find the perfect property for you.
          </p>
          <a
            href={`${CONTACT_INFO.whatsapp.href}&text=Hi!%20I'm%20looking%20for%20a%20property.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-200"
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