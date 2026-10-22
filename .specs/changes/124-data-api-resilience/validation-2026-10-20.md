# C124 — validação local da Ordem 3

**Resultado:** implementada localmente, `NEEDS_REVIEW`. Sem commit, push, deploy,
migration, API paga ou mudança em Ads/GA4/Supabase remoto. Base Git permanece
`7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`; C123 já estava no workspace e foi
preservada. Este relatório não é um gate de publicação nem validação remota.

## O que foi corrigido

| Caminho | Correção e prova sintética |
|---|---|
| Descoberta | Leitura não vira 404; erro ao reservar não vira 409; gravação/limpeza verificam erro e linha. Não sobrescreve resultado incerto. Reserva expirada da C122 e concorrência preservadas. |
| Geração legada | Projeto/job/snapshot verificam erro; atualizações de estado, interpretação, consulta ampliada, conclusão e limpeza confirmam linha. Nenhum retry de escrita ou IA. |
| GET/PATCH generation | Status/snapshot não mascaram falha; PATCH usa revisão esperada e retorna revisão confirmada; zero linhas → 409. |
| Exportação | Falha de projeto/workflow/snapshot não vira ausência ou falta de aprovação. Downloads mantêm as regras existentes. |
| Integração | Erro de workflow não permite fallback para estrutura legada. INSERTs e limpeza são verificados; falha transitória de resultado incerto não oculta o projeto. |
| Orientador | Erro de leitura não vira orientador nulo/falso bloqueio acadêmico. 503 preservado também no diagnosticador da metodologia. |
| Página privada | SELECT e autorização falham fechados; erro transitório redireciona ao destino HTML 503, com Retry-After e noindex. |
| Bug reports | Leitura de projeto e INSERT verificam erro; falha de autenticação transitória não é tratada como visitante anônimo. Notificações não foram disparadas nos testes. |
| Perfil/autorização | Mesmo limite de três tentativas; RPC de vínculo verificado sem repetição; resposta 503 contém Retry-After. |

`loadOrThrow` é o helper de leitura, com deadline monotônico de cinco segundos
por consulta/lote, abort da requisição e até três tentativas. As SELECTs usam
`.retry(false)` porque o SDK instalado já repete erros de rede/HTTP 520. Os testes
com **o SDK real e fetch sintético** contam três requisições, evitando multiplicar
três tentativas do app pelas tentativas internas. JWT expirado, erro de permissão
e constraint não são repetidos. Escritas e RPC executam uma vez.

## Verificações executadas

| Comando | Resultado |
|---|---|
| `npm run check` | Lint (um warning anterior), tipos, grants estáticos, **261 testes** e exportações passaram. Build padrão Turbopack **bloqueado** por `binding to a port / Operation not permitted` do sandbox. Não classificar o comando completo como aprovado. |
| `npm run test:data-api` | **45 verificações direcionadas** aprovadas, com handlers e loaders reais, autenticação/banco/provedores sintéticos e fetch externo proibido. Inclui PGRST303 por rota, erro persistente, recuperação, zero linhas, limpeza, status-only, workflow de exportação, integração e stream tardio. |
| `npm run test:methodology` | Aprovado, incluindo o caso novo de orientador PGRST303 atravessando o diagnosticador com 503/Retry-After, sem escrita ou IA. |
| `npm run test:cards` | 13 cenários aprovados. |
| `npm run test:exports` | Aprovado, incluindo renderizadores PDF/DOCX reais, aprovação/rascunho e preservação de conteúdo. |
| `node scripts/verify-discovery-claim-recovery.mjs` | Aprovado: reserva expirada, recente, concorrência e falha de gravação preservada para recuperação. |
| `npm run build -- --webpack` | Aprovado com a revisão final. A rota `/service-unavailable` foi compilada. |
| Auditoria estática / security_fast_check | Aprovadas com os riscos anteriores registrados. Nenhuma evidência de RLS remoto ou segurança integral é inferida. |
| `git diff --check` | Aprovado. |

A suíte principal somou 210 + 13 + 38 = **261 testes**. As 45 verificações de
rotas são adicionais; não representam 45 usuários nem incidentes reais.
O primeiro check incluiu 35 verificações direcionadas; depois foram acrescentadas
10 verificações de status-only, exportação v2, zero linhas e limpeza, e a suíte
`test:data-api` foi reexecutada com sucesso. Lint/tipos/build Webpack foram
reexecutados no candidato final.

## Limitações relevantes para revisão

1. **Streaming:** antes do primeiro progresso útil, o wrapper devolve HTTP 503
   real, inclusive quando o cliente pediu NDJSON. Depois que o stream começou,
   HTTP 200 já foi enviado e é imutável. O resultado terminal transporta 503 e
   Retry-After, o cliente os reconstrói, e a fase é `failed`, nunca `completed`.
   Portanto a exigência literal de “nunca HTTP 200” **não é atendida no transporte
   de falhas tardias**, embora a operação não seja anunciada como sucesso.
   Retirar esse limite exige abandonar o progresso incremental ou mudar protocolo.
2. **Página Next:** Server Component não pode definir 503 arbitrário. O primeiro
   salto usa o protocolo de redirect do Next; `/service-unavailable` responde 503.
   Testada a escolha do destino e seu handler; não um fluxo autenticado remoto.
3. **Persistência:** não foi criada transação/RPC/migration. Escritas em tabelas
   diferentes podem resultar em estado parcial. Não repetir automaticamente IA
   ou gravação diante de resposta incerta; conferir a versão salva. A nova checagem
   de linhas presume os SELECTs/RLS já existentes, sem alterá-los.
4. **Causa histórica:** a reprodução é sintética; não comprova que PGRST303 causou
   os eventos de produção de 17–18/10. Produção permanece inalterada.
5. Ordens 4–5, SEC-03 e demais pendências da auditoria continuam fora do escopo.

## Evidências, preservação e próxima etapa

- [Especificação](spec.md), [diff incremental C124](local-changes.patch),
  [manifesto de arquivos](files.json), logs em `evidence/`.
- O diff foi calculado contra o workspace **antes da C124**, incluindo o estado
  já modificado da C123. Não usar o diff global contra HEAD como se fosse só C124.
- Os 16 arquivos rastreados de implementação/testes previamente modificados pela
  C123 foram comparados byte a byte com o snapshot inicial e permaneceram iguais.
  `package.json`, memória e roadmap receberam somente acréscimos da C124.
- Revisar o diff e as duas ressalvas HTTP; resolver separadamente os bloqueios
  anteriores antes de propor publicação. Esta etapa não autoriza publicar.
- Reversão local: aplicar inversamente **apenas** o patch C124 depois de revisão;
  ele depende da C123 presente. Não usar reset/checkout global.

Skills aplicadas: Pó Mágico, Supabase (leituras locais) e
[project-security-audit](/Users/marioreis/.agents/skills/project-security-audit/SKILL.md).
S3; Next Route Handlers local e implementação instalada de PostgREST consultados.
Pó Mágico v20261020.002; checkpoints start/classification/phase/Change/delivery,
sem alterar o arquivo central. Codex/GPT-6, variante/esforço não expostos;
sem subagentes. `PUBLICATION_STATE: NOT_REQUESTED`.
