"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

import {
  trackAnalyticsEvent,
  type AnalyticsSource,
} from "@/modules/analytics/analytics";

import type { SocialAuthErrorCode, SocialAuthProvider } from "./oauth-contract";

type SocialAuthFormProps = {
  action: (formData: FormData) => Promise<void>;
  destination: string;
  label: string;
  mark: string;
  provider: SocialAuthProvider;
  source: Extract<AnalyticsSource, "google" | "linkedin">;
};

function SocialAuthSubmitButton({ label, mark, source }: Pick<SocialAuthFormProps, "label" | "mark" | "source">) {
  const { pending } = useFormStatus();

  return (
    <button className={`social-auth-button social-auth-button-${source}`} disabled={pending} type="submit">
      <span aria-hidden="true" className={`social-auth-mark social-auth-mark-${source}`}>{mark}</span>
      {pending ? `Conectando ao ${label}…` : `Continuar com ${label}`}
    </button>
  );
}

export function SocialAuthForm({ action, destination, label, mark, provider, source }: SocialAuthFormProps) {
  return (
    <form
      action={action}
      className="social-auth-form"
      onSubmit={() => trackAnalyticsEvent("login_started", { result: "started", source })}
    >
      <input name="next" type="hidden" value={destination} />
      <input name="provider" type="hidden" value={provider} />
      <SocialAuthSubmitButton label={label} mark={mark} source={source} />
    </form>
  );
}

export function SocialAuthErrorNotice({ code, message }: { code: SocialAuthErrorCode; message: string }) {
  useEffect(() => {
    trackAnalyticsEvent("login_failed", {
      reason_code: "provider_unavailable",
      result: "failed",
      source: code === "google" || code === "linkedin" ? code : "unknown",
    });
  }, [code]);

  return <p className="form-message error" role="alert">{message}</p>;
}
