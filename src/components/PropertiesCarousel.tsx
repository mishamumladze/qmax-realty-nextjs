"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Bed, Bath, Square, ArrowRight } from "lucide-react";
import { Property } from "@/types/property";
import { useTranslations } from "next-intl";

interface PropertiesCarouselProps {
  properties: Property[];
}

export default function PropertiesCarousel({ properties }: PropertiesCarouselProps) {
  const t = useTranslations("Components.PCarousel");
  // Ensure exactly 6 properties are selected for the homepage carousel
  const homepageProperties = properties.slice(0, 6);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const total = homepageProperties.length;

  const updateVisibleCount = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1024) {
      setVisibleCount(3);
    } else if (width >= 640) {
      setVisibleCount(2);
    } else {
      setVisibleCount(1);
    }
  }, []);

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [updateVisibleCount]);

  const maxIndex = Math.max(0, total - visibleCount);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  if (!homepageProperties || homepageProperties.length === 0) {
    return null;
  }

  const translateX = currentIndex * (100 / visibleCount);

  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="most-viewed-heading">
      <div className="mb-8 text-center md:mb-12">
        <h2
          id="most-viewed-heading"
          className="text-brand-600 mb-4 text-2xl font-bold md:text-3xl lg:text-4xl"
        >
          {t("title")}
        </h2>
        <p className="mx-auto max-w-2xl text-base text-gray-600 md:text-lg">{t("description")}</p>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <button
          onClick={handlePrev}
          aria-label="Previous properties"
          className="hover:text-brand-600 hover:border-brand-400 absolute top-1/2 left-0 z-10 flex
            h-12 w-12 -translate-x-4 -translate-y-1/2 cursor-pointer items-center justify-center
            rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition-all
            duration-200 md:-translate-x-6"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div
          className="overflow-hidden max-sm:px-[calc(10vw-1rem)]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex gap-4 transition-transform duration-500 ease-in-out
              will-change-transform md:gap-6"
            style={{
              transform: `translateX(-${translateX}%)`,
            }}
          >
            {homepageProperties.map((p, index) => {
              const bedrooms = p.bedrooms ?? 0;
              const bathrooms = p.bathrooms ?? 0;
              const sqmt = p.sqmt ?? 0;
              const price = p.price ?? 0;
              const title = p.title || "Property";

              return (
                <article
                  key={p.id}
                  className="properties-carousel-card flex w-[80vw] flex-none flex-col
                    overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300
                    hover:shadow-xl sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] dark:bg-gray-800
                    dark:text-white"
                >
                  <div className="relative h-40 w-full md:h-48">
                    <Image
                      src={p.card_image || "/img/placeholder.webp"}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 31vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-4 md:p-6">
                    <div className="mb-2 flex items-start justify-between">
                      <h3
                        className="line-clamp-1 text-lg font-bold text-gray-800 md:text-xl
                          dark:text-white"
                      >
                        {title}
                      </h3>
                      <span
                        className="text-brand-700 ml-2 text-sm font-bold whitespace-nowrap
                          md:text-base"
                      >
                        ${price.toLocaleString()}
                      </span>
                    </div>

                    <p
                      className="mb-3 line-clamp-1 text-sm text-gray-600 md:mb-4 md:text-base
                        dark:text-gray-300"
                    >
                      {p.location || p.city || "Georgia"}
                    </p>

                    <div
                      className="mb-3 flex gap-4 text-xs text-gray-500 md:text-sm
                        dark:text-gray-400"
                    >
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4" /> {bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" /> {bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Square className="h-4 w-4" /> {sqmt} m²
                      </span>
                    </div>

                    <Link
                      href={`/properties/details/${p.id}`}
                      className="group text-brand-700 hover:text-brand-800 mt-auto inline-flex
                        items-center font-semibold transition-all duration-300"
                    >
                      <span>{t("details")}</span>
                      <ArrowRight
                        className="ml-1 h-4 w-4 transition-transform duration-300
                          group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleNext}
          aria-label="Next properties"
          className="hover:text-brand-600 hover:border-brand-400 absolute top-1/2 right-0 z-10 flex
            h-12 w-12 translate-x-4 -translate-y-1/2 cursor-pointer items-center justify-center
            rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition-all
            duration-200 md:translate-x-6"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                i === currentIndex ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
