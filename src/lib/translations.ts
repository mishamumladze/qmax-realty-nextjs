import { translator } from "./deepl";

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

const TARGET_LOCALES = ["de", "tr", "ru", "pl"] as const;
type TargetLocale = (typeof TARGET_LOCALES)[number];

function translateField(
  text: string,
  sourceLang: string,
  targetLang: TargetLocale
): Promise<string> {
  return translator
    .translateText(text, sourceLang as "en", targetLang)
    .then((result) => result.text)
    .catch((err) => {
      console.error(`DeepL translation error (${sourceLang} -> ${targetLang}):`, err);
      return text;
    });
}

async function translateInclusions(
  inclusions: string[],
  sourceLang: string,
  targetLang: TargetLocale
): Promise<string[]> {
  if (inclusions.length === 0) return [];
  const joined = inclusions.join("\n");
  try {
    const result = await translator.translateText(joined, sourceLang as "en", targetLang);
    return result.text.split("\n").map((s) => s.trim());
  } catch (err) {
    console.error(`DeepL inclusions translation error (${sourceLang} -> ${targetLang}):`, err);
    return inclusions;
  }
}

export async function translateToAllLocales(
  sourceLocale: string,
  fields: TranslationFields
): Promise<Record<TargetLocale, TranslationFields>> {
  const sourceLang = sourceLocale.startsWith("en") ? "en" : sourceLocale;

  const results = await Promise.all(
    TARGET_LOCALES.map(async (targetLocale): Promise<[TargetLocale, TranslationFields]> => {
      try {
        const translated: TranslationFields = {};

        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;

          if (key === "inclusions" && Array.isArray(value)) {
            translated.inclusions = await translateInclusions(value, sourceLang, targetLocale);
          } else if (key === "floor_plan" || key === "card_image") {
            (translated as Record<string, unknown>)[key] = value;
          } else if (typeof value === "string" && value.trim() !== "") {
            (translated as Record<string, unknown>)[key] = await translateField(
              value,
              sourceLang,
              targetLocale
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

  return Object.fromEntries(results) as Record<TargetLocale, TranslationFields>;
}
