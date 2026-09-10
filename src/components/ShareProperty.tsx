"use client";

import { useState, useSyncExternalStore } from "react";
import { Link2, Share2 } from "lucide-react";

interface SharePropertyProps {
  title: string;
  url: string;
}

export default function ShareProperty({ title, url }: SharePropertyProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // Share dismissed — no action needed.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
      >
        <Link2 className="h-4 w-4" aria-hidden="true"/>
        {copied ? "Copied!" : "Copy link"}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
        >
          <Share2 className="h-4 w-4" aria-hidden="true"/>
          Share
        </button>
      )}
    </div>
  );
}
