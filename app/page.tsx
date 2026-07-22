export default function Home() {
  return (
    <main className="foundation-shell">
      <section className="foundation-card" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">MP</div>
        <p className="eyebrow">Mapa da Pesquisa</p>
        <h1 id="page-title">Fundação técnica pronta para evoluir</h1>
        <p className="summary">
          A base do projeto está configurada. As funcionalidades do MVP serão
          implementadas por etapas, conforme as especificações aprovadas.
        </p>
        <dl className="status-grid" aria-label="Estado da fundação">
          <div><dt>Fase atual</dt><dd>Change 001</dd></div>
          <div><dt>Aplicação</dt><dd>Operacional</dd></div>
          <div><dt>Próxima fase</dt><dd>Fundação do MVP</dd></div>
        </dl>
        <p className="notice">
          Nenhum dado acadêmico, referência ou integração externa está ativo nesta fase.
        </p>
      </section>
    </main>
  );
}
