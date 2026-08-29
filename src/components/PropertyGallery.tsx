"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") {
        setSelectedIndex((selectedIndex + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  return (
    <>
      <div>
        <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">{t("title")}</h2>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className="group relative aspect-square overflow-hidden rounded-xl border
                border-gray-200 transition-all hover:border-gray-400 dark:border-gray-700
                dark:hover:border-gray-600"
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
      </div>

      {/* Modal Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white
              transition-colors hover:bg-white/30"
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
              text-white transition-colors hover:bg-white/30"
            aria-label={t("Aria.previous")}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/20 p-3
              text-white transition-colors hover:bg-white/30"
            aria-label={t("Aria.next")}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4
              py-2 text-sm text-white"
          >
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
