"use server";

import { translator } from "@/lib/deepl";
import * as deepl from "deepl-node";

export async function translateText(text: string, targetLang: deepl.TargetLanguageCode) {
  if (!text) return { success: false, error: "No text provided" };

  try {
    const result = await translator.translateText(text, null, targetLang);
    return { success: true, translatedText: result.text };
  } catch (error) {
    console.error("DeepL Translation Error:", error);
    return { success: false, error: "Translation failed" };
  }
}
