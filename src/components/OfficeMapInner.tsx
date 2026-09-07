"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { CONTACT_INFO, OFFICE_LOCATION } from "@/config/contact";
import { getMapStyle } from "@/config/maps";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useMounted } from "@/hooks/useMounted";
import VectorBasemap from "./VectorBasemap";

interface OfficeMapInnerProps {
  title?: string;
}

const OFFICE_CENTER: [number, number] = [OFFICE_LOCATION.lat, OFFICE_LOCATION.lng];

export default function OfficeMapInner({ title }: OfficeMapInnerProps): React.ReactElement {
  const mounted = useMounted();
  const dark = useDarkMode();
  const t = useTranslations("Components.Footer");
  const style = getMapStyle(dark);

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "office-marker-icon",
        html: `<div class="map-pin">
          <div class="map-pin-pulse"></div>
          <div class="map-pin-body">
            <div class="map-pin-dot"></div>
          </div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 34],
        popupAnchor: [0, -32],
      }),
    []
  );

  if (!mounted) {
    return (
      <div
        className="h-80 w-full animate-pulse rounded-2xl bg-gray-100 ring-1 ring-gray-200
          dark:bg-gray-800 dark:ring-gray-700"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-200
        dark:ring-gray-700"
    >
      <MapContainer
        center={OFFICE_CENTER}
        zoom={OFFICE_LOCATION.zoom}
        minZoom={12}
        maxZoom={19}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-80 w-full"
        aria-label={title}
      >
        <VectorBasemap styleUrl={style.url} attribution={style.attribution} />
        <ZoomControl position="bottomright" />
        <Marker position={OFFICE_CENTER} icon={markerIcon}>
          <Popup className="office-map-popup">
            <strong>{CONTACT_INFO.address.display}</strong>
            <br />
            <a href={CONTACT_INFO.address.href} target="_blank" rel="noopener noreferrer">
              {t("map_directions")}
            </a>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating address card */}
      <div className="pointer-events-none absolute top-3 left-3 max-w-[calc(100%-1.5rem)]">
        <div
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/40
            bg-white/90 py-3 pr-4 pl-3 shadow-lg backdrop-blur-md dark:border-gray-700
            dark:bg-gray-900/90"
          aria-label={t("map_address_label")}
        >
          <span
            className="bg-brand-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              text-white shadow"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
              {CONTACT_INFO.address.display}
            </span>
            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <a
                href={CONTACT_INFO.address.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 hover:text-brand-800 dark:text-brand-300
                  dark:hover:text-brand-200 text-xs font-semibold"
              >
                {t("map_directions")}
              </a>
              <a
                href={CONTACT_INFO.address.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200"
              >
                {t("map_view_larger")}
              </a>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
