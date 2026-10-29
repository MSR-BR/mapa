# Validação local — 29/10/2026

- `npm run typecheck`, `npm run lint`, `npm run build`: aprovados (lint com aviso preexistente em `tests/foundation.test.mjs`).
- `npm test`: aprovado, incluindo validação do cadastro e concatenação/limite do ditado.
- `npm run supabase:verify-explicit-grants`: aprovado.
- `sh scripts/verify-explicit-grants-local.sh`: PostgreSQL 17 isolado aprovado. Verificou criação e atualização do nome no projeto, leitura do nome pelo orientador vinculado e negação de leitura dos demais dados acadêmicos pelo orientador ou por outro estudante.
- Playwright local `/mapa` com `SpeechRecognition` simulado: ditado acrescentou texto ao mapa rápido; no avançado não ultrapassou 400 caracteres. Nenhum serviço de transcrição ou IA foi chamado nesses testes.
- Não houve migration remota, commit, push ou deploy nesta Change até este registro.

Publicação exige aplicar a migration C165 antes do app, porque a nova consulta do dashboard e a página do cadastro dependem da tabela. Conferir versões, backup/rollback e comportamento real de microfone no navegador alvo antes da liberação geral.

PUBLICATION_STATE: APPROVAL_PENDING
REVIEW_CANDIDATE: commit local C165, migration `20261029120000_c165_student_academic_profile.sql`, aplicação e testes descritos acima.
APPROVED_REVISION: pendente
APPROVED_DESTINATION: pendente; proposta Supabase `aeaweherkrqmlqnxsmib` e Vercel `mapadapesquisa` em produção pública.
APPROVAL_EVIDENCE: pendente
PUBLICATION_EVIDENCE: pendente

Rota de correção: reaplicar a versão anterior no Vercel se o app falhar; a migration é aditiva e permanece, evitando perda dos dados já inseridos. Uma remoção posterior da tabela/coluna exigiria migration separada e descarte explícito desses dados. Próxima Change canônica: NONE — ciclo C165 concluído localmente, aguardando decisão de publicação.
