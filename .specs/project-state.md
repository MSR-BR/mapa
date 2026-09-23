# Estado do projeto

## Blueprint

- Primário: APP v2.6.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change 091 em implementação: camada da aplicação e rollout protegido prontos;
  aplicativo LinkedIn, configuração Supabase e homologação real pendentes.
- Changes concluídas: 001–090 conforme `.specs/roadmap.md`.
- Change 092 planejada e bloqueada pela homologação completa da C91.
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
- `RESEARCH_STARTER_MAPA_API_KEY` permanece o nome canônico da credencial
  server-side do Research Starter.
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
- O alvo de autenticação é Google + LinkedIn OIDC. E-mail/senha só poderá ser
  retirado após a homologação do novo provedor e a prova de continuidade das
  contas existentes.
- “Retirar login por e-mail” significa retirar cadastro, entrada, recuperação e
  troca de senha. O endereço de e-mail permanece como identidade/contato e no
  vínculo entre Aluno e Orientador.
- Identidades com e-mails ausentes ou divergentes não podem ser fundidas
  automaticamente; a preservação de `user.id`, projetos e RLS é gate do corte.

## Estado validado mais recente

A camada da aplicação da C91 foi publicada atrás de flag desligada em
`v22092026.2`, deployment `dpl_BkrNPsVRQhYvTpcR2EmwcwGJZaaT`. O gate local
passou com 128 testes, build, segurança e smoke responsivo; produção confirmou
health 200, Google/senha preservados e LinkedIn oculto. O estado público do
Supabase confirmou Google/e-mail ativos e LinkedIn OIDC inativo; ativação e
matriz real de continuidade permanecem pendentes e a C92 continua bloqueada.

A C90 foi homologada na Vercel em 22/09/2026. O Mapa Rápido mostra o placeholder
exato solicitado no componente compartilhado da landing page e do dashboard,
sem alterar sugestões, seleção ou avanço. O deployment
`dpl_BBVx5u3EUhR8pJ5Dito77vaSV7R1` está READY no domínio canônico, versão
`v22092026.1`; health, bundle, smoke DOM desktop/móvel e logs passaram.

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
- C90: teste direcionado 55/55, build adicional, placeholder renderizado em
  desktop e viewport móvel de 390 px e texto antigo ausente.
- Commit funcional da C90: `40ae82f`.
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
- C91 depende da criação e liberação de aplicativo próprio no LinkedIn, dos
  segredos configurados somente no provedor/Supabase e da validação do callback.
  C92 permanece bloqueada até essa homologação e o tratamento de todas as contas
  que ainda dependam exclusivamente de senha.
