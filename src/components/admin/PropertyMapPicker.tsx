"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PropertyMapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  placeholder?: string;
}

const DEFAULT_CENTER: [number, number] = [41.7151, 44.8271];
const DEFAULT_ZOOM = 12;

const customMarkerIcon = L.divIcon({
  className: "custom-marker-icon",
  html: '<div style="width:24px;height:24px;background:#e11d48;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

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
}: PropertyMapPickerProps): React.ReactElement {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = placeholder || "Latitude";
  const latLabel = label === "Latitude" ? "Latitude" : `${label} (lat)`;
  const lngLabel = label === "Latitude" ? "Longitude" : `${label} (lng)`;

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Silently ignore geolocation errors
      },
    );
  };

  if (!mounted) {
    return (
      <div className="h-64 w-full rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );
  }

  const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className="space-y-3">
      <div className="h-64 w-full rounded-md overflow-hidden">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onClick={onChange} />
          {lat !== null && lng !== null && (
            <Marker
              position={[lat, lng]}
              draggable={true}
              icon={customMarkerIcon}
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
          <label htmlFor="map-picker-lat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {latLabel}
          </label>
          <input
            id="map-picker-lat"
            type="text"
            readOnly
            value={lat !== null ? lat.toFixed(6) : ""}
            className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            aria-label={latLabel}
          />
        </div>
        <div>
          <label htmlFor="map-picker-lng" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {lngLabel}
          </label>
          <input
            id="map-picker-lng"
            type="text"
            readOnly
            value={lng !== null ? lng.toFixed(6) : ""}
            className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            aria-label={lngLabel}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGeolocation}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Use my location
      </button>
    </div>
  );
}