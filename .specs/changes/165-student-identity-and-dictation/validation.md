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

## Pré-publicação — 29/10/2026

- A revisão `86a05096495f059162e6ac4ca1761a88651fe5f3` foi enviada à branch pública `codex/change-003-004` conforme autorização específica. A migration C165 foi aplicada no Supabase Mapa `aeaweherkrqmlqnxsmib` como uma transação. A releitura confirmou tabela, coluna, RLS, grants, triggers e registro da migration; o MD5 do SQL registrado coincide com o arquivo local (`7d0dcdf5a116b98c1f11c85343cc51c2`).
- O deployment de verificação dessa revisão (`dpl_9DaKB2bTN7DkbP4Ey3Z8926QU5E4`) ficou `READY` sem associação ao domínio principal. Health e `/mapa` responderam normalmente.
- A conferência do cabeçalho revelou `Permissions-Policy: microphone=()`, que nega o uso de microfone na página. A publicação no domínio principal foi interrompida para corrigir a política antes de liberar o ditado.
- Candidato local corrigido: `microphone=(self)` no cabeçalho global, preservando `camera=()` e `geolocation=()`. O navegador ainda exige permissão do usuário; somente a própria origem fica habilitada a solicitá-la. `npm run check` passou, com o aviso antigo de lint. O app compilado em `127.0.0.1:3100/mapa` respondeu HTTP 200 com o cabeçalho corrigido.
- O teste sintético de ditado anterior continua válido para a interface. Microfone físico e navegadores alvo ainda não foram testados. O candidato corrigido precisa de nova aprovação exata antes de push/deploy; a revisão anterior não foi promovida.

## Publicação verificada — 29/10/2026

- O usuário autorizou explicitamente a revisão corrigida `a1c6d9708fbb8e553a419088154d8bd7aa32ba25` e os destinos GitHub público `MSR-BR/mapa` (branch `codex/change-003-004`) e Vercel `mapadapesquisa` em produção. A migration C165 não foi repetida.
- O GitHub passou a apontar exatamente para esse commit. O deployment `dpl_2dfC1gSDKvihBxfSuxnsjNvJTHKB` ficou `READY`, foi conferido isoladamente (`/api/health` ok, `/mapa` HTTP 200 e `microphone=(self)`) e então promovido ao domínio principal.
- No domínio `mapadapesquisa.com.br`, `/api/health` respondeu `ok`, `/mapa` respondeu HTTP 200 com `Permissions-Policy: camera=(), geolocation=(), microphone=(self)` e o HTML contém o botão de ditado. O cadastro acadêmico sem login respondeu HTTP 307 para `/login`.
- O campo `version` do health continua `v22102026.1` porque a revisão C165 não altera esse identificador; para rastrear esta publicação, use o commit e o deployment acima. Microfone físico e navegadores alvo ainda dependem de conferência prática.

A migration aditiva já aplicada é compatível com o app anterior. O rollback do app consiste em restaurar o deployment anterior; a migration permanece para preservar os dados eventualmente inseridos.

PUBLICATION_STATE: PUBLISHED
REVIEW_CANDIDATE: revisão do app `a1c6d9708fbb8e553a419088154d8bd7aa32ba25`, incluindo `microphone=(self)`; a revisão anterior `86a0509` não foi promovida.
APPROVED_REVISION: `a1c6d9708fbb8e553a419088154d8bd7aa32ba25` para GitHub e Vercel; a migration C165 já tinha aprovação e foi aplicada antes.
APPROVED_DESTINATION: GitHub público `MSR-BR/mapa` branch `codex/change-003-004`, Supabase Mapa `aeaweherkrqmlqnxsmib` e Vercel `mapadapesquisa` em produção.
APPROVAL_EVIDENCE: respostas explícitas do usuário em 29/10/2026, “Sim, autorizo exatamente esta revisão e destinos” e “Sim, autorizo este commit e esses destinos”.
PUBLICATION_EVIDENCE: GitHub em `a1c6d97`, migration C165 registrada e conferida no Supabase, deployment `dpl_2dfC1gSDKvihBxfSuxnsjNvJTHKB` promovido, verificações públicas descritas acima.

Rota de correção: reaplicar a versão anterior no Vercel se o app falhar; a migration é aditiva e permanece, evitando perda dos dados já inseridos. Uma remoção posterior da tabela/coluna exigiria migration separada e descarte explícito desses dados. Próxima Change canônica: NONE — ciclo C165 concluído localmente, aguardando decisão de publicação.
