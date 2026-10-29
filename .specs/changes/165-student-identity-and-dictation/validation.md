# Validação local — 29/10/2026

- `npm run typecheck`, `npm run lint`, `npm run build`: aprovados (lint com aviso preexistente em `tests/foundation.test.mjs`).
- `npm test`: aprovado, incluindo validação do cadastro e concatenação/limite do ditado.
- `npm run supabase:verify-explicit-grants`: aprovado.
- `sh scripts/verify-explicit-grants-local.sh`: PostgreSQL 17 isolado aprovado. Verificou criação e atualização do nome no projeto, leitura do nome pelo orientador vinculado e negação de leitura dos demais dados acadêmicos pelo orientador ou por outro estudante.
- Playwright local `/mapa` com `SpeechRecognition` simulado: ditado acrescentou texto ao mapa rápido; no avançado não ultrapassou 400 caracteres. Nenhum serviço de transcrição ou IA foi chamado nesses testes.
- Na validação inicial, não houve migration remota, push ou deploy. A implementação inicial foi registrada localmente no commit `eb2c1de`.

## Refinamento local — 29/10/2026

- Commit funcional local `d6a8cab`: ditado também em campos curtos de título, inserção na posição do cursor, preservação do conteúdo e limite; estados de erro/microfone e campo bloqueado revisados.
- Formulário acadêmico preserva todos os dados preenchidos se o servidor rejeitar o salvamento. Falha na consulta mostra indisponibilidade, sem afirmar incorretamente que o cadastro está vazio.
- `npm run check` aprovado: lint, tipos, grants, testes, paridade de exportações e build. Lint mantém o aviso preexistente de variável não usada em `tests/foundation.test.mjs`.
- `npm run security:audit`: `PASS_WITH_ACCEPTED_RISK`, com avisos gerais preexistentes sobre rate limit por instância, varredura de anexos e verificação remota.
- `sh scripts/verify-explicit-grants-local.sh`: PostgreSQL 17 isolado aprovado; testes adicionais confirmam leitura do próprio perfil, negação de leitura/escrita por outra conta e impossibilidade de alterar diretamente o nome do projeto.
- `scripts/verify-c165-ui.mjs`: Chrome local com `SpeechRecognition` simulado, requisições externas interceptadas; passou em `textarea`, `input`, cursor, limite, campo bloqueado e preservação do formulário após erro. Não testa microfone físico nem disponibilidade do serviço do navegador.
- Nenhuma migration remota, push, deploy, chamada paga, alteração de Ads ou GA4 neste refinamento.

Publicação exige aplicar a migration C165 antes do app, porque a nova consulta do dashboard e a página do cadastro dependem da tabela. Conferir versões, backup/rollback e comportamento real de microfone no navegador alvo antes da liberação geral.

PUBLICATION_STATE: APPROVAL_PENDING
REVIEW_CANDIDATE: commits locais `eb2c1de` e `d6a8cab` mais o fechamento documental C165; migration `20261029120000_c165_student_academic_profile.sql`. O SHA final deve ser conferido antes de qualquer publicação.
APPROVED_REVISION: pendente
APPROVED_DESTINATION: pendente; proposta Supabase `aeaweherkrqmlqnxsmib` e Vercel `mapadapesquisa` em produção pública.
APPROVAL_EVIDENCE: pendente
PUBLICATION_EVIDENCE: pendente

Rota de correção: reaplicar a versão anterior no Vercel se o app falhar; a migration é aditiva e permanece, evitando perda dos dados já inseridos. Uma remoção posterior da tabela/coluna exigiria migration separada e descarte explícito desses dados. Próxima Change canônica: NONE — ciclo C165 concluído localmente, aguardando decisão de publicação.
