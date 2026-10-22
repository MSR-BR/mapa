# Claude Code — auditoria independente do Mapa da Pesquisa, GA4 e Google Ads

Preparado em 20/10/2026. Este arquivo é um roteiro executável por um agente, não um script de shell. Trabalhe no repositório indicado abaixo e entregue o relatório em Markdown. Não dependa do histórico da conversa com o Codex.

## 1. Missão e autonomia

Você recebeu do responsável a seguinte solicitação: auditar o aplicativo e a campanha Google Ads; devolver um `.md` para revisão e continuidade com o Codex; executar correções quando isso for adequado e estiver dentro dos limites abaixo.

Faça uma revisão independente. Questione conclusões anteriores, confirme os controles que funcionam e encontre causas reproduzíveis dos problemas. Diferencie defeito, hipótese, oportunidade de melhoria e evidência indisponível. Não reescreva o produto inteiro nem produza somente recomendações genéricas.

**Decisão de execução para esta rodada:**

- Pode inspecionar código, testes, documentação e metadados; consultar os serviços em modo de leitura pelos acessos já disponíveis; executar testes locais com dados sintéticos.
- Pode corrigir localmente defeitos comprovados, de escopo pequeno e reversíveis, incluindo testes de regressão e documentação. Registre o estado anterior, o motivo, os arquivos alterados e os resultados.
- Para mudanças abrangentes, comportamento de negócio ambíguo ou correções sem reprodução suficiente, prepare a proposta concreta e deixe para revisão.
- Entregue o diff local para revisão. Esta rodada não solicita commit, push, deploy, promoção de alias, atualização de ambiente, migração remota ou CPD. Não publique só porque os testes passaram.
- Não reative ou estenda a campanha encerrada; não altere orçamento, CPC, cobrança, crédito, conversões, anúncios, palavras, negativas ou configurações compartilhadas nesta auditoria. Pode preparar um pacote de alterações exato, com justificativa e reversão, para aprovação posterior.
- Não faça chamadas pagas de IA, compre serviços, amplie permissões ou extraia credenciais. Não altere modelos ou provedores só para “modernizar” a integração.
- Se faltar acesso a um serviço, continue a parte local e marque a verificação remota como não realizada. Informe a menor ação necessária para desbloquear, sem pedir chaves no relatório.

A escolha entre Claude e Codex deve seguir a continuidade do trabalho: se você reproduzir um defeito e puder validá-lo localmente, pode corrigi-lo; se a ação exigir publicação, gasto, decisão de produto ou acesso indisponível, entregue a proposta para o responsável e o Codex. Não é necessário simular uma conversa entre agentes.

## 2. Identidade e início obrigatório

Repositório:

```text
/Users/marioreis/Library/CloudStorage/Dropbox/Mac (6)/Documents/Developer/mapa
```

Produto: **Mapa da Pesquisa**, em `https://mapadapesquisa.com.br`, entrada do mapa em `/mapa`.

Snapshot local observado ao preparar este roteiro:

- Branch `codex/change-003-004`.
- HEAD `f096d9f027e1bbe3fc62fe4fcecf87c76cb1d6de`.
- Árvore limpa antes de adicionar este handoff e seu registro na memória.
- Última versão pública conferida no monitor de 20/10: `v16102026.2`, C121.
- O commit funcional da publicação C121 documentada é `ac44539`; HEAD também contém documentação posterior. Compare o conteúdo funcional e os metadados do deployment, não apenas a igualdade dos dois SHAs.

Antes de agir:

1. Leia `AGENTS.md`, eventuais `CLAUDE.md`, `.specs/project-state.md`, `.specs/roadmap.md`, `.specs/shared/`, `.specs/security/profile.md` e `.specs/security/release-gate.md`. Carregue apenas os documentos pertinentes de cada Change.
2. Confira `pwd -P`, raiz Git, branch, HEAD, status, diff e últimos commits. Preserve alterações de outras tarefas; não use reset, clean, checkout destrutivo ou stash automático. Se houver alterações concorrentes no mesmo arquivo, interrompa apenas essa edição.
3. Consulte Pó Mágico em `/Users/marioreis/Library/CloudStorage/Dropbox/Mac (6)/Documents/Developer/po-magico`: `core.md`, `manifest.json`, catálogo de blueprints e arquivos aplicáveis. Não modifique o arquivo de referência.
4. Para esta entrega, use REPORT, apoiado por APP, AI SYSTEM, DATA ANALYSIS e o overlay SECURITY AND RESILIENCE. O projeto continua classificado como APP e `S3_SENSITIVE`; uma auditoria não reduz sua classificação.
5. Registre o modelo e esforço realmente expostos pelo Claude Code. Use a rota disponível adequada à auditoria; não invente nomes, custos, tokens ou disponibilidade de modelos.
6. Antes de alterar código Next.js, consulte os guias locais pertinentes em `node_modules/next/dist/docs/`. Verifique versões em `package.json` e lockfile; não aplique exemplos de outra versão por memória.
7. Faça um inventário curto e um plano priorizado; prossiga dentro do escopo autorizado, sem pedir confirmação para cada leitura ou correção local.

Pó Mágico conferido na preparação: `v20261020.002`, HEAD local e remoto `81e3cbef9fc2b5b29074297490351f681ed16b47`. O catálogo consultado não continha entrada do Mapa: o caminho acima foi confirmado pelo workspace do responsável e pelo Git, mas não pelo registro central. Não crie essa entrada durante a auditoria. Reconfirme estes fatos no início; se houver divergência, registre-a.

**Atenção a documentação antiga:** há trechos do MVP nas specs que antecedem histórico, integração bibliográfica e GPT, e trechos de Ads que ainda dizem “em execução” ou citam €14/12 de outubro. São estados históricos. Reconcilie decisões posteriores e evidências datadas, sem regredir funcionalidades ou reativar campanhas.

## 3. Arquitetura e contratos de produto

Next.js/React/TypeScript, backend na Vercel, dados e Google OAuth no Supabase. Gemini, GPT e Research Starter são consumidos pelo backend. Há exportações PDF/DOCX, busca bibliográfica e fallback Crossref. Descubra no código os caminhos e modelos efetivos.

Pastas principais: `app/`, `modules/`, `lib/`, `components/`, `tests/`, `scripts/`, `supabase/`, `public/` e `.specs/`. Não pressuponha uma pasta `src/`.

Supabase do Mapa: `aeaweherkrqmlqnxsmib`. Não execute operações em projetos Supabase de outros produtos, inclusive o Research Starter.

Contratos que precisam continuar válidos:

- Landing apresenta o produto; CTA abre `/mapa`. O usuário pode preparar a ideia sem login, e a geração/persistência exige o fluxo autenticado previsto.
- Rápido e Avançado abrem e fecham pelos próprios controles; Avançado começa fechado; mudar de modo não apaga texto.
- Login/callback, voltar, salvar rascunho, recarregar e navegar entre etapas preservam o conteúdo. Rascunho, versão validada, proposta da IA e contexto usado pelas próximas etapas são distintos.
- Regenerar atua apenas no quadro escolhido, considera texto atual e orientação, preserva os demais e não apaga silenciosamente o texto em caso de erro.
- Texto gerado respeita os limites reais de cada campo, incluindo regenerações e fallback. Não resolva excesso destruindo o original do usuário ou cortando conteúdo silenciosamente sem avaliar perda de sentido.
- Objetivos e metodologia devem oferecer sugestões suficientes e erros claros. Avisos acadêmicos orientativos não viram barreiras arbitrárias.
- Aluno e Orientador possuem contratos distintos. O avanço do Aluno mantém a aprovação obrigatória do Orientador; o Orientador é autônomo. Não “destrave” a aplicação retirando autorização ou aprovação humana.
- Literatura preserva referências existentes. A opção “Otimizar literatura” foi retirada pela C121; não a restaure por encontrar specs antigas.
- Word deve conter o conteúdo integral do PDF. Preserve a qualidade do PDF; compare seções, tabelas, referências e renderização, não só número de páginas.
- No Avançado, os cinco campos iniciais têm pares “Texto original” e “Texto Mapa da Pesquisa” nos relatórios; originais históricos não devem ser truncados. Entradas novas têm limite de 400 caracteres conforme C121.
- O vídeo da home tem velocidades 1×, 1,5× e 2×.
- A caixa de progresso deve indicar o provedor realmente utilizado, inclusive fallback, sem afirmar execução que não ocorreu.

## 4. Mapa das Changes e fontes

O ledger completo é `.specs/roadmap.md`. Não renumere Changes existentes. Esta auditoria ainda não recebeu número de Change; se implementar correção material, escolha o próximo número livre após conferir o ledger e as pastas.

| Área | Histórico relevante |
|---|---|
| Fundação, identidade e jornada | C001–C096; C091 cancelada. Consulte somente as partes afetadas. |
| SEO, descoberta e medição | C097–C100, C108; baseline longa e atribuição não equivalem a bloqueio temporal do antigo piloto. |
| IA, segurança e banco | C101–C104; observabilidade, perfil S3, grants e RLS explícitos. |
| Referências, contexto e cards | C105–C107. |
| Ads | C109 vínculo e manifesto; C110 piloto, extensão, relevância e teste de CPC. |
| Histórico e dois provedores | C111 navegação/contexto versionado; C112 Gemini/GPT e teto adicional de US$5/mês. |
| Compatibilidade Gemini | C113; vínculo com o aviso recebido em `marioreis@id.uff.br` continuava não confirmado. |
| Entrada, regeneração, metodologia e limites | C114–C118. |
| Recuperação de metodologia | C119: contexto antigo confundido com conflito e falha auxiliar após salvamento. |
| Primeira busca bibliográfica | C120: consulta até 180 caracteres, tentativas limitadas, Crossref alternativo com cobertura reduzida. |
| Relatórios e briefing | C121: Word completo, original/reformulação, limite 400 e validação por perfil. |

Leia especialmente:

```text
.specs/changes/109-google-ads-link-and-draft/campaign-draft-2026-10-06.json
.specs/changes/110-google-ads-controlled-pilot/launch-2026-10-06.md
.specs/changes/110-google-ads-controlled-pilot/extension-2026-10-11.md
.specs/changes/110-google-ads-controlled-pilot/cpd-2026-10-11.md
.specs/changes/110-google-ads-controlled-pilot/optimization-proposal-2026-10-11.json
.specs/changes/110-google-ads-controlled-pilot/cpc-test-execution-2026-10-15.md
.specs/changes/110-google-ads-controlled-pilot/distribution-links-2026-10-15.md
.specs/changes/113-gemini-deprecated-parameters/audit-2026-10-07.md
.specs/changes/119-methodology-recovery/cpd-2026-10-15.md
.specs/changes/120-research-starter-resilience/cpd-2026-10-16.md
.specs/changes/121-complete-exports-intake-review/cpd-2026-10-16.md
```

Evidência operacional mais recente, posterior às specs antigas:

```text
/Users/marioreis/.codex/visualizations/2026/10/06/01a10eda-341c-76b1-a181-beefcd7013ef/monitoramento-ads/2026-10-20/
```

Comece por `monitor-2026-10-20.txt` e `monitor-2026-10-20.json`; há consultas, resultados, capturas de encerramento/regra, health, consentimento, log sanitizado e confirmação da pausa da automação. As pastas de 17–19/10 contêm o histórico. Se esses arquivos não estiverem disponíveis no seu ambiente, use o snapshot abaixo como evidência secundária datada, não como nova consulta sua.

## 5. Prioridades da auditoria do aplicativo

### A. Descoberta e autenticação — primeira prioridade

Sinais históricos ainda sem causa comprovada:

- Em 17/10: oito `generation_failed / discovery / provider_invalid_response`, origem direta, sem `generation_completed` no dia consultado.
- Em 18/10: quatro falhas da mesma categoria vindas do QR, às 18:53, 18:56, 22:37 e 22:38 BRT; uma geração concluída às 18:59 BRT. Contagens não identificam pessoas ou projetos únicos.
- Em 20/10 às 07:10:58.299 BRT, log de `GET /dashboard`: wrapper HTTP 200, erro interno `profile_unavailable/503`, `PGRST303: JWT issued at future`. Sinal semelhante em 18/10. A navegação era QA pública, possivelmente prefetch.
- Esses sinais não provam que JWT causou a falha de descoberta, nem que o Research Starter ou Gemini estava indisponível.
- A versão dos clientes nos eventos históricos não foi identificada. Logs antigos estavam fora da retenção/acesso disponível; ausência de erro em janela recente não refuta erro histórico.

Inspecione `modules/research-workflow/proposal-discovery-workspace.tsx`, `discovery-errors.ts`, `discovery-service.ts`, autorização/perfil, proxy, sessão, retries e contratos. Há arquivos `modules/profile/future-jwt-retry.ts`, `tests/future-jwt-retry.test.ts` e `tests/supabase-proxy-headers.test.ts`: confira sua implementação e alcance antes de propor outra correção.

Reproduza separadamente, com mocks: sessão ausente/expirada, JWT no futuro, 401/403, 400 de contrato, 429, timeout, rede, 5xx, JSON inválido, schema incompleto e falha de persistência. Verifique se a interface distingue a falha e preserva o briefing, sem loop de login, retries infinitos, duplicação ou falso sucesso.

Não enfraqueça a verificação de JWT, RLS ou identidade para contornar diferença de relógio. Analise relógios, cabeçalhos, refresh e temporalidade sem ler ou imprimir tokens. Uma repetição limitada só é solução se o erro for transitório e a operação segura para repetição.

### B. IA e bibliografia

- Localize chamadas reais, modelos, overrides por nome, parâmetros camelCase/snake_case, timeouts, cancelamento, retries e condições de fallback.
- Audite limites por campo, schemas, custo e concorrência. Confirme que o orçamento adicional GPT de US$5/mês não é contornado por retries/fallback e que revisões não sobrescrevem automaticamente conteúdo aceito.
- Confira compatibilidade Gemini na documentação oficial atual do modelo encontrado, citando URL e data. Não troque `thinking_budget` por `minimal` indiscriminadamente; não assuma que Gemini 3.8 aceita esse nível. Para 2.5, avalie mudança de comportamento antes de remover parâmetros. Não migre `generateContent` para Interactions só por aviso de depreciação.
- O vínculo entre o projeto Google do aviso de 07/10 e este aplicativo exige metadados verificáveis. Se não houver, escreva **“vínculo não confirmado”**.
- Verifique o contrato Research Starter de 180 caracteres sem alterar o briefing original, fallback Crossref, proveniência, deduplicação, preservação de referências e aviso de cobertura reduzida. Redundância não garante disponibilidade permanente nem equivalência de cobertura.
- Não envie conteúdo privado a novos provedores. Testes desta rodada usam transporte simulado; prova real paga fica explicitamente pendente.

### C. Jornada, persistência, exportações e segurança

Teste, com fixtures sintéticas, os contratos da seção 3, incluindo navegação/reabertura de um projeto legado que já esteja na metodologia. Compare conteúdo antes/depois; a prova precisa demonstrar preservação, não apenas ausência de mensagem de erro.

Revise autorização por proprietário e perfil, concorrência entre abas, histórico/restauração, gravação atômica, duplicação de eventos e estado de requisição cancelada. Exercite negações anônimas e entre duas identidades em ambiente local isolado. Não leia mapas privados em massa.

Revise RLS e grants separadamente, funções privilegiadas, Storage, fronteiras servidor/cliente, logs sanitizados, dependências e custos do histórico no Supabase Free. Não faça migração ou mudança de Auth no Supabase remoto.

Em desktop e celular, verifique labels, foco, teclado, mensagens de erro, responsividade e controles. Renderize PDF/DOCX sintéticos e compare conteúdo e layout. Registre claramente quais verificações foram locais e quais foram públicas em produção.

## 6. Google Ads — estado encerrado e análise da baixa entrega

Identidade e recursos:

| Recurso | Identificação |
|---|---|
| Login Google Ads | `mario.reis.junior@gmail.com` |
| Conta | MSR-BR `383-835-9068` |
| Campanha Mapa | `24325133699`, `Mapa \| Search \| BR \| Ativacao \| Piloto` |
| TERMO — preservar integralmente | Campanha `24027143907` |
| Cadastro separado — não concluir/financiar | `896-116-6158` |
| Objetivo exclusivo Mapa | Custom goal `6459352879` |
| Conversão | `7825220596`, `project_start` |
| Regra de custo | `62128225` |

**Estado verificado em 20/10:** campanha `ENDED`, pelo término em 19/10/2026 às 23:59:59 de São Paulo. `ENABLED` administrativo não significa que esteja servindo. O monitor `mapa-concluir-ads-e-acompanhar-piloto` foi pausado em 20/10. Não reative a campanha ou a automação. Não altere C097.

Limites do período encerrado: média €2/dia, CPC máximo €0,30, pausa por custo acumulado ≥€28. A regra é horária, `All time`, somente Mapa; última execução observada em 20/10 às 06:16:10 BRT, sucesso/sem mudanças. O ramo de pausa por limiar não foi exercitado e não garante teto instantâneo.

Teste anterior de CPC €0,45: iniciou em 15/10 e foi revertido em 18/10 às 06:07:49 BRT para €0,30. Está concluído. Não retorne a €0,45 como “pendência”.

Resultados acumulados observados, 06–19/10:

| Métrica | Valor |
|---|---:|
| Impressões | 9 |
| Cliques | 0 |
| Gasto | €0,00 |
| Conversões atribuídas | 0 |

São três impressões do RSA antigo e seis do novo; cinco em 16/10 e uma em 17/10 durante o teste. Não há controle ou amostra para afirmar efeito causal, eficácia ou falta de interesse. CPC médio e custo por conversão são **não calculáveis**, não “zero eficiente”.

Configuração preservada:

- RSA novo `827659065358`, aprovado; antigo `827109934468` pausado. Inelegibilidade atual pelo encerramento não é reprovação de política.
- Seis palavras habilitadas/aprovadas: `[projeto de pesquisa]`, `[como fazer um projeto de pesquisa]`, `[ferramenta para tcc]`, `"projeto de pesquisa com ia"`, `[estrutura projeto de pesquisa]`, `[pré projeto de pesquisa]`.
- Quatro palavras antigas pausadas e 17 negativas.
- Somente Pesquisa Google; parceiros e Display desligados.
- Consultas observadas: “projeto de pesquisa” sete impressões, “criador de tcc” uma, “pré projeto” uma; zero cliques.
- A palavra principal tinha qualidade 2/10, relevância média e experiência da landing abaixo da média. Não generalize esse diagnóstico a todas as palavras.
- A ação de conversão pode ser secundária no padrão da conta e ainda compor o objetivo personalizado exclusivo da campanha. Verifique a cadeia efetiva antes de classificá-la como erro; mudar o padrão da conta pode afetar TERMO.

Audite, por leitura: datas/status, estratégia e limites de lance, segmentação/localização/presença, idioma, redes, programação, elegibilidade/políticas, termos, negativas e possíveis conflitos, correspondências, copy/landing, assets herdados da conta, objetivo efetivo, vínculo GA4, etiquetagem automática e URLs. Não clique no próprio anúncio.

Separe causas comprovadas de hipóteses para a baixa entrega: ranking, demanda, correspondências, aprendizado, elegibilidade, limite de lance e orçamento. Sentinelas GAQL `0.9001`/`0.0999` representam `>90%`/`<10%`; não reporte percentuais exatos. Perdas estimadas por orçamento em dias com poucas impressões e gasto zero não provam orçamento consumido.

Entregue, se sustentado, **uma proposta de novo piloto**, sem executar: hipótese única, alterações precisas, dependências do app/medição, duração, orçamento médio, limite acumulado, CPC, critérios de sucesso/fracasso, interrupção e reversão. Todos os novos valores são propostas, não autorização. Explique também quando a melhor decisão é corrigir o produto e não anunciar ainda.

## 7. GA4, consentimento, SEO e atribuição

Propriedade GA4 `550650234`, medição `G-MKFYYRZG87`. Vínculo único Ads, publicidade personalizada e acesso ampliado desligados.

GA4: `America/Rio_Branco`, BRL. Ads: `America/Sao_Paulo`, EUR. Não altere esses metadados nem junte automaticamente dias/valores. Informe sempre janela, fuso, filtros e data da extração.

Snapshot GA4 06–19/10, consultado em 20/10:

| Indicador | Total | Excluindo QA/equipe identificados |
|---|---:|---:|
| Sessões | 129 | 104 |
| Usuários na janela inteira | 17 | 16 |
| Eventos | 1.965 | 1.804 |
| `project_start` | 40 | 38 |
| `export_pdf_completed` | — | 20 |
| `generation_completed` | — | 26 |

Filtro de avaliação: excluir as combinações `codex_validation / qa` e `mapa_team / internal`. Isso não elimina uso interno histórico não identificado. Não subtraia/some usuários de segmentos como conjuntos disjuntos.

Sessões sem esses segmentos: direto 73; QR (`scanned.page / referral`) 19; Google orgânico 8; origem indefinida 2; `accounts.google.com / referral` 2. Nenhum `google / cpc` nem conversão paga confirmados. Eventos de início/exportação não são contagens de projetos únicos e não formam, sozinhos, um funil de conversão.

Confira:

- Disparo de `project_start` após persistência, deduplicação e ausência de novo início por reabertura; sem falsos sucessos.
- Eventos de geração, validação e exportação; classificação de erros e limites da identificação de versão/ação.
- Sanitização de URLs e payloads: nenhum texto acadêmico, e-mail, token ou identificador privado desnecessário no GA4.
- Consentimento inicial, recusa, aceite e revogação; o estado observado em uma sessão não prova o padrão para visitantes novos. Verifique comportamento efetivo da coleta, não só checkbox.
- Atribuição através de OAuth/retorno, referenciadores, UTMs e clique identificado, sem fabricar clique pago nem criar dimensões/filtros/vínculos automaticamente.
- SEO técnico e correspondência entre intenção de busca, anúncio e landing: canonical, sitemap, robots/noindex, metadados, indexabilidade e desempenho móvel. Diferencie dados de campo de testes de laboratório.

Atualize os números se houver acesso; caso contrário, use estes dados como históricos. Não atribua falhas ou uso orgânico ao Ads com zero cliques.

## 8. Validação, acessos e tratamento de evidências

Inspecione `package.json` e os scripts antes de executá-los. Prefira os testes existentes de contrato, domínio, UI e exportação. Candidatos: `lint`, `typecheck`, `test`, `test:ai`, `test:research-starter`, `test:methodology`, `test:cards`, `test:limits`, `test:exports`, `exports:verify`, `security:audit` e `build`, conforme seus efeitos reais.

Não execute às cegas comandos `verify`, smoke, `check`, seeds ou scripts que carreguem ambiente remoto: alguns verificadores são locais; outros usam banco remoto ou APIs pagas. `supabase:release-gate` é documentado como PostgreSQL descartável local; confirme a implementação e o destino antes de usá-lo. Os verificadores remotos RLS não entram nesta rodada.

Para cada correção, demonstre o cenário que falhava, o resultado depois e a preservação dos contratos próximos. Não invente que testes passaram. Se rede, dependências, ambiente ou navegador bloquearem uma verificação, registre comando, impedimento e consequência.

Use conectores/CLI/navegador já autorizados, sem pressupor que ferramentas do Codex existam no Claude Code. Não contorne restrições de acesso, compre retenção de logs ou amplie escopos.

Não leia valores de chaves, cookies ou tokens. Inspecione somente nomes/escopos/referências de configuração e metadados. Não execute `env`, dumps de `.env`, exportação de sessão ou leitura de armazenamento do navegador. Não inclua HAR, payloads privados ou logs brutos no relatório. Use fixtures sintéticas e evidências sanitizadas.

A propriedade de uma conta/projeto, a revisão publicada e a validade de credenciais são fatos separados. Um health HTTP 200 não comprova login, geração, persistência, exportação ou capacidade de atender tráfego pago.

## 9. Entrega obrigatória em Markdown

Crie, dentro deste repositório:

```text
.specs/audits/claude-AAAAMMDD/AUDITORIA_MAPA_APP_GA4_ADS.md
```

Use a data real. Se o arquivo já existir, preserve a versão anterior e identifique a nova execução. Evidências auxiliares sanitizadas podem ficar na mesma pasta. O relatório principal deve ser compreensível sozinho, para retornar ao Codex.

Estrutura:

1. **Resumo acessível:** o que funciona, o que falha, se o app está pronto para novo tráfego pago e o que fazer primeiro.
2. **Escopo e identidade:** modelo real, datas/fusos, Git inicial/final, árvore inicial, versão/deployment observados e acessos disponíveis.
3. **Matriz de auditoria:** app, autenticação, IA, bibliografia, histórico, exportações, segurança, SEO, GA4 e Ads; status `VERIFIED`, `PARTIAL`, `NOT_CHECKED` ou `NOT_APPLICABLE`.
4. **Achados priorizados:** ID estável, P0–P3, área, evidência/caminho/linha/consulta, reprodução, impacto, causa confirmada ou hipótese, confiança, correção mínima, teste e reversão. Não esconda pendências em um “tudo pronto”.
5. **Resultado quantitativo de Ads/GA4:** tabelas com fontes, filtros, fusos, distinção de pago/orgânico/interno e limitações.
6. **Correções realmente executadas:** arquivos, antes/depois, testes, diff ou commit se existir por outro fluxo autorizado; diga explicitamente que não houve publicação quando for o caso.
7. **Propostas não executadas:** priorização, dependências, esforço estimado identificado como estimativa, risco e necessidade concreta de autorização. Inclua o eventual novo piloto como proposta separada.
8. **Validação:** comandos exatos, resultados reais, falhas preexistentes, testes omitidos e motivo. Diferencie estático, mock, integração local e produção.
9. **Handoff ao Codex:** tabela `ID | feito/pendente | executor sugerido | arquivos/recursos | próximo passo | critério de aceite | autorização necessária`.
10. **Parecer final:** `AUDITED`, `NEEDS_REVIEW` ou `BLOCKED`, com limites. Não confunda auditoria com gate de produção aprovado.

Faça a recomendação técnica que considerar melhor, inclusive discordando das hipóteses deste roteiro. Para publicar depois, será necessário candidato exato, revisão, destino, validação proporcional e rollback.

Ao terminar, informe o caminho do `.md`, resuma os três achados mais importantes e diga o que você corrigiu e o que ficou para o responsável/Codex. Não declare CPD limpo se não houve commit, push, deploy e verificação; nesta rodada a entrega é auditoria e, quando cabível, correção local revisável.

**Próxima ação exata:** confira workspace/Git/instruções; leia o fechamento do piloto de 20/10; audite primeiro descoberta/autenticação; em seguida valide a jornada, medição e causas da baixa entrega; salve o relatório e os diffs locais.
