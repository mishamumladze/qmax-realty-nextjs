"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Bed, Bath, Square, ArrowRight, Pause, Play } from "lucide-react";
import { Property } from "@/types/property";
import { useTranslations } from "next-intl";
import { CarouselCardSkeleton } from "@/components/ui/Skeleton";
import { useHapticAndVisualFeedback } from "@/components/ui/HapticFeedback";

interface PropertiesCarouselProps {
  properties: Property[];
  isLoading?: boolean;
}

export default function PropertiesCarousel({
  properties,
  isLoading = false,
}: PropertiesCarouselProps) {
  const t = useTranslations("Components.PCarousel");
  const tHome = useTranslations("Pages.HomePage");
  // Ensure exactly 6 properties are selected for the homepage carousel
  const homepageProperties = properties.slice(0, 6);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Determine initial count lazily during initialization
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") return 1;
    const width = window.innerWidth;
    if (width >= 1024) return 3;
    if (width >= 640) return 2;
    return 1;
  });

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { trigger: triggerHaptic } = useHapticAndVisualFeedback();

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

  useEffect(() => {
    if (total <= visibleCount) return;

    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
        }
      }, 5000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startInterval();

    return () => {
      stopInterval();
    };
  }, [total, visibleCount, isPaused, maxIndex]);

  if (!homepageProperties || homepageProperties.length === 0) {
    if (isLoading) {
      return (
        <section
          aria-labelledby="most-viewed-heading"
          className="bg-white py-12 md:py-20 dark:bg-gray-900"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
              <h2
                id="most-viewed-heading"
                className="text-h2 font-bold text-balance text-gray-900 dark:text-white"
              >
                {t("title")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
                {t("subtitle")}
              </p>
            </div>
            <div className="relative mx-auto max-w-5xl" aria-busy="true" aria-live="polite">
              <div className="flex gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CarouselCardSkeleton key={i}/>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section
        aria-labelledby="most-viewed-heading"
        className="bg-white py-12 md:py-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <h2
              id="most-viewed-heading"
              className="text-h2 font-bold text-balance text-gray-900 dark:text-white"
            >
              {t("title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("subtitle")}
            </p>
          </div>
          <div
            className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-8 text-center
              shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("subtitle")}
            </p>
            <Link
              href="/listings"
              className="text-brand-700 dark:text-brand-300 mt-4 inline-flex min-h-[44px]
                items-center font-semibold hover:underline"
            >
              <span>{tHome("ContactBanner.view_all_btn")}</span>
              <ArrowRight
                className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const translateX = currentIndex * (100 / visibleCount);

  return (
    <section
      aria-labelledby="most-viewed-heading"
      className="bg-white py-12 md:py-20 dark:bg-gray-900"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <h2
            id="most-viewed-heading"
            className="text-h2 font-bold text-balance text-gray-900 dark:text-white"
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <button
            onClick={() => {
              triggerHaptic();
              handlePrev();
            }}
            aria-label={t("Aria.previous")}
            className="hover:text-brand-600 hover:border-brand-400 absolute top-1/2 left-0 z-10 hidden
              h-12 min-h-11 w-12 min-w-11 -translate-x-4 -translate-y-1/2 cursor-pointer items-center
              justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md
              transition-all duration-200 motion-safe:transition-transform md:flex md:-translate-x-6
              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true"/>
          </button>

        <div
          className="overflow-hidden max-sm:px-[calc(10vw-1rem)]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div
            className="flex gap-4 motion-safe:transition-transform motion-safe:duration-500
              motion-safe:ease-in-out will-change-transform md:gap-6"
            style={{
              transform: `translateX(-${translateX}%)`,
            }}
          >
            {homepageProperties.map((p) => {
              const bedrooms = p.bedrooms ?? 0;
              const bathrooms = p.bathrooms ?? 0;
              const sqmt = p.sqmt ?? 0;
              const price = p.price ?? 0;
              const title = p.title || t("Fallback.property");

              return (
                <article
                  key={p.id}
                  className="properties-carousel-card flex w-[80vw] flex-none flex-col
                    overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm
                    transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-xl
                    sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] dark:border-gray-700
                    dark:bg-gray-800 dark:text-white"
                >
                  <div className="relative h-52 w-full md:h-56">
                    <Image
                      src={p.card_image || "/img/placeholder.webp"}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 31vw"
                      loading="lazy"
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
                        className="text-brand-700 dark:text-brand-300 ml-2 text-sm font-bold
                          whitespace-nowrap md:text-base"
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
                        <Bed className="h-4 w-4" aria-hidden="true"/> {bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" aria-hidden="true"/> {bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Square className="h-4 w-4" aria-hidden="true"/> {sqmt} m²
                      </span>
                    </div>

                    <Link
                      href={`/properties/details/${p.id}`}
                      className="group text-brand-700 hover:text-brand-800 dark:text-brand-300 mt-auto
                        inline-flex min-h-[44px] items-center font-semibold transition-all
                        duration-300"
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
          onClick={() => {
            triggerHaptic();
            handleNext();
          }}
          aria-label={t("Aria.next")}
          className="hover:text-brand-600 hover:border-brand-400 absolute top-1/2 right-0 z-10 hidden
            h-12 min-h-11 w-12 min-w-11 translate-x-4 -translate-y-1/2 cursor-pointer items-center
            justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md
            transition-all duration-200 motion-safe:transition-transform md:flex md:translate-x-6
            dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true"/>
        </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={t("Aria.go_to_slide", { n: i + 1 })}
                className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-full
                transition-colors duration-200 ${
                  i === currentIndex
                    ? "bg-brand-500/15 dark:bg-brand-500/20"
                    : "bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
                    i === currentIndex ? "bg-brand-500" : "bg-gray-400 dark:bg-gray-600"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsPaused((prev) => !prev);
              }}
              aria-pressed={isPaused}
              aria-label={isPaused ? "Play autoplay" : "Pause autoplay"}
              className="flex min-h-[44px] min-w-11 items-center justify-center rounded-full
                text-gray-600 transition-colors duration-200 hover:bg-gray-200
                dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {isPaused ? (
                <Play className="h-5 w-5" aria-hidden="true"/>
              ) : (
                <Pause className="h-5 w-5" aria-hidden="true"/>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
