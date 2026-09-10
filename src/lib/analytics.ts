export function trackEvent(name: string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;
    const payload = JSON.stringify({
      event: name,
      props: props ?? {},
      path: window.location.pathname,
    });
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      try {
        if (navigator.sendBeacon("/api/analytics", blob)) return;
      } catch {
        // fall through to fetch
      }
    }
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // no-op: analytics must never break app logic
  }
}
