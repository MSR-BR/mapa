# Change 027 — SEO, landing page e indexação pública

## Objetivo

Alinhar a presença pública do Mapa da Pesquisa às novas entradas estruturadas e aos seis tipos de produto acadêmico.

## Escopo

- Metadados da aplicação e da home pública com descrição, palavras-chave, canonical, Open Graph e Twitter card.
- Landing page `/home.html` com linguagem de situação-problema, cinco perguntas e seleção de produto.
- Seção pública dos seis níveis de pesquisa.
- JSON-LD com `SoftwareApplication`, `Organization`, `WebSite` e `FAQPage`.
- Sitemap com URLs canônicas e data de atualização.
- README alinhado à jornada atual.

## Critérios de aceitação

1. A home e a landing não descrevem mais um prompt genérico como única entrada.
2. Os seis produtos aparecem em texto rastreável e acessível.
3. Os dados estruturados descrevem a aplicação, o site e perguntas frequentes coerentes com o conteúdo visível.
4. Robots continua bloqueando áreas autenticadas e permitindo apenas as páginas públicas.
5. Build, lint, typecheck e testes passam.
