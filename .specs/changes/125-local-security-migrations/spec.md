# C125 — Ordem 4: segurança do banco, validada somente localmente

- Autorização: pedido humano de 22/10/2026 para Ordem 4; somente PostgreSQL local,
  sem commit/push/deploy e sem mutações em Ads, GA4 ou Supabase remoto.
- Base Git: `7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`; C123/C124 locais preservadas.
- Estado: `IMPLEMENTED_LOCAL`, `NEEDS_REVIEW`, `PUBLICATION_STATE: NOT_REQUESTED`.
- Classe: APP / DATA / SECURITY, S3. Modelo: Codex/GPT-6, variante/esforço não
  expostos. Sem subagentes.

## Escopo implementado

1. **SEC-03**: nova migration rejeita INSERT estudantil fora de `draft_prompt`,
   `activeStep` não nulo e pareceres iniciais. Revoga DELETE do workflow e remove
   sua policy; exclusão do projeto-pai continua em cascata. O dono não pode
   apagar, reordenar, aprovar ou modificar pareceres existentes. Reenvio mantém
   o parecer devolvido e acrescenta pedido pendente. Campos ausentes não podem
   passar por expressões SQL que avaliem NULL. Gatilhos anteriores do orientador
   e congelamento da submissão pendente continuam ativos.
2. **SEC-05**: INSERT em bug_reports limitado às colunas usadas pela rota;
   status/prioridade/notas/resolução são controlados por defaults e RLS. Mantém
   triagem por UPDATE autorizado. Bucket privado com 5 MiB e PNG/JPEG/WebP.
3. **SEC-01**: RPCs usam `auth.users.email_confirmed_at` e identidade Google em
   `auth.identities` cujo e-mail corresponde ao e-mail da conta. Não usam
   user_metadata. Destinatário ainda não elegível permanece como convite
   pendente; claim retorna zero. Solicitante não confirmado não vincula.
   Trigger adicional impede contornar a RPC por INSERT direto de advisor_id.
4. **Compatibilidade**: duplicar projeto estudantil preserva conteúdo acadêmico,
   briefing e rascunhos, mas reinicia estado/aprovação da cópia. Projeto autônomo
   do orientador mantém a progressão anterior. Não reescreve mapas existentes.

## Arquivos centrais

- `supabase/migrations/20261022183455_c125_workflow_owner_guard.sql`
- `supabase/migrations/20261022183456_c125_verified_google_advisor.sql`
- `supabase/migrations/20261022183508_c125_bug_report_intake_guard.sql`
- `scripts/verify-c125-security-local.sh`, `verify-c125-security.sql` e
  `verify-c125-security-seed.sql`.
- `modules/research-workflow/clone.ts`, `storage.ts` e
  `modules/projects/actions.ts`: ajuste mínimo da duplicação.
- Manifesto de acesso e verificadores existentes atualizados para o novo estado.

As migrations foram criadas pelo CLI Supabase 2.115.0 (`migration new`,
`DO_NOT_TRACK=1`), sem comandos de conexão/aplicação remota. Nenhuma migration
anterior foi editada. A tentativa inicial do CLI sem DO_NOT_TRACK foi impedida
pelo sandbox ao gravar telemetria local; não envolveu credenciais de projeto.

## Critérios e evidências

[Validação](validation-2026-10-22.md), [plano de aplicação/rollback](application-plan.md),
[diff incremental](local-changes.patch) e hashes em `files.json`.
O diff parte da árvore com C123/C124, não apenas do HEAD, para separar esta Ordem.

Pó Mágico: v20261020.002, local/remoto `81e3cbef9fc2b5b29074297490351f681ed16b47`
confirmados em 22/10 após nova tentativa de rede. Checkpoints
start/classification/phase/Change/delivery. Delta adotado: demonstrar antes/depois
em banco real descartável e separar SQL verificado de serviços Auth/Storage não
executados. Archive central inalterado. Skills: Pó Mágico, Supabase, boas práticas
PostgreSQL e critérios locais de auditoria de segurança.

## Revisão integrada de 22/10/2026 — correção posterior ao pacote original

A revisão conjunta C123–C126 reproduziu e corrigiu a perda do ramo C111 de
revalidação de etapa anterior na primeira migration C125. Testes antes/depois
confirmam preservação do texto/progresso e recusa de cinco pedidos inválidos.
A migration ainda NÃO foi aplicada nem commitada. Os hashes e o patch originais
desta pasta são históricos; para revisão do candidato atual, use
[parecer e manifesto integrados](../../handoffs/2026-10-22-integrated-review/REVIEW.md).
Não aplicar o antigo `local-changes.patch` como se fosse a versão revisada.
