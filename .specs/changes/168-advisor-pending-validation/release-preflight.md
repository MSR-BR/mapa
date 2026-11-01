# C168 — Preparação de CPD — 01/11/2026

Autorização explícita: usuário pediu “cpd limpo” após entrega local da C168. Destino: produção https://mapadapesquisa.com.br, projeto prj_uz62Dh56BHDeHozBfrAACFFZ5mUS, equipe team_jQuUBnU7RDJh0O3XASyu1WeS. CLI confirmou identidade; conector Vercel devolveu 404 para o mesmo alvo, então usada CLI autenticada existente.

Rollback anterior: dpl_JBHo7ujwstBAzA2hr2jpY4whde8A. Sem migrations ou novos serviços. Build candidato será staged production, seguido de smoke e promoção do mesmo deployment.

## Correção necessária no gate

A auditoria atual encontrou duas dependências de produção com severidade alta, anteriores à C168. Correção compatível restrita a zod 4.4.3 → 4.6.7 e undici transitivo 6.29.0 → 6.29.1. Lockfile não alterou outras versões. Revalidar testes, exportações e build após a correção. Não foi aplicado npm audit fix --force.

Fontes:
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- https://github.com/advisories/GHSA-2m5v-pch6-74hx

## Limites

Rascunhos científicos e de divulgação preexistentes ficam fora do candidato de aplicativo. Não gerar IA paga, não usar conteúdo privado de projetos nos smokes. Teste de UI sintético é distinto de uso autenticado real.

Regressão detectada e corrigida: Zod corrigido mede pontos de código, enquanto HTML maxLength usa UTF-16. Adicionada restrição regex explícita nos limites compartilhados de campos e na entrada Avançada para preservar o contrato anterior; teste C118 de emojis voltou a passar. Sem relaxar testes ou limites.
