# Validação local — C125 — 22/10/2026

## Resultado

**PASS local; NEEDS_REVIEW para publicação.** Não houve commit, push, deploy,
chamada paga, leitura de valores de chaves, SQL remoto, alteração de Auth,
Ads ou GA4. Nenhuma migration antiga foi modificada.

PostgreSQL **17.11** (`postgres:17-alpine`, digest
`sha256:eee6c6e1b0894fa4fe0075eb054af9fd1cf39a35321c2d4110626cfe506411fb`).
Containers descartáveis, `--network none`, sem portas expostas e sem montar
`.env`, credenciais ou configuração de projeto. Somente migrations, scripts e
fixtures sintéticas; o download inicial da imagem pública não acessou Supabase.
O stub modela `auth.users`, `auth.identities`, roles, `auth.uid()` e catálogo
Storage, incluindo defaults legados de privilégios. Não equivale ao serviço
Auth/Storage/PostgREST completo.

## Reprodução antes e bloqueio depois

O mesmo cenário é executado antes/depois das três migrations. Cada tentativa
é revertida em subtransação, inclusive quando a falha anterior é reproduzida.
A exceção esperada é conferida; um erro incidental não conta como bloqueio.

| Caso | Antes | Depois |
|---|---|---|
| INSERT de workflow Aluno com `stable_state='completed'` | Aceito | Rejeitado |
| INSERT com parecer aprovado | Aceito | Rejeitado |
| DELETE direto do workflow | Permitido | Privilégio negado |
| Dono aprova/apaga/altera alvo de parecer devolvido | Permitido (3 casos) | Rejeitado |
| Novo pedido sem transição ou sem status | Aceito (NULL SQL, 2 casos) | Rejeitado |
| Projeto com advisor_id não verificado em INSERT direto | Aceito | Rejeitado |
| Solicitante Aluno não confirmado vincula orientador | Aceito | Rejeitado |
| Anon define `priority='urgent'` ou triagem/notas/resolução | Aceito (2 casos) | Colunas negadas |
| set_project_advisor: Google não confirmado, senha sem Google, Google com e-mail divergente | Vinculava (3 casos) | Convite pendente, sem advisor_id |
| claim: mesmos três destinatários não elegíveis | 1 projeto por caso | 0 projetos |
| Google confirmado e e-mail correspondente reivindica convite | 1 | 1 |

São 12 tentativas que passam a lançar erro e seis casos de vínculo/claim que
passam a retornar falso/zero. O congelamento C111 já bloqueava alteração de
parecer **pendente** antes desta Change; o caso de UPDATE reproduzido aqui é o
parecer **devolvido**. Não atribuir a C125 um bloqueio que já existia.

## Fluxos legítimos

- Inicializar workflow, avançar à problemática e salvar rascunho.
- Solicitar revisão; dono continua impedido de avançar sozinho.
- Orientador vinculado aprova e efetiva avanço; orientador autor permanece autônomo.
- Reenviar parecer devolvido sem perder comentário anterior.
- Excluir projeto-pai e remover workflow por cascata, apesar de DELETE direto negado.
- Relato anônimo/autenticado com defaults; remetente não faz triagem; admin faz.
- Histórico versionado: 2.015 versões de teste, payload atual constante em
  17.753 bytes entre amostras de 0/100/300/1.000 versões; não é estimativa de uso real.
- Duplicação: texto dos elementos, briefing e rascunhos preservados; cópia de
  Aluno reinicia aprovação, cópia autônoma permanece em reviewing_map.

## Comandos executados

| Verificação | Resultado |
|---|---|
| `sh scripts/verify-c125-security-local.sh` | PASS: antes/depois + fluxo C089 + catálogo |
| `npm run supabase:release-gate` | PASS: 24 migrations, 19 funções, 11 tabelas, sem views/sequences próprias |
| `sh scripts/verify-mode-aware-rls.sh` | PASS: isolamento, modo, vínculo, filhos e RPC |
| `sh scripts/verify-student-advisor-gate.sh` | PASS: rascunho, revisão, aprovação e autonomia |
| `sh scripts/verify-versioned-workflow.sh` | PASS: histórico e preservação de payload |
| `npm test` | PASS: 211 + 13 + 38 = 262 testes, mais 45 verificações do harness C124 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, um warning preexistente em foundation.test.mjs:887 |
| `npm run security:audit` | PASS_WITH_ACCEPTED_RISK estático; não é autorização de release |
| `git diff --check` | PASS |

Logs em `evidence/`. Os scripts históricos exibem rótulos C104 em alguns resumos,
mas foram estendidos para aplicar C125 antes dos testes. O resumo textual antigo
do auditor estático sobre quantidades não substitui o inventário do manifesto/gate.
Build/deploy não fazem parte desta execução; tipos e testes cobrem o adaptador
mínimo de duplicação. Os gates completos do candidato publicado ficam no plano.

## Limites da evidência

- O vínculo Google foi testado por linhas Auth sintéticas; a configuração remota
  de signup, registros reais de identidades e vínculos existentes não foi lida.
  Vínculos históricos não são automaticamente removidos por estas migrations.
- Limite e MIME do bucket foram comprovados no catálogo SQL. Rejeição de bytes
  pelo endpoint Storage precisa de smoke separado em ambiente autorizado.
- Permissões de INSERT foram exercidas em PostgreSQL; não houve envio real de bug,
  e-mail, OAuth, arquivo remoto nem chamada de IA.
- Não há comprovação de que esses achados causaram os eventos históricos do GA4.
- A Change não resolve SEC-02/04/06, EX-01/02/03 nem decisões de custo da Ordem 5.

## Documentação consultada

- [Identidades Supabase](https://supabase.com/docs/guides/auth/identities): identidade
  Google e e-mail obtidos da tabela Auth, sem usar metadados editáveis do usuário.
- [Restrições de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets):
  limite de tamanho e MIME são configurações do serviço Storage.
- [Changelog público](https://supabase.com/changelog.md), lido em 22/10: revisão
  relevante de PostgreSQL 17.11, privilégios explícitos e mudança TLS futura;
  nenhuma necessidade de alterar modelo, credenciais ou ambiente para esta Change.

## Revisão integrada de 22/10/2026 — correção posterior ao pacote original

A revisão conjunta C123–C126 reproduziu e corrigiu a perda do ramo C111 de
revalidação de etapa anterior na primeira migration C125. Testes antes/depois
confirmam preservação do texto/progresso e recusa de cinco pedidos inválidos.
A migration ainda NÃO foi aplicada nem commitada. Os hashes e o patch originais
desta pasta são históricos; para revisão do candidato atual, use
[parecer e manifesto integrados](../../handoffs/2026-10-22-integrated-review/REVIEW.md).
Não aplicar o antigo `local-changes.patch` como se fosse a versão revisada.
