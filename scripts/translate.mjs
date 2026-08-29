import fs from "fs";
import path from "path";
import * as deepl from "deepl-node";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.DEEPL_API_KEY;
if (!apiKey) {
  console.error("❌ DEEPL_API_KEY missing");
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

// Free-tier friendly
const BATCH_SIZE = 50;
const MAX_CONCURRENT = 2;
const BASE_DELAY_MS = 100;
const RATE_LIMIT_DELAY_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function protectPlaceholders(text) {
  const placeholders = [];
  const protectedText = text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, p) => {
    placeholders.push(p);
    return `__ICU_${placeholders.length - 1}__`;
  });
  return { protectedText, placeholders };
}

function restorePlaceholders(text, placeholders) {
  return text.replace(/__ICU_(\d+)__/g, (_, i) => `{${placeholders[i]}}`);
}

function flattenMissing(source, target, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(source)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const targetVal = target?.[k];
    if (typeof v === "object" && v !== null) {
      out.push(...flattenMissing(v, targetVal, p));
    } else if (typeof v === "string") {
      if (targetVal === undefined || targetVal === "") {
        out.push({ path: p, ...protectPlaceholders(v) });
      }
    }
  }
  return out;
}

function unflatten(results) {
  const root = {};
  for (const { path, translated } of results) {
    const parts = path.split(".");
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = translated;
  }
  return root;
}

function mergeTranslations(target, translated) {
  const merged = { ...target };
  for (const [k, v] of Object.entries(translated)) {
    merged[k] = typeof v === "object" ? mergeTranslations(target[k] || {}, v) : v;
  }
  return merged;
}

class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }
  async acquire() {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise((r) => this.queue.push(r));
  }
  release() {
    this.current--;
    if (this.queue.length) {
      this.current++;
      this.queue.shift()();
    }
  }
}

async function translateLocale(locale, deeplCode, enContent, targetContent) {
  const missing = flattenMissing(enContent, targetContent);
  if (!missing.length) {
    console.log(`\n✨ [${locale.toUpperCase()}] Up to date.`);
    return targetContent;
  }
  console.log(
    `\n🌐 ${locale.toUpperCase()}: ${missing.length} keys in batches of ${BATCH_SIZE}...`
  );

  const results = [];
  let delay = BASE_DELAY_MS;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const texts = batch.map((b) => b.protectedText);
    let retries = 3;
    let ok = false;
    while (!ok && retries--) {
      try {
        const res = await translator.translateText(texts, null, deeplCode, {
          preserveFormatting: true,
        });
        const arr = Array.isArray(res) ? res : [res];
        for (let j = 0; j < batch.length; j++) {
          results.push({
            path: batch[j].path,
            translated: restorePlaceholders(arr[j].text, batch[j].placeholders),
          });
        }
        console.log(
          `  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missing.length / BATCH_SIZE)}`
        );
        ok = true;
        await sleep(delay);
      } catch (e) {
        if (e.name === "TooManyRequestsError" || e.message.includes("Too many requests")) {
          console.warn(`  ⏳ Rate limit, waiting ${RATE_LIMIT_DELAY_MS}ms...`);
          await sleep(RATE_LIMIT_DELAY_MS);
          delay = Math.min(delay * 2, 2000);
        } else throw e;
      }
    }
    if (!ok) for (const b of batch) results.push({ path: b.path, translated: b.original });
  }
  return mergeTranslations(targetContent, unflatten(results));
}

async function run() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Missing ${SOURCE_FILE}`);
    return;
  }
  const en = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"));
  const sem = new Semaphore(MAX_CONCURRENT);
  await Promise.all(
    Object.entries(TARGET_LOCALES).map(([loc, code]) =>
      (async () => {
        await sem.acquire();
        try {
          const fp = path.join(MESSAGES_DIR, `${loc}.json`);
          let tgt = {};
          if (fs.existsSync(fp)) {
            try {
              tgt = JSON.parse(fs.readFileSync(fp, "utf-8"));
            } catch {}
          }
          const updated = await translateLocale(loc, code, en, tgt);
          fs.writeFileSync(fp, JSON.stringify(updated, null, 2), "utf-8");
          console.log(`✅ messages/${loc}.json`);
        } finally {
          sem.release();
        }
      })()
    )
  );
  console.log("\n🎉 Done.");
}

run();
