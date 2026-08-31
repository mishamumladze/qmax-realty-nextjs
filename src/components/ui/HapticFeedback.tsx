"use client";

import { useCallback, useEffect, useRef } from "react";
import React from "react";

/**
 * Hook to provide haptic feedback simulation on mobile devices.
 * Uses the Vibration API where available, with visual fallback.
 */
export function useHapticFeedback() {
  const hasVibrationAPI = typeof navigator !== "undefined" && "vibrate" in navigator;

  const trigger = useCallback(
    (pattern: number | number[] = 10) => {
      if (hasVibrationAPI) {
        navigator.vibrate(pattern);
      }
    },
    [hasVibrationAPI]
  );

  return { trigger, hasVibrationAPI };
}

/**
 * Visual feedback hook for simulating haptic feedback on non-mobile or when vibration is unavailable.
 * Adds a brief scale animation to the element.
 */
export function useVisualFeedback() {
  const elementRef = useRef<HTMLButtonElement | HTMLAnchorElement | HTMLDivElement>(null);

  const trigger = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;

    el.style.transition = "transform 50ms ease-out";
    el.style.transform = "scale(0.97)";

    setTimeout(() => {
      el.style.transform = "scale(1)";
      setTimeout(() => {
        el.style.transition = "";
      }, 50);
    }, 50);
  }, []);

  return { ref: elementRef, trigger };
}

/**
 * Combined haptic + visual feedback hook.
 * Uses native vibration on mobile, visual feedback as fallback.
 */
export function useHapticAndVisualFeedback() {
  const { trigger: triggerHaptic, hasVibrationAPI } = useHapticFeedback();
  const { ref, trigger: triggerVisual } = useVisualFeedback();

  const trigger = useCallback(() => {
    triggerHaptic();
    // Always trigger visual feedback for consistency
    triggerVisual();
  }, [triggerHaptic, triggerVisual]);

  return { ref, trigger, hasVibrationAPI };
}
