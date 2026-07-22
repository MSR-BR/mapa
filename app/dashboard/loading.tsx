export default function DashboardLoading() {
  return (
    <main className="workspace-shell dashboard-home" aria-busy="true" aria-label="Carregando área pessoal">
      <section className="quick-start quick-start-skeleton">
        <span className="skeleton-line skeleton-kicker" />
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-line skeleton-summary" />
        <span className="skeleton-composer" />
      </section>
      <section className="recent-projects">
        <span className="skeleton-line skeleton-section-title" />
        <div className="project-grid">
          {[0, 1, 2].map((item) => <span className="skeleton-card" key={item} />)}
        </div>
      </section>
    </main>
  );
}
