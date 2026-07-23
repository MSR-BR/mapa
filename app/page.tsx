import { PublicStartForm } from "@/modules/projects/public-start-form";

export default function Home() {
  return (
    <main className="public-home">
      <section className="quick-start public-hero" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">MP</div>
        <p className="eyebrow">Mapa da Pesquisa</p>
        <h1 id="page-title">O que você quer desenvolver?</h1>
        <PublicStartForm />
      </section>
    </main>
  );
}
