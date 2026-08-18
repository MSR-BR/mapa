"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  initialAuthActionState,
  type AuthActionState,
} from "./types";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

type AuthFormProps = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  alternateHref?: string;
  alternateLabel?: string;
  emailOnly?: boolean;
  passwordOnly?: boolean;
  submitLabel: string;
  hiddenFields?: Record<string, string>;
};

export function AuthForm({
  action,
  alternateHref,
  alternateLabel,
  emailOnly = false,
  passwordOnly = false,
  submitLabel,
  hiddenFields,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="auth-form">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      {!passwordOnly ? (
        <label>
          E-mail
          <input
            autoComplete="email"
            name="email"
            required
            type="email"
          />
        </label>
      ) : null}
      {!emailOnly ? (
        <label>
          Senha
          <input
            autoComplete={submitLabel === "Entrar" ? "current-password" : "new-password"}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
      ) : null}
      {state.message ? (
        <p className={`form-message ${state.status}`} role="status">
          {state.message}
        </p>
      ) : null}
      <button data-analytics-event="login" disabled={pending} onClick={() => trackAnalyticsEvent("login")} type="submit">
        {pending ? "Aguarde…" : submitLabel}
      </button>
      {alternateHref && alternateLabel ? (
        <Link className="form-link" href={alternateHref}>{alternateLabel}</Link>
      ) : null}
    </form>
  );
}
