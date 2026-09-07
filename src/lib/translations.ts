import { translator } from "./deepl";
import type { SourceLanguageCode, TargetLanguageCode } from "deepl-node";

export interface TranslationFields {
  title?: string;
  subtitle?: string;
  location?: string;
  neighborhood?: string;
  city?: string;
  region?: string;
  country?: string;
  meta_description?: string;
  description?: string;
  sale_type?: string;
  inclusions?: string[];
  floor_plan?: string;
  card_image?: string;
}

const ALL_LOCALES = ["en", "de", "tr", "ru", "pl"] as const;
type AppLocale = (typeof ALL_LOCALES)[number];

function normalizeSourceLocale(sourceLocale: string): AppLocale {
  if (sourceLocale.startsWith("en")) return "en";
  if (sourceLocale === "de" || sourceLocale === "tr" || sourceLocale === "ru" || sourceLocale === "pl") {
    return sourceLocale;
  }
  return "en";
}

function toDeepLTarget(locale: AppLocale): TargetLanguageCode {
  // DeepL has no plain "en" target code; the codebase convention is "en-US".
  return locale === "en" ? "en-US" : locale;
}

function translateField(
  text: string,
  sourceLang: SourceLanguageCode,
  targetLang: TargetLanguageCode
): Promise<string> {
  return translator
    .translateText(text, sourceLang, targetLang)
    .then((result) => result.text)
    .catch((err) => {
      console.error(`DeepL translation error (${sourceLang} -> ${targetLang}):`, err);
      return text;
    });
}

async function translateInclusions(
  inclusions: string[],
  sourceLang: SourceLanguageCode,
  targetLang: TargetLanguageCode
): Promise<string[]> {
  if (inclusions.length === 0) return [];
  const joined = inclusions.join("\n");
  try {
    const result = await translator.translateText(joined, sourceLang, targetLang);
    return result.text.split("\n").map((s) => s.trim());
  } catch (err) {
    console.error(`DeepL inclusions translation error (${sourceLang} -> ${targetLang}):`, err);
    return inclusions;
  }
}

export async function translateToAllLocales(
  sourceLocale: string,
  fields: TranslationFields
): Promise<Partial<Record<"en" | "de" | "tr" | "ru" | "pl", TranslationFields>>> {
  const sourceLang = normalizeSourceLocale(sourceLocale);
  const targetLocales = ALL_LOCALES.filter((locale): locale is AppLocale => locale !== sourceLang);

  const results = await Promise.all(
    targetLocales.map(async (targetLocale): Promise<[AppLocale, TranslationFields]> => {
      const deepLTarget = toDeepLTarget(targetLocale);
      try {
        const translated: TranslationFields = {};

        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;

          if (key === "inclusions" && Array.isArray(value)) {
            translated.inclusions = await translateInclusions(value, sourceLang, deepLTarget);
          } else if (key === "floor_plan" || key === "card_image") {
            (translated as Record<string, unknown>)[key] = value;
          } else if (typeof value === "string" && value.trim() !== "") {
            (translated as Record<string, unknown>)[key] = await translateField(
              value,
              sourceLang,
              deepLTarget
            );
          }
        }

        return [targetLocale, translated];
      } catch (err) {
        console.error(`DeepL locale error (${sourceLang} -> ${targetLocale}):`, err);
        return [targetLocale, {}];
      }
    })
  );

  return Object.fromEntries(results) as Partial<Record<AppLocale, TranslationFields>>;
}
