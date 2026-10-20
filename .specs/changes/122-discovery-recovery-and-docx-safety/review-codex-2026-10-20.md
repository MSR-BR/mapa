# C122 — revisão Codex e validação da Ordem 1

Data: 20/10/2026. Base: `f096d9f027e1bbe3fc62fe4fcecf87c76cb1d6de`, branch `codex/change-003-004`.

## Escopo e autoridade

Revisados os quatro arquivos modificados e cinco novos descritos na spec. Nenhuma lógica da implementação do Claude foi alterada nesta revisão; apenas documentação foi acrescentada. A Ordem 1 autoriza commit local e pacote de publicação. A frase de autorização de push/deploy permanece um placeholder no arquivo recebido; não há autorização preenchida para publicar um SHA.

As Ordens 2–5 não foram iniciadas. Preservados os arquivos de auditoria e handoffs preexistentes, sem incorporá-los automaticamente ao commit. Sem leitura de valores de chaves/tokens/cookies, chamadas pagas, alterações de Ads/GA4/Supabase remoto, dependências, ambiente ou modelo.

## Revisão do comportamento

- **DSC-01:** a retomada exige `discovering` com `updatedAt` válido e mais de 150 segundos; a escrita continua condicionada a dono, revisão e estado. A finalização mantém a revisão da reserva, evitando sobrescrever uma versão posterior. Data inválida/futura e reserva recente não autorizam retomada. O TTL é maior que `maxDuration=120` declarado na rota; isso não substitui uma prova de comportamento da plataforma.
- **DSC-02:** falhas HTTP/autorização/rede deixam de ser atribuídas genericamente ao provedor; códigos conhecidos recebem a classificação declarada. Falha após a geração, durante gravação, passa a ter etapa `saving`. O tratamento amplo de erros de persistência/PGRST303 permanece na Ordem 3, não foi resolvido por esta Change.
- **JR-05:** escolher um card altera o objeto, mas mantém `reportId` e contagem de referências, deixando de reexecutar o efeito por mera troca de identidade do objeto. Isso não prova deduplicação global entre remontagens, navegação ou mudanças de perfil. Não houve novo teste de componente em navegador nesta rodada.
- **EX-04:** os dois geradores DOCX recebem cópia do input sem controles proibidos abaixo de U+0020, preservando tab/LF/CR e Date. Texto persistido e gerador PDF não foram alterados. O teste cobre controles, não todos os possíveis problemas Unicode/XML nem abertura em todos os editores Word.
- A alteração do `package.json` acrescenta somente testes; dependências e lockfile permanecem iguais.

Não foi identificado defeito novo reproduzido que justificasse modificar a lógica da C122 nesta revisão.

## Reprodução independente

O harness de descoberta foi executado contra a rota de HEAD exportada para `tmp/`, sem alterar arquivos de produção:

```text
HEAD: reserva com 60 min → HTTP409, estado discovering.
C122: mesma reserva → HTTP200, choosing_problem, seis propostas.
Reserva recente → HTTP409, zero escritas.
Duas retomadas concorrentes → HTTP200/409, somente uma execução vencedora.
Falha simulada de gravação → HTTP502, etapa saving, estado failed.
Chamadas externas/pagas do harness: zero.
```

A fixture dessa reprodução usa modo sem briefing avançado; `preservedBriefing:false` nesse caso não demonstra perda de briefing. A preservação do briefing avançado é coberta pelo harness C120 executado em `test:research-starter`.

Não endossamos a frase da auditoria de que intervalos agregados de até aproximadamente dois minutos seriam incompatíveis com timeout de 105 segundos. Resolução em minutos e ausência de correlação por tentativa não excluem esse timeout. A causa dos eventos históricos permanece não confirmada.

## Comandos executados nesta revisão

| Comando | Resultado real |
|---|---|
| `npm run check` | Exit 1 somente no build Turbopack, por `binding to a port / Operation not permitted`. Lint, tipos, grants, testes e exportações anteriores passaram. |
| Testes dentro de `check` | 196 + 13 + 38 = **247 aprovados**, zero falhas. Um aviso de lint preexistente. |
| `npm run build` com escalonamento de sandbox | Mesmo bloqueio de porta do compilador; não foi falha de regra de negócio nem sucesso de build. |
| `npm run build -- --webpack` | **Exit 0**, build local completo. Não alterado o script padrão; esse resultado não equivale a uma nova aprovação do Turbopack. |
| `npm run test:research-starter` | Exit 0; 12 testes, oito cenários C120 e harness de retomada C122. |
| `npm run test:cards` | Exit 0; 13 cenários de rotas sintéticas. |
| `npm run test:limits` | Exit 0; regressões C118. |
| `npm run test:methodology` | Exit 0; C117 e recuperação C119. |
| `npm run test:exports` | Exit 0; rotas e binários PDF/DOCX C121. |
| `npm run security:audit` | `PASS_WITH_ACCEPTED_RISK`, três avisos existentes, zero falhas do scanner. |
| `npm run security:gate` | Exit 1: a primeira consulta npm foi bloqueada por DNS. Não descrita como execução integral aprovada. |
| `npm audit --audit-level=high --json`, com acesso ao registro | Exit 1; cinco alertas high na cadeia ESLint. Não foi executado `audit fix` nem downgrade. |
| `npm audit --omit=dev --audit-level=high --json` | Exit 0; zero vulnerabilidades de produção reportadas. |
| `security_fast_check.py --mode worktree --json` | `PASS`; 18 arquivos inspecionados, zero findings. O scanner não identificou triggers, mas a revisão humana classifica o diff como **sensível** por API/IA. |
| `git diff --check` | Aprovado antes do commit. |

Os cinco alertas dev-only coincidem com o risco preexistente documentado na C121. Esta revisão não amplia nem fabrica aceitação de risco. Não houve migration, verificação remota, navegador autenticado, abertura no Word ou geração real de IA. Não repetimos o conjunto de testes depois apenas de editar Markdown.

## Gate de publicação

**Resultado: `BLOCKED`.** Preparar/commitar o candidato local é permitido; não é uma autorização de produção.

1. O build padrão Turbopack não foi concluído neste ambiente. O build Webpack passou, mas é necessário confirmar o processo de build que será efetivamente publicado antes da promoção.
2. O achado alto SEC-03 de autorização do Aluno permanece aberto: evidência estática no relatório, sem reprodução local em PostgreSQL nesta rodada. A Ordem 4 deve verificar a hipótese e o comportamento antes/depois. Não se declara este controle aprovado nem se aceita o risco pelo responsável. C122 não introduz nem corrige esse achado.
3. O identificador público de versão usa `NEXT_PUBLIC_APP_VERSION` com fallback `v16102026.2`. A versão proposta `v20102026.1` ainda não foi aplicada. Como a Ordem 1 proíbe alterar ambiente, a estratégia exata de identificação deve ser resolvida antes da publicação; se exigir mudança de código, será outro candidato/SHA a validar e autorizar.
4. A autorização do commit exato para push/deploy não foi preenchida. Smokes reais que criem mapas/chamem IA não estão autorizados por esta revisão.

O snapshot do scanner `PASS_WITH_ACCEPTED_RISK` não substitui este gate: ele não verifica a exploração SEC-03 nem todos os controles remotos.

## Evidências e próxima ação

Logs locais, dados de teste sintéticos e hashes:

```text
/Users/marioreis/.codex/visualizations/2026/10/06/01a10eda-341c-76b1-a181-beefcd7013ef/c122-review-2026-10-20/
```

`check.log`, `build.log`, `build-webpack.log`, `test-*.log`, `security-audit.log`, `security-gate.log`, `security-fast.json`, `npm-audit*.json`, `claim-before.log`, `claim-after.log`, `sha256.json`.

O pacote de publicação, preparado após o commit, registrará o SHA exato, proposta de versão, destino, rollback e smokes. Nenhum push/deploy foi feito. A retomada deve respeitar uma ordem por vez; os outros achados não foram incorporados implicitamente à C122.

Pó Mágico: `v20261020.002`, HEAD local/remoto `81e3cbef9fc2b5b29074297490351f681ed16b47`, reconfirmado. Blueprints APP/AI SYSTEM e overlay SECURITY AND RESILIENCE reutilizados; checkpoint resume/phase/delivery. Modelo real informado pelo runtime: Codex baseado em GPT-6; variante/esforço não expostos, custos/tokens não medidos. Sem subagentes nesta revisão.
