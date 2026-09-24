# Requisitos

- Confirmar organização, projeto e ref antes de qualquer ação privilegiada.
- Vincular a leitura inicial às 18 migrations no commit `cee54c7` e o candidato
  corretivo às 19 migrations após o gate local.
- Comparar o histórico remoto de migrations com o histórico local.
- Confirmar que `private` não integra a superfície da Data API.
- Verificar grants efetivos, RLS, policies, funções e privilégios padrão.
- Classificar o Security Advisor: erros bloqueiam; warnings exigem justificativa.
- Provar negação anônima e isolamento entre contas sem reativar Email/senha.
- Usar fixtures reversíveis; restaurar papéis e excluir registros temporários.
- Não alterar Vercel, DNS, Auth providers, chaves, usuários reais ou dados reais.
- Não criar nem aplicar migration redundante.
