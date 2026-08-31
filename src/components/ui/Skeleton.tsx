"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width = "100%",
  height = "1rem",
  animation = "pulse",
}: SkeletonProps) {
  const baseStyles = `
    bg-gray-200 dark:bg-gray-700
    ${animation === "pulse" ? "animate-pulse" : ""}
    ${animation === "wave" ? "animate-[shimmer_1.5s_infinite]" : ""}
    rounded-${variant === "circular" ? "full" : variant === "text" ? "none" : "lg"}
  `;

  return (
    <div className={`${baseStyles} ${className}`} style={{ width, height }} aria-hidden="true" />
  );
}

export function PropertyCardSkeleton() {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800"
    >
      <Skeleton className="h-48 w-full" variant="rectangular" />
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
        <Skeleton className="mt-auto h-10 w-full" variant="rectangular" />
        <Skeleton className="h-10 w-full" variant="rectangular" />
      </div>
    </article>
  );
}

export function GallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" variant="rectangular" />
      ))}
    </div>
  );
}

export function CarouselCardSkeleton() {
  return (
    <article
      className="properties-carousel-card flex w-[80vw] flex-none flex-col overflow-hidden
        rounded-xl bg-white shadow-lg sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]
        dark:bg-gray-800"
    >
      <Skeleton className="h-40 w-full md:h-48" variant="rectangular" />
      <div className="flex flex-1 flex-col space-y-4 p-4 md:p-6">
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex gap-4 text-xs">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
        <Skeleton className="mt-auto h-10 w-full" variant="rectangular" />
      </div>
    </article>
  );
}
