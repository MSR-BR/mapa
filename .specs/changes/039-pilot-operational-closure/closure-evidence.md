# Evidências de encerramento — Change 039

Data da execução: 21/08/2026.

## CPD técnico

- `npm run security:audit` — aprovado; nenhum segredo rastreado, variáveis
  públicas sem credenciais, RLS, autenticação, CSP, CSRF e headers aprovados.
- `npm run supabase:verify` — aprovado para o projeto
  `aeaweherkrqmlqnxsmib`.
- `npm run supabase:verify-rls` — aprovado; acesso anônimo negado.
- `npm run supabase:verify-authenticated-rls` — aprovado usando as contas E2E
  de estudante e orientador; isolamento de projetos e workflows confirmado.
- `npm run supabase:verify-advisor-student` — aprovado; login, perfis, vínculo,
  leitura supervisionada, correção, aprovações, mapa final e referências
  verificados em projeto temporário, removido ao final.
- `npm run research-starter:verify` — aprovado; status parcial, 3 referências,
  confiança média.
- `npm run gemini:verify` — aprovado; saída estruturada compatível com o schema
  1.0.0.
- `npm run exports:verify` — aprovado; PDF gerado com 14.682 bytes.
- `npm run check` — aprovado; lint, typecheck, 61 testes, exportação e build.

## Produção e serviços externos

- Migrations remotas listadas até `20260819100000` no projeto Supabase.
- `https://mapadapesquisa.com.br/` — `HTTP 200`.
- `https://mapadapesquisa.com.br/api/health` — `HTTP 200` com CSP, HSTS,
  `X-Frame-Options`, `nosniff` e `Referrer-Policy`.
- `robots.txt` e `sitemap.xml` — `HTTP 200`, com domínio raiz canônico e
  `/home.html` indexável.
- `https://mapadapesquisa.vercel.app/` — `HTTP 308` para o domínio raiz.
- Vercel: deployment Ready `dpl_Ad18s4KuZXyaAucG7Rdtp7Ci8EBP`; domínio
  `mapadapesquisa.com.br` associado ao projeto `mapadapesquisa`.
- Resend Receiving, webhook e encaminhamento institucional permanecem
  documentados e verificados na C034.

## Pendências e decisões

- Docker Desktop iniciado e `npm run supabase:verify-migration-local` aprovado:
  três tabelas, doze políticas e quatro índices confirmados em PostgreSQL vazio.
- Advisors MCP Supabase: o conector retornou `permission denied`; a mesma
  análise foi executada pela CLI autenticada após a migration de grants. Os
  avisos de RPC autenticado são intencionais e não há execução anônima.
- Supabase Free: a proteção contra senhas vazadas é um recurso pago e foi
  retirada do escopo do piloto; não constitui pendência.
- C037: o professor responsável da UFF confirmou a autorização de uso dos
  textos, créditos, dados biográficos e identificação visual; não há documento
  institucional adicional a anexar.
- Git: árvore limpa; a tag anotada `v21082026.1` foi
  criada e aponta para esse commit.

Conclusão: o piloto está operacional para uso controlado, com a versão pública
`v21082026.1`, commit limpo e tag anotada correspondentes. A Change 039 está
concluída.
