export interface MapStyle {
  /** MapLibre style URL (vector tiles, key-free). */
  url: string;
  attribution: string;
}

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>';

/** Key-free vector basemap styles (bright for light mode, dark for dark mode). */
export const MAP_STYLES: { light: MapStyle; dark: MapStyle } = {
  light: {
    url: "https://tiles.openfreemap.org/styles/bright",
    attribution: ATTRIBUTION,
  },
  dark: {
    url: "https://tiles.openfreemap.org/styles/dark",
    attribution: ATTRIBUTION,
  },
} as const;

/** Returns the basemap style matching the current theme. */
export function getMapStyle(dark: boolean): MapStyle {
  return dark ? MAP_STYLES.dark : MAP_STYLES.light;
}
