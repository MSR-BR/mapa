# Plano de aplicação e rollback — C125 (NÃO EXECUTADO)

Este documento é um plano para revisão. **Não autoriza publicação nem SQL remoto.**
Será necessária autorização humana separada para o candidato exato e para cada
ambiente. Git está intencionalmente sujo, com C123/C124 e C125 locais.

## Antes de solicitar autorização de aplicação

1. Revisar `local-changes.patch` e `files.json`, escolher o conjunto exato de código
   a publicar e separar C123/C124. Não usar `git add .` ou publicar a árvore inteira
   implicitamente. Preparar commit/candidato somente quando autorizado.
2. Executar os gates completos do candidato (`security:gate`, `check` e
   `supabase:release-gate` mais verificadores desta Change). Reavaliar riscos abertos
   da auditoria; o PASS local não libera automaticamente produção.
3. Com autorização de leitura do destino, confirmar schema, ledger de migrations,
   ausência de drift em funções/policies/grants, campos Auth/Storage disponíveis e
   backup/restauração utilizável. Capturar definições/ACLs/policies anteriores e
   limites atuais do bucket em artefato restrito, sem tokens ou conteúdo acadêmico.
4. Obter contagens agregadas de vínculos de orientador existentes sem confirmação
   Google/e-mail correspondente. Não presumir que o endurecimento dos próximos
   vínculos corrige relacionamentos antigos; não removê-los sem decisão humana.
5. Validar em ambiente não produtivo autorizado o contrato PostgREST de INSERT
   limitado por coluna e o upload de PNG/JPEG/WebP permitido versus arquivo >5 MiB
   ou MIME proibido. PostgreSQL local testou apenas o catálogo Storage.
6. Confirmar compatibilidade de duplicação estudantil. O adaptador da aplicação
   pode preceder a migration (também funciona no schema anterior). Após a migration,
   versões antigas do servidor que copiam etapa avançada recebem recusa segura;
   não devem permanecer servindo duplicação.

## Candidato SQL e ordem

1. `20261022183455_c125_workflow_owner_guard.sql` — estado inicial, pareceres,
   DELETE e correção de NULL nas transições estudantis.
2. `20261022183456_c125_verified_google_advisor.sql` — duas RPCs e trigger de vínculo.
3. `20261022183508_c125_bug_report_intake_guard.sql` — colunas/RLS de INSERT e bucket.

Cada arquivo é transacional. Aplicar somente os três nomes/hashes aprovados,
com falha interrompendo a sequência; não editar migrations já aplicadas.
Nenhuma migração antiga, versão pública, chave, Auth setting ou contador de IA
faz parte desse candidato. Não gerar comando com credenciais neste documento.

## Verificação após uma futura aplicação autorizada

- Conferir ledger, ACLs/EXECUTE, RLS, triggers e metadata do bucket por catálogo.
- Fluxo sintético Aluno→pedido→Orientador→aprovação; revisão devolvida e reenvio.
- Recusar INSERT completed, DELETE direto e alteração de parecer pelo dono.
- Duplicar mapa estudantil: comparar textos/briefing/rascunhos antes e depois.
- Claim não confirmado = 0; confirmado Google = vínculo correto; convite de conta
  futura permanece pendente. Confirmar isolamento de outro usuário e de modo.
- Enviar relato mínimo e testar triagem/admin; validar os limites reais do upload.
- Registrar código/revisão/destino e respostas sanitizadas. Não usar dados privados
  nem APIs de IA pagas para esse smoke.

## Rollback

**Preferir correção à frente mantendo os bloqueios de segurança.** Não reabrir as
falhas somente para eliminar uma mensagem de erro.

- Se um arquivo falhar antes de COMMIT, sua transação reverte; confirmar catálogo
  e ledger antes de repetir. Uma falha na terceira migration não reverte as duas
  anteriores já confirmadas.
- Se houver regressão de aplicação, o adaptador de duplicação é compatível com
  o schema anterior. Não restaurar um servidor que copie etapas avançadas com
  C125 ativa sem bloquear temporariamente a duplicação ou preparar correção.
- Se uma reversão de banco for estritamente necessária, preparar **nova migration
  compensatória** a partir do snapshot do destino e pedir autorização separada:
  (a) remover os dois triggers/funções novos; (b) restaurar definições anteriores
  de enforce_student_advisor_workflow_progress, set_project_advisor e
  claim_pending_advisor_projects; (c) restaurar grants/policy DELETE de workflow
  e INSERT de bug_reports; (d) restaurar os valores efetivamente capturados do
  bucket, nunca presumir NULL. Não reaplicar C087/C104 inteiras: alterariam outros
  controles posteriores. Essa reversão reintroduz riscos SEC-01/03/05 e exige
  aceitação explícita e janela de exposição controlada.
- Não apagar projetos, workflows, pareceres, versões ou anexos para reverter DDL.
  Novas cópias reiniciadas não devem ganhar aprovação automaticamente no rollback.
- Reproduzir a compensação no PostgreSQL local/staging antes de autorizá-la.
  Nesta execução foi entregue e revisado o plano; **não foi executado rollback
  de produção nem criada uma compensação que reabra as falhas**.

## Revisão integrada de 22/10/2026 — correção posterior ao pacote original

A revisão conjunta C123–C126 reproduziu e corrigiu a perda do ramo C111 de
revalidação de etapa anterior na primeira migration C125. Testes antes/depois
confirmam preservação do texto/progresso e recusa de cinco pedidos inválidos.
A migration ainda NÃO foi aplicada nem commitada. Os hashes e o patch originais
desta pasta são históricos; para revisão do candidato atual, use
[parecer e manifesto integrados](../../handoffs/2026-10-22-integrated-review/REVIEW.md).
Não aplicar o antigo `local-changes.patch` como se fosse a versão revisada.
