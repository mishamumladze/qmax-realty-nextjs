import { describe, it, expect } from "vitest";
import { MAP_STYLES, getMapStyle } from "./maps";

describe("getMapStyle", () => {
  it("returns the bright vector style by default", () => {
    const style = getMapStyle(false);
    expect(style).toBe(MAP_STYLES.light);
    expect(style.url).toBe("https://tiles.openfreemap.org/styles/bright");
  });

  it("returns the dark vector style in dark mode", () => {
    const style = getMapStyle(true);
    expect(style).toBe(MAP_STYLES.dark);
    expect(style.url).toBe("https://tiles.openfreemap.org/styles/dark");
  });

  it("credits OpenStreetMap, OpenFreeMap and OpenMapTiles", () => {
    for (const style of [MAP_STYLES.light, MAP_STYLES.dark]) {
      expect(style.attribution).toContain("openstreetmap.org/copyright");
      expect(style.attribution).toContain("openfreemap.org");
      expect(style.attribution).toContain("openmaptiles.org");
    }
  });

  it("requires no API key", () => {
    for (const style of [MAP_STYLES.light, MAP_STYLES.dark]) {
      expect(style.url).not.toContain("key=");
    }
  });
});
