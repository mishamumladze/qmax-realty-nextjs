import { describe, it, expect } from "vitest";
import { mergeTranslationAliases } from "./admin-translations";
import type { Property } from "@/types/property";

function baseRow(): Property {
  return {
    id: 1,
    title: "Sea View Villa",
    city: "Istanbul",
    country: "Turkey",
    price: 500000,
  } as Property;
}

describe("mergeTranslationAliases", () => {
  it("merges translation aliases into a row without touching base fields", () => {
    const row = baseRow();
    const result = mergeTranslationAliases(
      row,
      {
        de: { title: "Meerblick-Villa", city: "Istanbul" },
        tr: { title: "Deniz Manzaralı Villa" },
      },
      []
    );

    expect(result.title_de).toBe("Meerblick-Villa");
    expect(result.city_de).toBe("Istanbul");
    expect(result.title_tr).toBe("Deniz Manzaralı Villa");
    // Base fields preserved.
    expect(result.title).toBe("Sea View Villa");
    expect(result.city).toBe("Istanbul");
    expect(result.id).toBe(1);
    // Input not mutated.
    expect(row).not.toHaveProperty("title_de");
    // New object returned.
    expect(result).not.toBe(row);
  });

  it("removes aliases for cleared keys across all locales", () => {
    const row = {
      ...baseRow(),
      title_de: "Meerblick-Villa",
      title_tr: "Deniz Manzaralı Villa",
      title_ru: "Вилла",
      title_pl: "Willa",
      city_de: "Istanbul",
    } as Property;

    const result = mergeTranslationAliases(row, undefined, ["title"]);

    expect(result).not.toHaveProperty("title_de");
    expect(result).not.toHaveProperty("title_tr");
    expect(result).not.toHaveProperty("title_ru");
    expect(result).not.toHaveProperty("title_pl");
    // Other keys untouched.
    expect(result.city_de).toBe("Istanbul");
    expect(result.title).toBe("Sea View Villa");
  });

  it("applies translations first, then cleared keys (clear wins)", () => {
    const row = { ...baseRow(), title_de: "Alt" } as Property;
    const result = mergeTranslationAliases(row, { de: { title: "Neu" } }, ["title"]);
    expect(result).not.toHaveProperty("title_de");
  });

  it("returns the row unchanged for invalid or missing translations input", () => {
    const invalidInputs: unknown[] = [
      undefined,
      null,
      "de",
      42,
      ["de"],
      { de: null },
      { de: "title" },
      { de: { title: 42 } },
      { de: { unknown_key: "x" } },
      { de: { title: ["x"] } },
    ];
    for (const translations of invalidInputs) {
      const row = baseRow();
      const result = mergeTranslationAliases(row, translations, undefined);
      expect(result).toEqual(row);
    }

    const invalidCleared: unknown[] = [undefined, null, "title", 42, { 0: "title" }, [42, null]];
    for (const clearedKeys of invalidCleared) {
      const row = baseRow();
      const result = mergeTranslationAliases(row, undefined, clearedKeys);
      expect(result).toEqual(row);
    }
  });

  it("keeps base property fields from the save response", () => {
    const saved = {
      ...baseRow(),
      title: "Updated Title",
      price: 750000,
      description: "Fresh description from save",
    } as Property;
    const result = mergeTranslationAliases(
      saved,
      { de: { title: "Aktualisierter Titel" } },
      undefined
    );
    expect(result.title).toBe("Updated Title");
    expect(result.price).toBe(750000);
    expect(result.description).toBe("Fresh description from save");
    expect(result.title_de).toBe("Aktualisierter Titel");
  });

  it("ignores non-text keys in clearedKeys", () => {
    const row = { ...baseRow(), title_de: "Titel" } as Property;
    const result = mergeTranslationAliases(row, undefined, ["price", "id", ""]);
    expect(result.title_de).toBe("Titel");
    expect(result).toEqual({ ...row });
  });
});
