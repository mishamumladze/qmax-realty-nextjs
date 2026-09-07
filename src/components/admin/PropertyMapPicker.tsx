"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapStyle } from "@/config/maps";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useMounted } from "@/hooks/useMounted";
import VectorBasemap from "@/components/VectorBasemap";
export interface PropertyMapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  placeholder?: string;
  showGeolocate?: boolean;
}
const DEFAULT_CENTER: [number, number] = [41.7151, 44.8271];
const DEFAULT_ZOOM = 12;

function formatCoord(value: number | null): string {
  return value !== null ? value.toFixed(6) : "";
}

function parseCoord(text: string, min: number, max: number): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
export function PropertyMapPicker({
  lat,
  lng,
  onChange,
  placeholder,
  showGeolocate = true,
}: PropertyMapPickerProps): React.ReactElement {
  const mounted = useMounted();
  const dark = useDarkMode();
  const style = getMapStyle(dark);
  const [latText, setLatText] = useState(() => formatCoord(lat));
  const [lngText, setLngText] = useState(() => formatCoord(lng));
  // Last coordinates sent via onChange, so incoming prop updates caused by our
  // own typing don't reformat the text mid-edit (cursor jumps).
  const lastSentRef = useRef<[number, number] | null>(
    lat !== null && lng !== null ? [lat, lng] : null
  );

  // Sync text fields when coordinates change externally (map click/drag,
  // geolocation, form prefill), but not when they echo our own typing.
  useEffect(() => {
    const lastSent = lastSentRef.current;
    if (
      lat !== null &&
      lng !== null &&
      (lastSent === null || lastSent[0] !== lat || lastSent[1] !== lng)
    ) {
      lastSentRef.current = [lat, lng];
      setLatText(formatCoord(lat));
      setLngText(formatCoord(lng));
    } else if ((lat === null || lng === null) && lastSent !== null) {
      lastSentRef.current = null;
      setLatText(formatCoord(lat));
      setLngText(formatCoord(lng));
    }
  }, [lat, lng]);
  const customMarkerIcon = useMemo(
    () =>
      L.divIcon({
        className: "custom-marker-icon",
        html: `<div class="map-pin">
          <div class="map-pin-pulse"></div>
          <div class="map-pin-body">
            <div class="map-pin-dot"></div>
          </div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 34],
      }),
    []
  );
  const label = placeholder || "Latitude";
  const latLabel = label === "Latitude" ? "Latitude" : `${label} (lat)`;
  const lngLabel = label === "Latitude" ? "Longitude" : `${label} (lng)`;
  const parsedLat = parseCoord(latText, -90, 90);
  const parsedLng = parseCoord(lngText, -180, 180);
  const latInvalid = latText.trim() !== "" && parsedLat === null;
  const lngInvalid = lngText.trim() !== "" && parsedLng === null;

  const propagateIfValid = (nextLatText: string, nextLngText: string) => {
    const nextLat = parseCoord(nextLatText, -90, 90);
    const nextLng = parseCoord(nextLngText, -180, 180);
    if (nextLat === null || nextLng === null) return;
    const lastSent = lastSentRef.current;
    if (lastSent !== null && lastSent[0] === nextLat && lastSent[1] === nextLng) return;
    lastSentRef.current = [nextLat, nextLng];
    onChange(nextLat, nextLng);
  };
  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Silently ignore geolocation errors
      }
    );
  };
  if (!mounted) {
    return (
      <div
        className="h-64 w-full animate-pulse overflow-hidden rounded-xl bg-gray-100 ring-1
          ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
      />
    );
  }
  const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;
  return (
    <div className="space-y-3">
      <div
        className="h-64 w-full overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-gray-700"
      >
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          maxZoom={19}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full"
        >
          <VectorBasemap styleUrl={style.url} attribution={style.attribution}/>
          <ZoomControl position="bottomright"/>
          <MapClickHandler onClick={onChange}/>
          {lat !== null && lng !== null && (
            <Marker
              position={[lat, lng]}
              draggable={true}
              icon={customMarkerIcon} // ✅ Now uses the memoized icon
              eventHandlers={{
                dragend: (e: L.DragEndEvent) => {
                  const markerLatLng = e.target.getLatLng();
                  onChange(markerLatLng.lat, markerLatLng.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="map-picker-lat"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {latLabel}
          </label>
          <input
            id="map-picker-lat"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={latText}
            onChange={(e) => {
              setLatText(e.target.value);
              propagateIfValid(e.target.value, lngText);
            }}
            placeholder="41.715100"
            aria-label={latLabel}
            aria-invalid={latInvalid}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-gray-900
              dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${
              latInvalid
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
        </div>
        <div>
          <label
            htmlFor="map-picker-lng"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {lngLabel}
          </label>
          <input
            id="map-picker-lng"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={lngText}
            onChange={(e) => {
              setLngText(e.target.value);
              propagateIfValid(latText, e.target.value);
            }}
            placeholder="44.827100"
            aria-label={lngLabel}
            aria-invalid={lngInvalid}
            className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-gray-900
              dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${
              lngInvalid
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
        </div>
      </div>
      {(latInvalid || lngInvalid) && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Enter valid coordinates (latitude -90 to 90, longitude -180 to 180).
        </p>
      )}
      {showGeolocate && (
        <button
          type="button"
          onClick={handleGeolocation}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300
          bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50
          dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Use my location
        </button>
      )}
    </div>
  );
}
