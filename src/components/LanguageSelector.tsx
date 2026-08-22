"use client";

import { useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/config/languages";
import { translateText } from "@/app/actions/translate";
import * as deepl from "deepl-node";

interface Props {
  originalText: string;
  onTranslationComplete: (translated: string) => void;
}

export default function LanguageSelector({ originalText, onTranslationComplete }: Props) {
  const [activeLang, setActiveLang] = useState<deepl.TargetLanguageCode>("en-US");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSelect(code: deepl.TargetLanguageCode) {
    setActiveLang(code);

    if (code === "en-US") {
      onTranslationComplete(originalText);
      return;
    }

    setIsLoading(true);
    const res = await translateText(originalText, code);
    if (res.success && res.translatedText) {
      onTranslationComplete(res.translatedText);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleSelect(lang.code)}
          disabled={isLoading}
          className={`flex items-center gap-1 rounded border px-3 py-1 text-sm transition ${
            activeLang === lang.code
              ? "bg-black font-bold text-white"
              : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
