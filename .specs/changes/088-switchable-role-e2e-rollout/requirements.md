# Requisitos

- Substituir no E2E a expectativa de papel imutável por troca versionada.
- Usar duas contas de teste distintas; não alterar contas reais nem usar PII em logs.
- Fazer cada conta alternar entre Aluno e Orientador durante o cenário.
- Validar UI, Server Actions, APIs, Data API/RLS, e-mails e persistência após login.
- Simular duas abas com contexto divergente.
- Confirmar preservação de projetos e vínculos em todas as trocas.
- Verificar consentimento por modo e anti-auto-orientação.
- Executar suíte completa, exportação, integrações, build e smokes de produção.
- Monitorar erros sanitizados após rollout e manter plano de roll-forward.
- Atualizar roadmap, estado, runbook, evidências e aprendizado do Pó Mágico.
