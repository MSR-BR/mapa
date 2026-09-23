# Evidências de implementação — Change 093

**Status:** concluída em 22/09/2026.

## Diagnóstico e correção

- A credencial anterior da CLI era válida, mas pertencia a organizações que não
  continham o projeto `aeaweherkrqmlqnxsmib`; por isso a operação do Mapa
  recebia 403/não encontrava o projeto.
- Um novo login oficial foi concluído no Safari para a conta administradora do
  Mapa. Nenhum token foi impresso, versionado ou salvo em arquivo do projeto.
- A CLI 2.117.0 foi testada e apresentou regressão ao gravar/ler a credencial no
  Chaves do macOS neste ambiente. O projeto foi restaurado à versão 2.115.0,
  sem deixar alteração transitiva no lockfile.
- `supabase projects list` passou e mostrou `mapa-da-pesquisa` como
  `linked=true` e `ACTIVE_HEALTHY`.
- `supabase orgs list` passou para a organização correta, sem HTTP 403.

## Migrations

- A listagem encontrou a migration local
  `20260919123000_c089_require_student_advisor_approval.sql` sem entrada no
  histórico remoto.
- Consulta remota confirmou antes do reparo:
  `function_exists=true`, `trigger_enabled=true` e
  `security_definer=true`.
- Como o SQL já estava aplicado e homologado, somente o histórico foi reparado
  com status `applied`; nenhum SQL de schema foi reaplicado.

## Advisors

- Segurança: três avisos para RPCs `SECURITY DEFINER` executáveis por
  `authenticated`. A execução é intencional e os corpos validam `auth.uid()`,
  modo ativo, autoria/vínculo, concorrência e idempotência.
- O aviso de proteção contra senhas vazadas não se aplica ao login público
  atual, que é exclusivamente Google e mantém o provedor Email desativado.
- Desempenho: três avisos de policies permissivas paralelas para acesso próprio
  e supervisionado. A separação é intencional e preserva a matriz de RLS já
  homologada; nenhuma consolidação de policy foi feita nesta Change.
