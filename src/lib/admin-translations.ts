import type { Property } from "@/types/property";

// Text keys the API may return translations for. Kept in sync with the
// save-response contract: { [locale]: { [textKey]: string } }.
const TEXT_KEYS: ReadonlySet<string> = new Set([
  "title",
  "neighborhood",
  "city",
  "country",
  "meta_description",
  "description",
  "sale_type",
]);

// Locales stored as `${key}_${locale}` aliases on the Property row.
const LOCALES: ReadonlyArray<string> = ["de", "tr", "ru", "pl"];

// Envelope fields that may ride on the saved object when forwarded through
// onSaved. They are consumed here and stripped so they never leak into table
// state.
const ENVELOPE_KEYS: ReadonlySet<string> = new Set(["translations", "clearedKeys"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Merge save-response translation data into a property row.
 *
 * - Returns a new row (never mutates the input).
 * - Copies the row's base fields (the save response's fresh values win by
 *   virtue of being on the row already).
 * - For each valid `translations[locale][textKey]` string, sets the
 *   `${textKey}_${locale}` alias.
 * - For each valid `clearedKeys` entry (a known text key), deletes the
 *   `${textKey}_{de,tr,ru,pl}` aliases (emptied translations).
 * - `translations` / `clearedKeys` envelope keys present on the row itself
 *   are stripped from the result.
 * - Invalid or missing `translations`/`clearedKeys` input leaves the row
 *   content unchanged (still returned as a new object).
 */
export function mergeTranslationAliases(
  row: Property,
  translations: unknown,
  clearedKeys: unknown
): Property {
  const next: Record<string, unknown> = { ...(row as unknown as Record<string, unknown>) };
  for (const key of ENVELOPE_KEYS) {
    delete next[key];
  }

  if (isRecord(translations)) {
    for (const [locale, perLocale] of Object.entries(translations)) {
      if (typeof locale !== "string" || locale === "") continue;
      if (!isRecord(perLocale)) continue;
      for (const [key, value] of Object.entries(perLocale)) {
        if (!TEXT_KEYS.has(key)) continue;
        if (typeof value !== "string") continue;
        next[`${key}_${locale}`] = value;
      }
    }
  }

  if (Array.isArray(clearedKeys)) {
    for (const key of clearedKeys) {
      if (typeof key !== "string" || !TEXT_KEYS.has(key)) continue;
      for (const locale of LOCALES) {
        delete next[`${key}_${locale}`];
      }
    }
  }

  return next as unknown as Property;
}
