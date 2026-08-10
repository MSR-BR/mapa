import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PublicStartForm } from "@/modules/projects/public-start-form";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/dashboard?continue=1");

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
