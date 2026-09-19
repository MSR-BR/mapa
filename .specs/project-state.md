# Estado do projeto

## Blueprint

- Primário: APP v2.3.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: 089 — implementação local aprovada; rollout pendente.
- Changes concluídas: 001–088 conforme `.specs/roadmap.md`.
- A C89 exige orientador e aprovação para todo avanço de projeto criado como
  Aluno, preservando rascunhos e a autonomia dos projetos de Orientador.
- A conta alternável, as bibliotecas por modo, a revisão vinculada, PDF/DOCX e
  o rollout da C88 permanecem homologados em produção.

## Decisões-chave

- Aplicação Next.js publicada na Vercel em `https://mapadapesquisa.com.br`.
- Em 16/09/2026, o domínio raiz respondia HTTP 200/HTTPS na Vercel e o A
  apontava para `76.76.21.21`, enquanto os nameservers permaneciam externos em
  `d.sec.dns.br` e `e.sec.dns.br`.
- DNS externo funcional é aceito. Delegar para a Vercel é opcional, exige
  autorização explícita, preservação integral da zona/e-mail e janela separada
  das migrations/RLS; o gate pertence à C88.
- Supabase é responsável por banco e autenticação; RLS protege os dados.
- Gemini e Research Starter são acessados somente pelo backend.
- `RESEARCH_STARTER_MAPA_API_KEY` é o único nome aceito para a credencial do
  Research Starter e permanece restrito ao backend de Production.
- Em produção, a mesma conta pode alternar o modo ativo entre Aluno e Orientador
  nas configurações; a troca não altera a autoria dos projetos existentes.
- O estado-alvo aprovado permite escolher Aluno ou Orientador na mesma conta;
  banco, servidor, interface e RLS aplicam o mesmo modo.
- O modo ativo é persistido no banco, versionado e trocado apenas por RPC; JWT,
  metadata e armazenamento local não são fontes de autorização.
- Ambos os perfis criam projetos Rápidos/Avançados e mantêm sua biblioteca
  própria: projetos de Aluno exigem orientador e aprovação para avançar, mas
  podem ser criados e salvos como rascunho antes do vínculo; projetos de
  Orientador são autônomos. O Orientador também recebe uma fila separada de
  projetos estudantis vinculados para revisão.
- Cada projeto tem `authoring_role` imutável; trocar o modo nunca altera
  autoria, propriedade, supervisão, vínculo ou conteúdo.
- Avisos acadêmicos orientam sem bloquear; integridade técnica continua
  obrigatória.
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.

## Estado validado mais recente

A C88 fechou o ciclo C83–C88 com E2E remoto de duas contas, troca
Aluno→Orientador→Aluno, persistência, conflito de versão, RLS direta,
bibliotecas por autoria, supervisão, projeto autônomo de Orientador, exportações
PDF/DOCX e cleanup. `npm run check` concluiu 119/119 testes e build Next.js
16.3.5; scanner de segurança e auditoria npm foram aprovados.

O deployment `dpl_FRVTWXQUpRtJBbUEotEmWV9TEtjp`, commit funcional
`c8bdc4e`, está READY em `https://mapadapesquisa.com.br` com versão
`v17092026.1`. O health está ok, Gemini/Research Starter/Supabase/Resend estão
configurados, o smoke autenticado do Research Starter retornou três referências
e não houve erro novo nos logs consultados.

A estratégia de domínio é manter DNS externo: NS e MX foram preservados, o
domínio raiz continua em HTTPS/HSTS na Vercel e `www` permanece
deliberadamente ausente. Nenhuma mudança DNS ou teste de e-mail foi necessário
nesta janela.

## Implementação local mais recente

A C89 passou em lint, tipos, 123 testes, exportações, build, auditoria de
segurança e PostgreSQL 17 isolado. A migration aditiva e o código estão prontos,
mas ainda não foram aplicados/publicados em produção. A versão pública continua
`v17092026.1` até autorização do rollout.

## Questões em aberto

- Autorizar a migration remota e o deploy da C89; depois executar E2E
  aluno–orientador, health, logs, CPD e evolução do Pó Mágico.
- SPF e DMARC não apareceram no preflight somente leitura. Qualquer reforço de
  autenticação de e-mail exige inventário da zona, autorização e Change
  específica; não faz parte do rollout encerrado.
