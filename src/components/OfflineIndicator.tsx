"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const t = useTranslations("Components.OfflineIndicator");

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the "back online" indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg
        px-4 py-2 shadow-lg transition-all duration-300 ${
          isOnline ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <span>{t("back_online")}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>{t("offline")}</span>
        </>
      )}
    </div>
  );
}
