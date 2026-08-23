import fs from "fs";
import path from "path";
import * as deepl from "deepl-node";
import dotenv from "dotenv";

// Load environment variables explicitly from .env.local
dotenv.config({ path: ".env.local" });

const apiKey = process.env.DEEPL_API_KEY;
if (!apiKey) {
  console.error("❌ DEEPL_API_KEY is missing in .env.local");
  process.exit(1);
}

const translator = new deepl.DeepLClient(apiKey);
const MESSAGES_DIR = path.join(process.cwd(), "messages");
const SOURCE_FILE = path.join(MESSAGES_DIR, "en.json");

const TARGET_LOCALES = {
  de: "de",
  tr: "tr",
  ru: "ru",
  pl: "pl",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Compares source vs target objects and returns ONLY keys that need translation.
 */
function getMissingKeys(sourceObj, targetObj = {}) {
  const missing = {};

  for (const [key, value] of Object.entries(sourceObj)) {
    if (typeof value === "object" && value !== null) {
      const nestedMissing = getMissingKeys(value, targetObj[key] || {});
      if (Object.keys(nestedMissing).length > 0) {
        missing[key] = nestedMissing;
      }
    } else if (typeof value === "string") {
      // Key needs translation if missing, empty, or untranslated
      if (targetObj[key] === undefined || targetObj[key] === "") {
        missing[key] = value;
      }
    }
  }

  return missing;
}

/**
 * Translates missing strings and merges them recursively into target object.
 */
async function translateAndMerge(missingObj, targetObj, targetLang) {
  const merged = { ...targetObj };

  for (const [key, value] of Object.entries(missingObj)) {
    if (typeof value === "object" && value !== null) {
      merged[key] = await translateAndMerge(value, targetObj[key] || {}, targetLang);
    } else if (typeof value === "string") {
      let success = false;
      let retries = 3;

      while (!success && retries > 0) {
        try {
          console.log(` Translating [${targetLang}] key "${key}": "${value}"`);
          const result = await translator.translateText(value, null, targetLang, {
            preserveFormatting: true,
          });
          merged[key] = result.text;
          success = true;

          // Delay to stay clear of rate limits
          await sleep(200);
        } catch (error) {
          if (
            error.name === "TooManyRequestsError" ||
            error.message.includes("Too many requests")
          ) {
            console.warn(`⏳ Rate limit hit on key "${key}". Pausing 5s...`);
            await sleep(5000);
            retries--;
          } else {
            throw error;
          }
        }
      }

      if (!success) {
        console.error(`❌ Failed to translate "${key}". Using English fallback.`);
        merged[key] = value;
      }
    }
  }

  return merged;
}

async function run() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file missing at ${SOURCE_FILE}.`);
    return;
  }

  const enContent = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"));

  for (const [locale, deeplCode] of Object.entries(TARGET_LOCALES)) {
    const targetFilePath = path.join(MESSAGES_DIR, `${locale}.json`);
    let targetContent = {};

    // Load existing target translation file if present
    if (fs.existsSync(targetFilePath)) {
      try {
        targetContent = JSON.parse(fs.readFileSync(targetFilePath, "utf-8"));
      } catch (err) {
        console.warn(`⚠️ Could not parse existing ${locale}.json. Recreating...`);
      }
    }

    // 1. Diff source against existing file
    const missingKeys = getMissingKeys(enContent, targetContent);

    if (Object.keys(missingKeys).length === 0) {
      console.log(`\n✨ [${locale.toUpperCase()}] All keys up to date. Skipping.`);
      continue;
    }

    console.log(`\n🌐 Translating missing keys for [${locale.toUpperCase()}]...`);

    // 2. Only translate missing keys and merge into existing translations
    const updatedContent = await translateAndMerge(missingKeys, targetContent, deeplCode);

    // 3. Write merged JSON back to disk
    fs.writeFileSync(targetFilePath, JSON.stringify(updatedContent, null, 2), "utf-8");
    console.log(`✅ Updated messages/${locale}.json`);
  }
}

run();
