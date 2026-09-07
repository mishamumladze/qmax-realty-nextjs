"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * SSR-safe mount flag. False on the server / first hydration pass, true once
 * mounted on the client. Use to guard browser-only components (e.g. Leaflet
 * maps) without hydration mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
