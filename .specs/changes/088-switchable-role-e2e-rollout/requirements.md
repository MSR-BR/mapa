# Requisitos

- Substituir no E2E a expectativa de papel imutável por troca versionada.
- Usar duas contas de teste distintas; não alterar contas reais nem usar PII em logs.
- Fazer cada conta alternar entre Aluno e Orientador durante o cenário.
- Criar projetos próprios nas duas modalidades e nos dois perfis, confirmando
  que os projetos do Orientador são autônomos.
- Validar UI, Server Actions, APIs, Data API/RLS, e-mails e persistência após login.
- Simular duas abas com contexto divergente.
- Confirmar preservação de projetos, `authoring_role`, vínculos e regime de
  supervisão em todas as trocas.
- Verificar consentimento por modo e anti-auto-orientação.
- Executar suíte completa, exportação e integração de projeto próprio nos dois
  perfis, build e smokes de produção.
- Monitorar erros sanitizados após rollout e manter plano de roll-forward.
- Cumprir o gate `domain-dns-gate.md`: escolher DNS externo ou delegação à
  Vercel, verificar domínio/SSL/e-mail e manter o cutover DNS separado do rollout
  de autenticação/RLS.
- Não alterar registrar, nameservers ou zona DNS sem autorização explícita e
  inventário dos registros existentes.
- Atualizar roadmap, estado, runbook, evidências e aprendizado do Pó Mágico.
