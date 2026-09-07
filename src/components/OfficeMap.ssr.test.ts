import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function sourceOf(relativePath: string): string {
  return readFileSync(join(here, relativePath), "utf8");
}

/**
 * Regression test: OfficeMap.tsx is statically imported by the Footer server
 * component, so its module graph must never touch `window` at evaluation time.
 * Leaflet accesses `window` on import, which crashes SSR prerendering
 * (ReferenceError: window is not defined). The real map therefore lives in
 * OfficeMapInner.tsx, loaded with next/dynamic { ssr: false }.
 */
describe("OfficeMap SSR boundary", () => {
  const source = sourceOf("../components/OfficeMap.tsx");

  it("has no runtime import from leaflet", () => {
    const runtimeLeafletImports = source
      .split("\n")
      .filter(
        (line) =>
          /from ["']leaflet["']/.test(line) && !line.trimStart().startsWith("import type")
      );
    expect(runtimeLeafletImports).toEqual([]);
  });

  it("has no runtime import from react-leaflet", () => {
    const runtimeImports = source
      .split("\n")
      .filter(
        (line) =>
          /from ["']react-leaflet["']/.test(line) && !line.trimStart().startsWith("import type")
      );
    expect(runtimeImports).toEqual([]);
  });

  it("loads the real map with ssr disabled", () => {
    expect(source).toContain("OfficeMapInner");
    expect(source).toContain("ssr: false");
  });
});
