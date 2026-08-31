"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface PropertyGalleryProps {
  images: string[];
  propertyTitle: string;
}

export default function PropertyGallery({ images, propertyTitle }: PropertyGalleryProps) {
  const t = useTranslations("Components.PropertyGallery");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastFocusedThumbnail = useRef<HTMLButtonElement | null>(null);

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
    // Restore focus to the thumbnail that opened the lightbox
    setTimeout(() => {
      lastFocusedThumbnail.current?.focus();
    }, 0);
  }, []);

  // Focus trap + initial focus + escape key
  useEffect(() => {
    if (selectedIndex === null || !lightboxRef.current) return;

    const lightbox = lightboxRef.current;
    const getFocusable = () =>
      lightbox.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );

    // Focus first focusable element (close button)
    const timer = setTimeout(() => {
      const focusable = getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
        return;
      }

      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      // Arrow key navigation
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((selectedIndex + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
      }
    };

    lightbox.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      lightbox.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, images.length, closeLightbox]);

return (
    <>
      <div>
        <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">{t("title")}</h2>

        {images.length === 0 ? (
          <div className="aspect-square flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">{t("empty_gallery")}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  ref={(el) => {
                    thumbnailRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    lastFocusedThumbnail.current = thumbnailRefs.current[idx] ?? null;
                    setSelectedIndex(idx);
                  }}
                  className="group relative aspect-square overflow-hidden rounded-xl border
                    border-gray-200 transition-all hover:border-gray-400 dark:border-gray-700
                    dark:hover:border-gray-600 focus-visible:outline-2 focus-visible:outline-brand-500
                    focus-visible:outline-offset-2"
                >
                  <Image
                    src={img}
                    alt={t("photo_alt", { title: propertyTitle, n: idx + 1 })}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Modal Lightbox */}
      {selectedIndex !== null && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 dark:bg-gray-950/90 p-4"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white
              transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white
              focus-visible:outline-offset-2"
            aria-label={t("Aria.close")}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Main Image */}
          <div className="relative h-full max-h-[90vh] w-full max-w-4xl">
            <Image
              src={images[selectedIndex]}
              alt={t("photo_alt", { title: propertyTitle, n: selectedIndex + 1 })}
              fill
              className="object-contain"
            />
          </div>

          {/* Navigation */}
          <button
            onClick={() => setSelectedIndex((selectedIndex - 1 + images.length) % images.length)}
            className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/20 p-3
              text-white transition-colors hover:bg-white/30 focus-visible:outline-2
              focus-visible:outline-white focus-visible:outline-offset-2"
            aria-label={t("Aria.previous")}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/20 p-3
              text-white transition-colors hover:bg-white/30 focus-visible:outline-2
              focus-visible:outline-white focus-visible:outline-offset-2"
            aria-label={t("Aria.next")}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4
              py-2 text-sm text-white"
            aria-live="polite"
            aria-atomic="true"
          >
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
