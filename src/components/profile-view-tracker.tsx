"use client";

import { useEffect } from "react";

const trackedProfiles = new Set<string>();

export function ProfileViewTracker({ slug }: Readonly<{ slug: string }>) {
  useEffect(() => {
    if (trackedProfiles.has(slug)) return;

    const timer = window.setTimeout(() => {
      if (trackedProfiles.has(slug)) return;
      trackedProfiles.add(slug);
      void fetch("/api/v1/analytics/profile-views", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => undefined);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [slug]);

  return null;
}
