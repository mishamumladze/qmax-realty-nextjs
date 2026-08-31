import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

vi.mock("deepl-node", () => ({
  DeepLClient: vi.fn().mockImplementation(() => ({
    translateText: vi.fn(),
  })),
}));

vi.mock("./deepl", () => ({
  translator: {
    translateText: vi.fn(),
  },
}));

import { translateToAllLocales, TranslationFields } from "./translations";
import { translator } from "./deepl";

const targetLocales = ["de", "tr", "ru", "pl"] as const;
const mockTranslateText = translator.translateText as unknown as Mock;

describe("translateToAllLocales", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseFields: TranslationFields = {
    title: "Luxury Villa",
    subtitle: "Sea View Property",
    location: "Istanbul",
    neighborhood: "Bebek",
    city: "Istanbul",
    region: "Marmara",
    country: "Turkey",
    meta_description: "Beautiful luxury villa for sale",
    description: "Spacious villa with sea view and garden",
    sale_type: "For Sale",
    inclusions: ["Pool", "Garden", "Parking"],
    floor_plan: "https://example.com/floorplan.pdf",
    card_image: "https://example.com/villa.jpg",
  };

  it("happy path: translates all string fields for all 4 locales with correct sourceLang/targetLang", async () => {
    const translations: Record<string, Record<string, string>> = {
      de: {
        title: "Luxusvilla",
        subtitle: "Meerblick-Immobilie",
        location: "Istanbul",
        neighborhood: "Bebek",
        city: "Istanbul",
        region: "Marmara",
        country: "Türkei",
        meta_description: "Schöne Luxusvilla zum Verkauf",
        description: "Geräumige Villa mit Meerblick und Garten",
        sale_type: "Zu Verkaufen",
        inclusions: "Pool\nGarten\nParkplatz",
      },
      tr: {
        title: "Lüks Villa",
        subtitle: "Deniz Manzaralı Mülk",
        location: "İstanbul",
        neighborhood: "Bebek",
        city: "İstanbul",
        region: "Marmara",
        country: "Türkiye",
        meta_description: "Satılık güzel lüks villa",
        description: "Deniz manzaralı ve bahçeli geniş villa",
        sale_type: "Satılık",
        inclusions: "Havuz\nBahçe\nPark Yeri",
      },
      ru: {
        title: "Роскошная вилла",
        subtitle: "Недвижимость с видом на море",
        location: "Стамбул",
        neighborhood: "Бебек",
        city: "Стамбул",
        region: "Мармара",
        country: "Турция",
        meta_description: "Красивая роскошная вилла для продажи",
        description: "Просторная вилла с видом на море и садом",
        sale_type: "На продажу",
        inclusions: "Бассейн\nСад\nПарковка",
      },
      pl: {
        title: "Luksusowa willa",
        subtitle: "Nieruchomość z widokiem na morze",
        location: "Stambuł",
        neighborhood: "Bebek",
        city: "Stambuł",
        region: "Marmara",
        country: "Turcja",
        meta_description: "Piękna luksusowa willa na sprzedaż",
        description: "Przestronna willa z widokiem na morze i ogródem",
        sale_type: "Na sprzedaż",
        inclusions: "Basen\nOgród\nParking",
      },
    };

    const reverseMap: Record<string, Record<string, string>> = {};
    for (const [locale, fields] of Object.entries(translations)) {
      reverseMap[locale] = {};
      for (const [field, translated] of Object.entries(fields)) {
        const original = baseFields[field as keyof TranslationFields] as string;
        if (original) {
          reverseMap[locale][original] = translated;
        }
      }
    }
    const joinedInclusions = baseFields.inclusions!.join("\n");
    for (const [locale, fields] of Object.entries(translations)) {
      reverseMap[locale][joinedInclusions] = fields.inclusions;
    }

    mockTranslateText.mockImplementation(
      async (text: string, _sourceLang: string, targetLang: string) => {
        const locale = targetLang.toLowerCase();
        return { text: reverseMap[locale][text] || text };
      }
    );

    const result = await translateToAllLocales("en", baseFields);

    expect(Object.keys(result)).toEqual(targetLocales);

    for (const locale of targetLocales) {
      const localeResult = result[locale];
      expect(localeResult.title).toBe(translations[locale].title);
      expect(localeResult.subtitle).toBe(translations[locale].subtitle);
      expect(localeResult.location).toBe(translations[locale].location);
      expect(localeResult.neighborhood).toBe(translations[locale].neighborhood);
      expect(localeResult.city).toBe(translations[locale].city);
      expect(localeResult.region).toBe(translations[locale].region);
      expect(localeResult.country).toBe(translations[locale].country);
      expect(localeResult.meta_description).toBe(translations[locale].meta_description);
      expect(localeResult.description).toBe(translations[locale].description);
      expect(localeResult.sale_type).toBe(translations[locale].sale_type);
      expect(localeResult.inclusions).toEqual(translations[locale].inclusions.split("\n"));
      expect(localeResult.floor_plan).toBe(baseFields.floor_plan);
      expect(localeResult.card_image).toBe(baseFields.card_image);
    }

    const stringFields = Object.keys(baseFields).filter(
      (k) => k !== "inclusions" && k !== "floor_plan" && k !== "card_image"
    );
    expect(mockTranslateText).toHaveBeenCalledTimes(stringFields.length * 4 + 4);
  });

  it("field-level translation error: returns original text for that field, other fields still translated", async () => {
    mockTranslateText.mockImplementation(async (_text: string, _source: string, target: string) => {
      if (target === "de") {
        throw new Error("API Error");
      }
      return { text: "translated" };
    });

    const result = await translateToAllLocales("en", {
      title: "Test Title",
      description: "Test Description",
    });

    expect(Object.keys(result)).toEqual(targetLocales);

    for (const locale of targetLocales) {
      if (locale === "de") {
        expect(result.de.title).toBe("Test Title");
        expect(result.de.description).toBe("Test Description");
      } else {
        expect(result[locale].title).toBe("translated");
        expect(result[locale].description).toBe("translated");
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("DeepL translation error"),
      expect.any(Error)
    );
  });

  it("inclusions array handling: round-trips through join/\\n/split correctly", async () => {
    const testInclusions = ["Pool", "Garden", "Parking", "Security", "Gym"];

    mockTranslateText.mockImplementation(async (text: string, _source: string, target: string) => {
      if (text.includes("\n")) {
        return {
          text: text
            .split("\n")
            .map((t) => `[${target.toUpperCase()}] ${t}`)
            .join("\n"),
        };
      }
      return { text: `[${target.toUpperCase()}] ${text}` };
    });

    const result = await translateToAllLocales("en", { ...baseFields, inclusions: testInclusions });

    for (const locale of targetLocales) {
      expect(result[locale].inclusions).toEqual(
        testInclusions.map((item) => `[${locale.toUpperCase()}] ${item}`)
      );
    }

    const inclusionsCalls = mockTranslateText.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("\n")
    );
    expect(inclusionsCalls.length).toBe(4);
    for (const call of inclusionsCalls) {
      expect(call[0]).toEqual(testInclusions.join("\n"));
    }
  });

  it("URL passthrough: floor_plan and card_image unchanged and not passed to translateText", async () => {
    const customFloorPlan = "https://custom.com/plan.pdf";
    const customCardImage = "https://custom.com/image.jpg";

    mockTranslateText.mockResolvedValue({ text: "translated" });

    await translateToAllLocales("en", {
      ...baseFields,
      floor_plan: customFloorPlan,
      card_image: customCardImage,
    });

    const allTranslatedTexts = mockTranslateText.mock.calls.map((call) => call[0]).flat();
    expect(allTranslatedTexts).not.toContain(customFloorPlan);
    expect(allTranslatedTexts).not.toContain(customCardImage);

    for (const locale of targetLocales) {
      const localeResult = (
        await translateToAllLocales("en", {
          ...baseFields,
          floor_plan: customFloorPlan,
          card_image: customCardImage,
        })
      )[locale];
      expect(localeResult.floor_plan).toBe(customFloorPlan);
      expect(localeResult.card_image).toBe(customCardImage);
    }
  });

  it("empty input: returns all 4 locale keys with empty/undefined translated fields", async () => {
    mockTranslateText.mockResolvedValue({ text: "" });

    const result = await translateToAllLocales("en", {});

    expect(Object.keys(result)).toEqual(targetLocales);

    for (const locale of targetLocales) {
      expect(result[locale]).toEqual({ floor_plan: undefined, card_image: undefined });
    }
  });

  it("handles undefined fields gracefully", async () => {
    mockTranslateText.mockResolvedValue({ text: "translated" });

    const result = await translateToAllLocales("en", {
      title: "Test",
      subtitle: undefined,
      location: undefined,
    });

    for (const locale of targetLocales) {
      expect(result[locale].title).toBe("translated");
      expect(result[locale].subtitle).toBeUndefined();
      expect(result[locale].location).toBeUndefined();
    }
  });

  it("uses correct source language for each locale translation", async () => {
    mockTranslateText.mockImplementation(
      async (_text: string, sourceLang: string, targetLang: string) => {
        return { text: "translated" };
      }
    );

    const result = await translateToAllLocales("en", { title: "Test", description: "Desc" });

    expect(result.de.title).toBe("translated");

    for (const locale of targetLocales) {
      const localeCalls = mockTranslateText.mock.calls.filter((c) => c[2] === locale);
      expect(localeCalls.length).toBeGreaterThan(0);
      for (const call of localeCalls) {
        expect(call[1]).toBe("en");
      }
    }
  });

  it("skips empty string fields (does not translate them, returns undefined in result)", async () => {
    const fieldsWithEmptyStrings: TranslationFields = {
      title: "Test Title",
      subtitle: "",
      description: "  ",
      location: "Valid Location",
    };

    mockTranslateText.mockResolvedValue({ text: "translated" });

    const result = await translateToAllLocales("en", fieldsWithEmptyStrings);

    for (const locale of targetLocales) {
      expect(result[locale].title).toBe("translated");
      expect(result[locale].subtitle).toBeUndefined();
      expect(result[locale].description).toBeUndefined();
      expect(result[locale].location).toBe("translated");
    }

    expect(mockTranslateText).toHaveBeenCalledTimes(2 * 4);
  });
});
