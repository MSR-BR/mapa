# Change 096 — Auditoria transversal de SEO, indexação e GA4

Status: concluída em 23/09/2026

## Objetivo

Auditar, sem alterar o comportamento publicado, a descoberta orgânica e a mensuração do Mapa da Pesquisa: SEO técnico, URLs canônicas, indexação, Search Console, desempenho, GA4, atribuição, consentimento e prontidão futura para Google Ads.

## Escopo executado

- inspeção do repositório Next.js, metadados, robots, sitemap, dados estruturados, cartões sociais e analytics;
- verificação HTTP/DNS do domínio canônico e das rotas públicas, privadas e legadas;
- auditoria somente leitura da propriedade GA4 550650234 e do stream 15460310071;
- tentativa somente leitura das propriedades Search Console de domínio e prefixo de URL;
- Lighthouse mobile da raiz e da landing em home.html;
- pesquisa em documentação oficial atual do Google Search, GA4 e Consent Mode;
- criação da skill pessoal digital-discovery-audit;
- evolução do Pó Mágico com o blueprint transversal Digital Discovery & Growth v1.0;
- criação das Changes planejadas 097–100.

## Fora do escopo

- modificar código funcional, deploy, DNS, Search Console, GA4, consentimento ou Google Ads;
- criar propriedade Search Console ou vínculo externo;
- marcar eventos principais;
- corrigir canonicals, eventos, filtros ou desempenho;
- iniciar campanha ou comprometer orçamento.

## Fontes de evidência

- repositório e histórico das Changes 027, 054 e 081;
- respostas públicas de mapadapesquisa.com.br em 23/09/2026;
- GA4 autenticado em modo somente leitura;
- DNS público;
- Lighthouse local com Chrome;
- documentação oficial do Google referenciada em audit-report.md.

## Critérios de aceite

1. Pontos fortes e problemas são separados por severidade e evidência.
2. Configuração de código não é confundida com estado real da propriedade GA4/Search Console.
3. A integridade da atribuição e dos eventos principais é avaliada antes de qualquer proposta de mídia paga.
4. As correções são decompostas em Changes ordenadas, com Google Ads bloqueado pelos gates anteriores.
5. A skill e o blueprint transversal são criados e validados.
6. Nenhuma configuração de produção é alterada.

## Modelo recomendado para execução futura

gpt-5.6-sol com raciocínio xhigh para C097, C099 e C100; C098 pode usar o mesmo modelo em high ou xhigh porque envolve propriedade Google, domínio e validação externa.
