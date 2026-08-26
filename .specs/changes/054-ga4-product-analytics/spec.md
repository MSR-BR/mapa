# Change 054 — Instrumentação de produto e funis no GA4

Status: concluída em 25/08/2026

## Origem

Solicitação para tornar o GA4 útil para acompanhar, com consentimento, o uso
anônimo e autenticado do Mapa da Pesquisa: início e conclusão de projetos,
abandono, avanço por etapas, uso dos modos rápido e avançado, interação
aluno–orientador, falhas de geração, literatura, exportação e suporte.

## Objetivo

Criar um contrato único e auditável de eventos para que a equipe consiga
responder:

1. quantas pessoas visitam o app sem login e quantas entram autenticadas;
2. quantas iniciam uma jornada de projeto, avançam e concluem;
3. em que etapa as jornadas param, precisam de retry ou ficam bloqueadas;
4. como os modos Mapa Rápido e Mapa Avançado se comportam;
5. se o vínculo e a revisão do orientador ajudam o aluno a concluir;
6. se Research Starter, Gemini, otimização da literatura, PDF e suporte estão
   funcionando sem aumentar erros ou abandonar a privacidade.

Esta Change define e implementa a medição. A configuração das definições
personalizadas e dos relatórios no painel do GA4 continua sendo uma etapa
operacional externa, descrita no runbook, porque depende de acesso ao painel.

## Evidência técnica revisada

O código implementado possui:

- carregamento do GA4 somente depois do consentimento em
  `modules/analytics/analytics-consent.tsx`;
- Measurement ID configurado no ambiente;
- contrato tipado de eventos de produto, contexto e parâmetros enumerados em
  `modules/analytics/analytics.ts`;
- eventos emitidos nos callbacks de autenticação, projeto, geração, etapas,
  orientador, literatura, integração, exportação, suporte e bugs;
- textos de consentimento que proíbem enviar prompts, projetos e e-mails ao
  Google.

O contrato atual é insuficiente porque não transporta contexto controlado
(estado de autenticação, papel, modo de entrada, produto, etapa e resultado),
não diferencia início de conclusão de projeto e não registra o fluxo do
orientador.

## Princípios de medição

- **Consentimento primeiro:** nenhum evento não essencial é enviado antes da
  escolha “Aceitar métricas”. Se o usuário recusar, não carregar o script nem
  enviar eventos ao GA4.
- **Sem conteúdo acadêmico:** nunca enviar prompt, resposta das cinco
  perguntas, título, problemática, objetivos, justificativas, referências,
  abstract, DOI, comentários, e-mails, nome do usuário ou texto de suporte.
- **Sem identificadores diretos:** não enviar `user_id`, e-mail, UUID de
  projeto, UUID de referência, UUID de orientador ou qualquer chave de banco.
  O identificador pseudônimo gerenciado pelo próprio GA4 permanece sob as
  regras da plataforma e do consentimento.
- **Valores enumerados:** parâmetros devem ser pequenas listas fechadas,
  normalizadas e validadas por uma camada única. Valores desconhecidos viram
  `unknown`; texto livre é descartado.
- **Ação de domínio, não clique visual:** o evento deve ser emitido quando a
  operação realmente começa, termina ou falha. Não emitir novamente por
  re-render, abertura de modal ou clique duplicado.
- **Separar produto de operação:** GA4 mede comportamento agregado; contagens
  exatas de projetos e auditoria operacional continuam no Supabase, sem
  exportar o conteúdo para o Google.

## Contrato comum de parâmetros

Todo evento de produto, salvo `consent_choice` e `page_view` gerado pelo
Google, pode usar apenas estes parâmetros:

| Parâmetro | Valores permitidos | Uso |
|---|---|---|
| `auth_state` | `anonymous`, `authenticated` | distingue acesso sem e com login |
| `profile_role` | `student`, `advisor`, `unknown` | papel ativo; `unknown` para anônimo |
| `source` | `home`, `dashboard`, `resume`, `email`, `advisor_dashboard`, `unknown` | origem da ação |
| `entry_mode` | `quick`, `advanced`, `unknown` | modo de criação escolhido |
| `product_type` | `tcc`, `monograph`, `dissertation`, `thesis`, `article`, `other`, `unknown` | tipo acadêmico escolhido |
| `stage` | `discovery`, `problem`, `definition`, `literature`, `methodology`, `final`, `unknown` | etapa do fluxo |
| `result` | `started`, `success`, `failed`, `blocked`, `retry`, `cancelled` | resultado da ação |
| `reason_code` | enum sanitizado definido abaixo | diagnóstico sem texto livre |
| `reference_count_bucket` | `0`, `1_5`, `6_20`, `21_plus`, `unknown` | quantidade aproximada sem enviar referências |
| `has_advisor` | `yes`, `no`, `unknown` | vínculo já existente, sem identificar a pessoa |
| `stage_number` | `1`, `2`, `3`, `4`, `5`, `6`, `unknown` | número visual da etapa |

`profile_role`, `entry_mode` e `product_type` devem ser enviados como
parâmetros de evento, e não como propriedades persistentes de usuário. Assim
uma troca de perfil não contamina as sessões seguintes.

### Códigos de motivo permitidos

`auth_required`, `validation`, `consent_required`, `provider_timeout`,
`provider_unavailable`, `provider_invalid_response`, `rate_limited`,
`network`, `advisor_pending`, `advisor_correction`, `duplicate_action`,
`unknown`.

É proibido enviar a mensagem original do erro, stack trace, prompt ou
resposta de provedor como `reason_code` ou outro parâmetro.

## Eventos a implementar

### Acesso, consentimento e autenticação

| Evento | Quando emitir | Parâmetros adicionais |
|---|---|---|
| `consent_choice` | usuário aceita ou recusa métricas | `result=accepted` ou `result=rejected` |
| `page_view` | manter o page view automático do GA4 | `auth_state`, `source` quando disponível |
| `login_started` | usuário inicia e-mail ou Google | `source` |
| `login_success` | sessão autenticada confirmada | `auth_state=authenticated`, `profile_role`, `source` |
| `login_failed` | tentativa falha após retorno conhecido | `result=failed`, `reason_code` |
| `logout` | sessão encerrada | `auth_state=authenticated`, `profile_role` |
| `profile_role_selected` | primeira escolha ou troca de aluno/orientador | `profile_role`, `source` |

O evento `login_success` deve ocorrer depois de `getSession`/callback confirmar
a sessão, nunca apenas no clique do botão.

### Descoberta e projeto

| Evento | Quando emitir | Parâmetros adicionais |
|---|---|---|
| `project_start` | briefing válido é aceito para iniciar a jornada | `entry_mode`, `product_type`, `source` |
| `project_draft_saved` | rascunho persistido com sucesso | `entry_mode`, `stage`, `stage_number` |
| `project_resumed` | usuário retoma projeto já salvo | `source`, `stage`, `stage_number`, `has_advisor` |
| `generation_started` | chamada de geração é realmente enviada | `entry_mode`, `product_type` |
| `generation_completed` | propostas/cards válidos chegam à interface | `result=success`, `reference_count_bucket` |
| `generation_failed` | tentativa termina sem propostas utilizáveis | `result=failed`, `reason_code` |
| `generation_retry` | usuário solicita nova tentativa | `result=retry`, `reason_code` |
| `proposal_viewed` | seis cards ou conjunto final é exibido | `entry_mode`, `product_type` |
| `proposal_selected` | usuário escolhe uma proposta | `entry_mode`, `product_type` |

`project_start` representa início de uma jornada, não criação de uma linha
bruta no banco. `project_completed` só deve ser emitido após a conclusão real
e persistida do mapa final.

### Etapas e orientador

| Evento | Quando emitir | Parâmetros adicionais |
|---|---|---|
| `stage_started` | etapa é aberta para edição | `stage`, `stage_number`, `profile_role`, `has_advisor` |
| `stage_saved` | alterações da etapa foram persistidas | `stage`, `stage_number`, `result=success` |
| `stage_submitted` | aluno/orientador envia a etapa para validação | `stage`, `stage_number`, `profile_role` |
| `stage_completed` | etapa passa pela validação aplicável e é persistida | `stage`, `stage_number`, `profile_role` |
| `stage_blocked` | validação impede avanço | `stage`, `stage_number`, `result=blocked`, `reason_code` |
| `stage_revision_requested` | orientador devolve a etapa para correção | `stage`, `stage_number`, `reason_code=advisor_correction` |
| `advisor_link_started` | aluno informa ou procura orientador | `profile_role=student` |
| `advisor_link_succeeded` | vínculo confirmado | `profile_role=student`, `has_advisor=yes` |
| `advisor_link_pending` | convite aguarda criação/aceite da conta | `profile_role=student`, `reason_code=advisor_pending` |
| `advisor_review_opened` | orientador abre etapa enviada | `profile_role=advisor`, `stage`, `stage_number` |
| `advisor_approved` | orientador aprova etapa | `profile_role=advisor`, `stage`, `stage_number`, `result=success` |
| `advisor_correction_requested` | orientador solicita correção | `profile_role=advisor`, `stage`, `stage_number`, `reason_code=advisor_correction` |

Comentários do orientador nunca são enviados ao GA4. O evento registra apenas
o tipo de decisão e a etapa.

### Literatura, integração e entrega

| Evento | Quando emitir | Parâmetros adicionais |
|---|---|---|
| `literature_optimization_started` | nova busca é enviada ao Research Starter | `stage=literature`, `reference_count_bucket` |
| `literature_optimization_completed` | referências e associações novas são persistidas | `result=success`, `reference_count_bucket` |
| `literature_optimization_failed` | busca termina sem resultado utilizável | `result=failed`, `reason_code` |
| `project_integration_started` | integração de projetos é confirmada | `profile_role`, `source` |
| `project_integration_completed` | mapa integrado é persistido | `result=success`, `reference_count_bucket` |
| `project_integration_failed` | integração falha | `result=failed`, `reason_code` |
| `project_completed` | mapa final validado e salvo | `stage=final`, `result=success`, `reference_count_bucket` |
| `export_pdf_started` | geração do PDF começa | `stage=final`, `product_type` |
| `export_pdf_completed` | PDF é baixado/gerado com sucesso | `result=success`, `product_type`, `reference_count_bucket` |
| `export_pdf_failed` | exportação falha | `result=failed`, `reason_code` |
| `support_opened` | modal de suporte é aberto | `source` |
| `support_submitted` | formulário de suporte é aceito pelo endpoint | `result=success`, `source` |
| `bug_report_submitted` | relato de bug é persistido | `result=success`, `source` |

O sucesso de `support_submitted`/`bug_report_submitted` significa apenas que o
endpoint recebeu o relato. Entrega de e-mail é observada pelos logs do Resend,
não pelo GA4.

## Métricas e funis

### KPIs primários

1. **Taxa de ativação autenticada** — sessões autenticadas com
   `project_start` dividido por sessões com `login_success`, por período e
   separado por `entry_mode`. É o melhor sinal de que o login não interrompe a
   entrada no Mapa.
2. **Taxa de conclusão da jornada** — coorte de sessões com `project_start`
   que também registra `project_completed` em até 30 dias. A coorte deve ser
   lida por modo, tipo de produto e papel, sem identificar o projeto.
3. **Taxa de validação do orientador** — jornadas com `advisor_link_succeeded`
   e `stage_submitted` que chegam a `advisor_approved`, em até 30 dias. Deve
   ser acompanhada junto da taxa de correção solicitada, para não premiar
   aprovações indevidas.

### Métricas de diagnóstico

- login success rate e login failure rate;
- proporção de acessos anônimos versus autenticados após consentimento;
- distribuição Mapa Rápido/Mapa Avançado;
- visualização → seleção de proposta;
- avanço por etapa (`stage_started` → `stage_submitted` → `stage_completed`);
- taxa de bloqueio, retry e correção por etapa;
- taxa de retomada após rascunho;
- tempo mediano entre `project_start`, `stage_completed` e `project_completed`;
- proporção de jornadas iniciadas sem conclusão em 7 e 30 dias;
- sucesso/falha de Gemini, Research Starter e otimização da literatura;
- integração de projetos iniciada → concluída;
- exportação PDF concluída por tipo de produto;
- abertura → envio de suporte e bug report.

### Definição de “começou e não terminou”

Não emitir evento de abandono no `beforeunload`: ele é instável e gera falsos
positivos. A métrica é uma coorte derivada:

`project_start` sem `project_completed` em 7 dias (alerta precoce) ou em 30
dias (abandono operacional).

Sem enviar UUID de projeto, essa métrica é uma aproximação por sessão/usuário
pseudônimo do GA4. A contagem exata por projeto deve vir de uma view agregada
do Supabase, com acesso restrito, e não de uma dimensão do GA4.

### Guardrails

- **Privacidade:** zero parâmetros com PII ou conteúdo acadêmico;
- **Consentimento:** zero eventos GA4 quando a escolha for “Recusar”;
- **Qualidade:** duplicidade de eventos abaixo de 1% em testes;
- **Confiabilidade:** taxa de `generation_failed` e `export_pdf_failed` visível
  por versão;
- **Custo:** nenhum envio adicional ao Gemini/Research Starter causado pela
  instrumentação;
- **Equidade do fluxo:** comparar aluno e orientador sem expor identidades;
- **Retenção:** manter no GA4 somente a retenção configurada para analytics e
  no Supabase apenas os agregados operacionais necessários.

## Implementação realizada

1. Expandir `modules/analytics/analytics.ts` para aceitar um tipo fechado de
   evento e parâmetros, remover o rastreamento baseado somente em `data-*` e
   adicionar sanitização central.
2. Criar helpers para obter `auth_state`, `profile_role`, `source`,
   `entry_mode`, `product_type` e `stage` sem acessar conteúdo textual.
3. Emitir eventos nos callbacks de domínio (sessão confirmada, persistência,
   resposta válida, aprovação, exportação), com proteção contra duplicidade.
4. Manter o consentimento atual como bloqueio de carregamento do GA4 e
   registrar `consent_choice` somente depois que o script for inicializado.
5. Registrar no GA4 as definições personalizadas de `auth_state`,
   `profile_role`, `source`, `entry_mode`, `product_type`, `stage`, `result`,
   `reason_code`, `reference_count_bucket` e `has_advisor`.
6. Criar um relatório/funil no GA4 para os três KPIs primários e painéis de
   diagnóstico por modo, papel, produto, etapa e versão.
7. Documentar no runbook quais perguntas devem ser respondidas pelo GA4 e
   quais dependem de agregação do Supabase.

## Critérios de aceite

1. Acesso anônimo, login e troca de papel aparecem no DebugView somente após
   consentimento.
2. Uma jornada rápida e uma avançada produzem eventos de início, geração,
   seleção, etapas, conclusão e exportação sem duplicação.
3. Uma falha de Gemini/Research Starter produz somente `reason_code`, sem
   prompt, resposta, stack trace ou conteúdo acadêmico.
4. O fluxo aluno–orientador registra vínculo, envio, abertura, aprovação e
   correção; comentários e identidades não vão para o GA4.
5. O abandono é calculado por coorte, não por `beforeunload`.
6. Recusar métricas impede script, eventos e cookies não essenciais.
7. E2E verifica Mapa Rápido, Mapa Avançado, aluno, orientador, retry,
   retomada, otimização da literatura, PDF, suporte e bug report.
8. Teste automatizado falha se aparecer nome de evento fora da allowlist,
   parâmetro livre ou valor não enumerado.
9. A documentação de privacidade e os termos explicam analytics agregado e a
   opção de recusa.
10. A versão do rodapé é atualizada para `v25082026.6` após a implementação,
    validação e publicação aprovadas.

## CPD desta Change

- **Contexto:** GA4 tinha apenas cinco eventos sem contexto suficiente para
  medir a jornada completa.
- **Problema:** não era possível distinguir acesso anônimo/autenticado, modos,
  papéis, início/conclusão, abandono, bloqueios e validação do orientador de
  forma consistente.
- **Decisão:** contrato tipado, parâmetros enumerados, consentimento antes do
  rastreamento, nenhum conteúdo acadêmico/PII e separação entre GA4 agregado e
  Supabase operacional.
- **Próximo passo:** cadastrar as definições personalizadas e os relatórios no
  painel do GA4 e confirmar os eventos no DebugView com uma sessão de teste.
- **Estado:** implementação, publicação e smoke de produção concluídos;
  evidências em `closure-evidence.md`.
