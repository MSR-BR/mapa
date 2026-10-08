"use client";
import { useEffect, useState } from "react";

/** Transient instructions survive navigation/reload in this tab; they are never academic context. */
export function useRegenerationRequests(projectId: string) {
  const key = `mapa.card-requests.v1.${projectId}`;
  const [requests, setRequests] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (typeof stored.savedAt !== "number" || Date.now() - stored.savedAt > 86_400_000) { sessionStorage.removeItem(key); return; }
      const values = Object.fromEntries(Object.entries(stored.values ?? {}).filter(([id, value]) => id.length <= 64 && typeof value === "string" && value.length <= 1000));
      queueMicrotask(() => setRequests(values as Record<string, string>));
    } catch { /* The editable request still works when browser storage is unavailable. */ }
  }, [key]);
  function updateRequest(id: string, value: string) {
    setRequests((previous) => {
      const next = { ...previous, [id]: value };
      return next;
    });
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) ?? "{}");
      sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), values: { ...(stored.values ?? {}), [id]: value } }));
    } catch { /* No server call or export is made for a one-time instruction. */ }
  }
  return [requests, updateRequest] as const;
}
