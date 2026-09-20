# Estado do projeto

## Blueprint

- Primário: APP v2.5.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma; Change 089 concluída em 19/09/2026.
- Changes concluídas: 001–089 conforme `.specs/roadmap.md`.
- Projetos criados no modo Aluno podem ser editados e salvos como rascunho,
  mas só avançam após informar o e-mail e receber a aprovação do Orientador.
- Projetos criados no modo Orientador permanecem autônomos, sem supervisor
  externo.
- Troca de perfil, bibliotecas por autoria, revisão vinculada e exportações
  PDF/DOCX permanecem homologadas em produção.

## Decisões-chave

- Aplicação Next.js publicada na Vercel em `https://mapadapesquisa.com.br`.
- Supabase é responsável por banco e autenticação; RLS e triggers protegem os
  dados e as transições críticas.
- Gemini e Research Starter são acessados somente pelo backend.
- Em produção, a mesma conta pode alternar o modo ativo entre Aluno e Orientador
  nas configurações; a troca não altera a autoria dos projetos existentes.
- O modo ativo é persistido no banco, versionado e trocado apenas por RPC; JWT,
  metadata e armazenamento local não são fontes de autorização.
- Cada projeto tem `authoring_role` imutável. Identidade, modo ativo, autoria e
  vínculo de supervisão são dimensões separadas.
- Ambos os perfis criam projetos Rápidos/Avançados e mantêm sua biblioteca
  própria. Projetos de Aluno exigem aprovação do Orientador para cada avanço;
  projetos de Orientador são autônomos.
- Avisos acadêmicos orientam sem bloquear; integridade técnica, autorização e
  aprovação humana continuam obrigatórias.
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.
- DNS externo funcional permanece aceito. Qualquer delegação ou alteração de
  e-mail/DNS exige Change e autorização próprias.

## Estado validado mais recente

A C89 foi homologada no Supabase e na Vercel. A migration
`20260919123000_c089_require_student_advisor_approval.sql` instalou a função e
o trigger de proteção; consultas antes/depois confirmaram `false/false` e
`true/true`.

O E2E remoto com duas contas confirmou recusa de avanço sem orientador sem
alterar o workflow, vínculo, leitura supervisionada, bloqueio de edição pelo
Orientador, comentário/correção, sete aprovações, conclusão do mapa, referências,
PDF/DOCX, troca e persistência dos modos, isolamento e cleanup. As matrizes RLS
consciente do modo, autenticada e anônima também passaram.

O deployment `dpl_DHKUXF8BMmtdBjd2tTDQ5SFZRYYe` está READY e aliasado a
`https://mapadapesquisa.com.br`, versão `v19092026.1`. Health retornou
`status=ok` com Supabase, Gemini, Research Starter e Resend configurados.
Research Starter retornou HTTP 200 e três referências; Gemini 3.6 Flash entregou
schema estruturado válido. Não foram encontrados erros nem HTTP 500 nos logs
pós-rollout.

O smoke autenticado no Safari confirmou o perfil Aluno e identificou uma cópia
residual que ainda dizia “supervisão opcional”. A mensagem foi corrigida para
“supervisão obrigatória para avançar”, coberta por teste e republicada no
deployment final.

## Validação local mais recente

- `npm run check`: lint, tipos, 123/123 testes, PDF/DOCX e build Next.js
  16.3.5 aprovados.
- PostgreSQL 17 isolado: rascunho permitido, bypass do Aluno negado, revisão
  pendente válida, aprovação do Orientador válida e projeto de Orientador
  autônomo.
- Scanner de segurança e auditoria offline de dependências aprovados.
- Commits funcionais: `96a8777`, `3366d8c` e `9ce3d5f`.

## Questões em aberto

- A credencial atual da CLI Supabase nesta estação recebe HTTP 403 para operações
  de organização. A C89 foi aplicada e verificada pelo SQL Editor autenticado do
  projeto correto. Antes de uma próxima migration, regularizar o acesso da CLI
  ou repetir o fluxo autorizado com conferência integral do artefato.
- SPF e DMARC não apareceram no preflight somente leitura. Qualquer reforço de
  autenticação de e-mail exige inventário da zona, autorização e Change
  específica.
