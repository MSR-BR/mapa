"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ACCOUNT_MODE_CHANNEL, ACCOUNT_MODE_STORAGE_KEY } from "./mode-switch-policy";

export function AccountModeSync() {
  const router = useRouter();

  useEffect(() => {
    const refreshFromServer = () => router.refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === ACCOUNT_MODE_STORAGE_KEY) refreshFromServer();
    };
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(ACCOUNT_MODE_CHANNEL);
      channel.addEventListener("message", refreshFromServer);
    }
    window.addEventListener("storage", onStorage);
    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [router]);

  return null;
}
