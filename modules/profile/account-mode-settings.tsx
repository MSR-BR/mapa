"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

import { switchActiveProfileMode } from "./actions";
import {
  ACCOUNT_MODE_CHANNEL,
  ACCOUNT_MODE_STORAGE_KEY,
  INITIAL_PROFILE_MODE_SWITCH_STATE,
} from "./mode-switch-policy";
import { USER_PROFILE_ROLE_LABELS, type UserProfileRole } from "./types";

type Props = {
  activeRole: UserProfileRole;
  roleVersion: number;
};

const MODE_COPY = {
  advisor: {
    description: "Crie mapas rápidos ou avançados de forma autônoma e revise, em uma área separada, os projetos de estudantes vinculados.",
    title: "Orientador",
  },
  student: {
    description: "Crie mapas rápidos ou avançados e, quando desejar, vincule um orientador para acompanhar e validar as etapas.",
    title: "Aluno",
  },
} as const;

function publishModeRefresh(requestId: string) {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(ACCOUNT_MODE_CHANNEL);
    channel.postMessage({ requestId, type: "account-mode-changed" });
    channel.close();
  }
  try {
    window.localStorage.setItem(ACCOUNT_MODE_STORAGE_KEY, `${Date.now()}:${requestId}`);
  } catch {
    // BroadcastChannel is the primary path; storage is only a compatibility hint.
  }
}

export function AccountModeSettings({ activeRole, roleVersion }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const handledRequestRef = useRef<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserProfileRole | null>(null);
  const [requestId, setRequestId] = useState("");
  const [state, formAction, pending] = useActionState(
    switchActiveProfileMode,
    INITIAL_PROFILE_MODE_SWITCH_STATE,
  );

  useEffect(() => {
    if (selectedRole && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [selectedRole]);

  useEffect(() => {
    if (!state.requestId || handledRequestRef.current === state.requestId) return;
    handledRequestRef.current = state.requestId;
    if (state.status === "success" && state.activeRole) {
      trackAnalyticsEvent("profile_mode_changed", {
        auth_state: "authenticated",
        profile_role: state.activeRole,
        result: "success",
        source: "dashboard",
      });
      publishModeRefresh(state.requestId);
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    if (state.status === "conflict") {
      trackAnalyticsEvent("profile_mode_changed", {
        auth_state: "authenticated",
        profile_role: activeRole,
        reason_code: "duplicate_action",
        result: "failed",
        source: "dashboard",
      });
      router.refresh();
    }
  }, [activeRole, router, state]);

  const openConfirmation = (nextRole: UserProfileRole, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setRequestId(crypto.randomUUID());
    setSelectedRole(nextRole);
  };

  const closeConfirmation = () => {
    if (pending) return;
    dialogRef.current?.close();
    setSelectedRole(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  return (
    <section aria-labelledby="account-mode-title" className="account-mode-panel">
      <div className="settings-section-heading">
        <div>
          <p className="section-kicker">Modo de uso</p>
          <h2 id="account-mode-title">Escolha como usar esta conta</h2>
        </div>
      </div>
      <p className="account-mode-intro">
        Você continuará na mesma conta. Seus projetos e vínculos não serão apagados. Nos dois
        perfis você pode criar mapas rápidos ou avançados.
      </p>
      <div className="account-mode-options">
        {(Object.keys(MODE_COPY) as UserProfileRole[]).map((role) => {
          const current = role === activeRole;
          return (
            <article className={`account-mode-option ${current ? "is-active" : ""}`} key={role}>
              <div>
                <span className="account-mode-icon" aria-hidden="true">{role === "student" ? "A" : "O"}</span>
                {current ? <span className="account-mode-current">Em uso</span> : null}
              </div>
              <h3>{MODE_COPY[role].title}</h3>
              <p>{MODE_COPY[role].description}</p>
              <button
                className={current ? "account-mode-button current" : "account-mode-button"}
                disabled={current || pending}
                onClick={(event) => openConfirmation(role, event.currentTarget)}
                type="button"
              >
                {current ? `${USER_PROFILE_ROLE_LABELS[role]} em uso` : `Usar como ${USER_PROFILE_ROLE_LABELS[role]}`}
              </button>
            </article>
          );
        })}
      </div>
      <p aria-live="polite" className="account-mode-status">
        {state.status === "success" ? "Perfil atualizado. Abrindo o dashboard…" : null}
        {(state.status === "error" || state.status === "conflict") ? state.message : null}
      </p>

      {selectedRole ? (
        <dialog
          aria-describedby="account-mode-confirm-description"
          aria-labelledby="account-mode-confirm-title"
          aria-modal="true"
          className="account-mode-dialog"
          onCancel={(event) => {
            event.preventDefault();
            closeConfirmation();
          }}
          ref={dialogRef}
        >
          <form action={formAction}>
            <input name="expectedRoleVersion" type="hidden" value={roleVersion} />
            <input name="nextRole" type="hidden" value={selectedRole} />
            <input name="requestId" type="hidden" value={requestId} />
            <p className="section-kicker">Confirmar troca</p>
            <h2 id="account-mode-confirm-title">Usar como {USER_PROFILE_ROLE_LABELS[selectedRole]}?</h2>
            <p id="account-mode-confirm-description">
              A conta continuará a mesma e nenhum projeto será convertido ou apagado. O dashboard
              passará a mostrar a biblioteca criada como {USER_PROFILE_ROLE_LABELS[selectedRole]}.
            </p>
            {selectedRole === "student" ? (
              <p>Como Aluno, você poderá trabalhar com supervisão de um orientador.</p>
            ) : (
              <p>Como Orientador, seus projetos serão autônomos e as revisões vinculadas ficarão separadas.</p>
            )}
            {state.requestId === requestId && state.message ? (
              <p className="form-message error" role="alert">{state.message}</p>
            ) : null}
            <div className="account-mode-dialog-actions">
              <button className="secondary-button" disabled={pending} onClick={closeConfirmation} type="button">Cancelar</button>
              <button className="account-mode-confirm" disabled={pending} type="submit">
                {pending ? "Trocando perfil…" : `Confirmar como ${USER_PROFILE_ROLE_LABELS[selectedRole]}`}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </section>
  );
}
