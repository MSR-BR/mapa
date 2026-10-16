# Teste de CPC aplicado — 15/10/2026

**Ativo e confirmado.** A autorização “sim, pode avancar com suas sugestoes” aprovou o teste proposto, a investigação dos bloqueios e os links identificados.

Na campanha **24325133699**, conta **MSR-BR 383-835-9068**, foi alterado somente o teto de CPC de **€0,30 para €0,45**, aproximadamente entre **21:03 e 21:04 BRT de 15/10**. O segundo exato não foi registrado. O campo foi salvo, reaberto na interface e confirmado por consulta GAQL independente.

## Condições mantidas

- Orçamento médio: **€2/dia**; término **19/10/2026 às 23:59:59 de São Paulo**.
- Regra **62128225**, habilitada a cada hora, usa custo de todo o período e pausa somente Mapa a partir de **€28 acumulados**. Não garante teto instantâneo; o ramo de pausa por limiar não foi exercido.
- Palavras, negativas, anúncio, meta project_start **7825220596** e redes não foram alterados.
- TERMO **24027143907** não recebeu alterações. A leitura de controle confirmou seus campos selecionados de status, orçamento, rede e lance; não constitui nova auditoria integral de assets.
- Cadastro separado não foi concluído ou financiado.

A linha inicial do teste, no período 06–15/10, era **3 impressões, 0 cliques, €0 e 0 conversões**, com 15/10 parcial. Não há efeito do novo CPC comprovado no momento da aplicação.

## Retorno e acompanhamento

O retorno a **€0,30** está agendado no Codex para **18/10**, com prazo máximo conservador de **21:03 BRT**. Como proteção adicional, a automação diária deve fazer a reversão já na verificação de 18/10, encerrando o teste antes das 72 horas. Nunca deve reativar uma campanha pausada.

As automações foram salvas e relidas como ACTIVE:

- Diária: `mapa-concluir-ads-e-acompanhar-piloto`; agenda original preservada.
- Reversão: `mapa-concluir-teste-cpc-de-72-horas`; domingo às 20:00, uma execução. A interpretação de fuso da agenda não foi comprovada; a proteção diária é antecipada e o prazo explícito está nos dois prompts.

A reversão depende da execução e do acesso do Codex; não é uma regra temporal nativa do Ads. Se houver impedimento, a automação deve alertar e não declarar sucesso. Após confirmação, atualizar o acompanhamento diário e remover a automação específica redundante. C097 não foi alterada.

Comparar impressões, consultas, cliques, CPC efetivo, custo e project_start pago. Não inferir causalidade ou significância de uma amostra pequena e de um teste sequencial. Não aumentar novamente, renovar ou estender automaticamente.

## Produto e divulgação

A [investigação de produto](product-review-2026-10-15.md) passou nos testes locais, mas **não identificou a causa dos dois eventos recentes na metodologia**. Não foi publicado código nesta execução.

Os [quatro links identificados](distribution-links-2026-10-15.md) estão preparados para UFF, WhatsApp, marcador com QR e equipe. São destinados a acessos futuros, sujeitos a consentimento; não reclassificam o histórico nem foram distribuídos automaticamente.

## Evidências

- [Antes](evidence-cpc-test-2026-10-15/preflight.json) e [depois](evidence-cpc-test-2026-10-15/after.json), obtidos por GAQL.
- [Captura do CPC salvo](evidence-cpc-test-2026-10-15/mapa-cpc-045-confirmed.png).
- [Leitura da interface](evidence-cpc-test-2026-10-15/ads-cpc-confirmed.txt) e [regra de custo](evidence-cpc-test-2026-10-15/cost-rule-confirmed.txt).
- [Registro estruturado](cpc-test-execution-2026-10-15.json).

Sem deploy, alteração de ambiente/chave, chamadas pagas à IA, leitura de conteúdo privado de projetos ou envio de mensagens de divulgação.
