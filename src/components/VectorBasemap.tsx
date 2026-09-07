"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type * as L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";

interface VectorBasemapProps {
  styleUrl: string;
  attribution: string;
}

/**
 * Key-free vector basemap rendered inside the Leaflet map via the
 * MapLibre GL Leaflet binding. The binding is loaded with a dynamic import
 * so maplibre-gl is never evaluated during SSR and lands in its own chunk.
 */
export default function VectorBasemap({
  styleUrl,
  attribution,
}: VectorBasemapProps): null {
  const map = useMap();
  const layerRef = useRef<L.MaplibreGL | null>(null);
  const styleRef = useRef(styleUrl);

  useEffect(() => {
    let cancelled = false;
    let layer: L.MaplibreGL | null = null;
    (async () => {
      const { maplibreGL } = await import("@maplibre/maplibre-gl-leaflet");
      if (cancelled) return;
      layer = maplibreGL({
        style: styleRef.current,
        attributionControl: { customAttribution: attribution },
      });
      layer.addTo(map);
      layerRef.current = layer;
    })();
    return () => {
      cancelled = true;
      if (layer) {
        map.removeLayer(layer);
        layerRef.current = null;
      }
    };
  }, [map, attribution]);

  useEffect(() => {
    styleRef.current = styleUrl;
    layerRef.current?.getMaplibreMap()?.setStyle(styleUrl);
  }, [styleUrl]);

  return null;
}
