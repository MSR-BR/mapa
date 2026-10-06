"use client";
import { useEffect, useRef, useState } from "react";
import { progressLabel, type AiProgressEvent } from "./contract";
import { readProgressResponse } from "./progress-client";

export function useAiProgress() {
  const [event, setEvent] = useState<AiProgressEvent | null>(null);
  const active = useRef<{ epoch: number; controller: AbortController } | null>(null);
  const epoch = useRef(0);
  useEffect(() => () => { active.current?.controller.abort(); active.current = null; }, []);
  async function request(input: string, init: RequestInit) {
    active.current?.controller.abort();
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const current = { epoch: ++epoch.current, controller: new AbortController() };
    active.current = current; setEvent(null);
    const headers = new Headers(init.headers); headers.set("Accept", "application/x-ndjson");
    try {
      const response = await fetch(input, { ...init, headers, signal: current.controller.signal });
      const result = await readProgressResponse(response, (next) => {
        if (active.current === current && !current.controller.signal.aborted) setEvent(next);
      });
      if (active.current !== current || current.controller.signal.aborted) throw new Error("Solicitação cancelada. Confira a versão salva antes de tentar novamente.");
      return result;
    } catch (error) {
      if (current.controller.signal.aborted) throw new Error("Solicitação cancelada. Confira a versão salva antes de tentar novamente.");
      throw error;
    } finally { if (active.current === current) { active.current = null; requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); }); } }
  }
  return { request, label: progressLabel(event), event, cancel: () => active.current?.controller.abort() };
}
