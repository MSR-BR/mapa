# Evidência de encerramento — Change 053

Data: 25/08/2026  
Versão auditada/publicada: `v25082026.5`

## Matriz de resultados

| Área | Resultado | Evidência |
| --- | --- | --- |
| Mapa Rápido | Aprovado | Testes automatizados e inspeção da home confirmam modo rápido recolhido, sugestões locais durante a digitação e entrada no fluxo de descoberta. |
| Mapa Avançado | Aprovado | Home publicada exibe os cinco campos obrigatórios, produto acadêmico e modo avançado recomendado. |
| Preservação do briefing | Aprovado | Testes de autenticação/fluxo cobrem o retorno após login e o E2E aluno–orientador concluiu o projeto sem perda do estado. |
| Descoberta e seis cards | Aprovado | `research-proposals:verify`: seis candidatos avançados, 20 referências, três sugestões rápidas e retry/diagnóstico no serviço. |
| Gemini | Aprovado | `npm run gemini:verify`: saída estruturada compatível com o schema 1.0.0. |
| Research Starter | Aprovado | `research-starter:verify`: resposta real `status=partial`, três referências, confiança média; o fluxo trata respostas parciais para revisão humana. |
| Dashboard | Aprovado | Smoke da home/rotas e testes de fundação confirmam identificação de projetos, retomada e separação dos estados. |
| Supabase/RLS | Aprovado | `supabase:verify`, `supabase:verify-rls`, RLS autenticado e `supabase:verify-advisor-student` passaram; E2E retornou `status: ok`, 8 revisões aprovadas e 3 referências. |
| Domínio canônico | Aprovado | Raiz retorna 200; hosts Vercel legados retornam 308 até `mapadapesquisa.com.br`; `www` permanece não publicado por decisão explícita da Change 038. |
| Callback de autenticação | Aprovado | `/dashboard` anônimo redireciona para `/login`; `/auth/callback` sem código real retorna para `/login?error=google`, sem abrir área protegida. |
| SEO | Aprovado | Home, `/home.html`, `robots.txt` e `sitemap.xml` retornam 200; canonical, sitemap e diretivas privadas foram confirmados. |
| PDF final | Aprovado | `npm run exports:verify` passou; PDF renderizado visualmente com capa, capítulos, referências, link clicável do app, registro CBL/ISBN e página final de produção. |
| Recuperação de senha | Aprovado | Rotas e callback estão presentes no build e o fluxo de autenticação continua protegido por destino interno. |
| Segurança | Aprovado | `npm run security:audit` passou nos 281 arquivos: segredos, env pública, RLS declarativo, API auth, XSS, headers, CSRF, CSP e privacidade. |
| Mobile/desktop/cache | Aprovado | Build de produção e smoke HTTP confirmam cabeçalhos de segurança, `no-store` nas superfícies dinâmicas e layout responsivo coberto pelos testes de fundação. |

## Verificações executadas

- `npm test` — 73 testes aprovados.
- `npm run lint` — aprovado.
- `npm run typecheck` — aprovado.
- `npm run exports:verify` — aprovado (`mapa-final-validation.pdf`, 8 páginas).
- `npm run build` — aprovado; as mensagens sobre Node 20 são avisos de compatibilidade futura do `@supabase/supabase-js`, não falhas.
- `npm run security:audit` — aprovado; a única ressalva estática é que a verificação remota depende de credenciais, coberta pelos smokes remotos abaixo.
- `npm run supabase:verify` — aprovado.
- `npm run supabase:verify-rls` — aprovado.
- RLS autenticado com as contas E2E — aprovado.
- `npm run supabase:verify-advisor-student` — aprovado.
- `npm run research-starter:verify` — aprovado com a credencial de desenvolvimento vigente.
- `npm run research-proposals:verify` — aprovado.
- `npm run gemini:verify` — aprovado.
- Smokes de produção: `/api/health`, home, `/home.html`, `robots.txt`, `sitemap.xml`, `/dashboard`, `/auth/callback` e redirects legados.

## Dependências externas documentadas

- A verificação `supabase:verify-migration-local` não pôde abrir o socket local do
  Docker (`permission denied`); a lista remota de migrations e a verificação
  autenticada equivalente passaram, portanto não há migration pendente indicada
  pelo ambiente remoto.
- `www.mapadapesquisa.com.br` não foi publicado deliberadamente na Change 038;
  o endereço canônico é o domínio raiz. Não é uma regressão desta auditoria.

## Resultado

Nenhum defeito de produto permaneceu reproduzível. A Change 053 está encerrada,
sem duplicar as implementações das Changes 042–049. O rodapé e a documentação
foram sincronizados com a tag/deployment `v25082026.5`.
