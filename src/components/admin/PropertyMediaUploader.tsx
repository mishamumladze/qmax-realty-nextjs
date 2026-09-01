"use client";

import { useState, useCallback, useRef } from "react";
import type { ReactElement } from "react";
import { Star, Ruler, Trash2, Plus, GripVertical } from "lucide-react";

export interface MediaImage {
  id: string;
  url: string;
  isCover: boolean;
  isFloorPlan: boolean;
}

export interface PropertyMediaUploaderProps {
  images: MediaImage[];
  onChange: (images: MediaImage[]) => void;
  maxImages?: number;
  maxSizeMb?: number;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? String(Date.now() + Math.random());
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read file."));
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

const dropZoneClass =
  "relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors hover:border-brand-500";
const dropZoneActiveClass = "border-brand-500 bg-brand-50 dark:bg-brand-900/20";
const previewGridClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";
const previewCardClass =
  "relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800";
const badgeClass = "absolute top-1.5 z-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm p-1.5 text-brand-600 dark:text-brand-400 hover:scale-110 transition-transform";
const deleteButtonClass =
  "absolute top-1.5 right-1.5 z-10 rounded-full bg-red-600/90 dark:bg-red-500/90 backdrop-blur-sm shadow-sm p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110";
const dragHandleClass =
  "absolute bottom-1.5 left-1.5 z-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing";
const emptyStateClass = "col-span-full flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400";
const errorTextClass = "mt-2 text-sm text-red-600 dark:text-red-400";

export function PropertyMediaUploader({
  images,
  onChange,
  maxImages = 20,
  maxSizeMb = 5,
}: PropertyMediaUploaderProps): ReactElement {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      await processFiles(files);
    },
    [images, onChange, maxImages, maxSizeMb]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      await processFiles(files);
      e.target.value = "";
    },
    [images, onChange, maxImages, maxSizeMb]
  );

  const processFiles = async (files: File[]) => {
    setError(null);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return false;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSizeMb}MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (images.length + validFiles.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const newImages: MediaImage[] = [];
    for (const file of validFiles) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newImages.push({
          id: generateId(),
          url: dataUrl,
          isCover: images.length === 0 && newImages.length === 0,
          isFloorPlan: false,
        });
      } catch {
        setError("Failed to read one or more files.");
        return;
      }
    }

    onChange([...images, ...newImages]);
  };

  const handleRemove = useCallback(
    (id: string) => {
      const next = images.filter((img) => img.id !== id);
      const hasCover = next.some((img) => img.isCover);
      if (!hasCover && next.length > 0) {
        next[0].isCover = true;
      }
      onChange(next);
    },
    [images, onChange]
  );

  const handleSetCover = useCallback(
    (id: string) => {
      const next = images.map((img) => ({ ...img, isCover: img.id === id }));
      onChange(next);
    },
    [images, onChange]
  );

  const handleToggleFloorPlan = useCallback(
    (id: string) => {
      const next = images.map((img) =>
        img.id === id ? { ...img, isFloorPlan: !img.isFloorPlan } : { ...img, isFloorPlan: false }
      );
      onChange(next);
    },
    [images, onChange]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOverCard = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    []
  );

  const handleDropCard = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === targetIndex) {
        setDraggedIndex(null);
        return;
      }

      const next = [...images];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, removed);
      onChange(next);
      setDraggedIndex(null);
    },
    [images, onChange, draggedIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const totalSize = images.reduce((sum, img) => sum + (img.url.startsWith("data:") ? img.url.length : 0), 0);
  const isAtMax = images.length >= maxImages;

  return (
    <div className="space-y-4">
      <div
        className={`${dropZoneClass} ${dragActive ? dropZoneActiveClass : ""} ${isAtMax ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
        aria-label="Upload images"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileSelect}
          disabled={isAtMax}
        />
        <Plus className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {isAtMax ? `Maximum ${maxImages} images reached` : "Drag and drop images here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {isAtMax ? "" : `PNG, JPG, WebP up to ${maxSizeMb}MB each`}
        </p>
      </div>

      {error && <p className={errorTextClass} role="alert">{error}</p>}

      <div className={previewGridClass} role="list" aria-label="Image previews">
        {images.length === 0 ? (
          <div className={emptyStateClass}>
            <Plus className="h-8 w-8 mb-2 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            <p className="text-sm">No images uploaded yet</p>
            <p className="text-xs">Upload or drop images to get started</p>
          </div>
        ) : (
          images.map((image, index) => (
            <div
              key={image.id}
              className={`${previewCardClass} ${draggedIndex === index ? "opacity-50 ring-2 ring-brand-500" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOverCard}
              onDrop={(e) => handleDropCard(e, index)}
              onDragEnd={handleDragEnd}
              role="listitem"
            >
              <img
                src={image.url}
                alt={`Image ${index + 1}${image.isCover ? " (cover)" : ""}${image.isFloorPlan ? " (floor plan)" : ""}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              <div className="absolute inset-0 flex flex-col items-start justify-between p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-start justify-between w-full pointer-events-auto">
                  {image.isCover ? (
                    <Star
                      className={`${badgeClass} fill-current text-yellow-500`}
                      size={14}
                      aria-label="Cover image"
                      aria-pressed="true"
                    />
                  ) : (
                    <button
                      type="button"
                      className={badgeClass}
                      onClick={() => handleSetCover(image.id)}
                      aria-label="Set as cover image"
                      aria-pressed="false"
                    >
                      <Star size={14} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${badgeClass} ${image.isFloorPlan ? "fill-current text-brand-600 dark:text-brand-400" : ""}`}
                    onClick={() => handleToggleFloorPlan(image.id)}
                    aria-label={image.isFloorPlan ? "Remove floor plan designation" : "Set as floor plan"}
                    aria-pressed={image.isFloorPlan}
                  >
                    <Ruler size={14} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-end justify-between w-full pointer-events-auto">
                  <GripVertical className={dragHandleClass} size={14} aria-label="Drag to reorder" aria-hidden="true" />
                  <button
                    type="button"
                    className={deleteButtonClass}
                    onClick={() => handleRemove(image.id)}
                    aria-label="Delete image"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {(image.isCover || image.isFloorPlan) && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-center gap-1.5 pointer-events-none">
                  {image.isCover && (
                    <span className="inline-flex items-center gap-1 rounded bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-gray-900 dark:text-gray-100">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                      Cover
                    </span>
                  )}
                  {image.isFloorPlan && (
                    <span className="inline-flex items-center gap-1 rounded bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-gray-900 dark:text-gray-100">
                      <Ruler className="h-3 w-3 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                      Floor Plan
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}