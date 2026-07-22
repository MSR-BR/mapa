"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="workspace-shell route-state-shell">
      <div className="route-state-card" role="alert">
        <span className="route-state-mark" aria-hidden="true">!</span>
        <p className="eyebrow">Interrupção temporária</p>
        <h1>Não conseguimos abrir sua área pessoal.</h1>
        <p>Seus dados continuam seguros. Tente carregar a página novamente.</p>
        <button className="primary-link" onClick={reset} type="button">Tentar novamente</button>
      </div>
    </main>
  );
}
