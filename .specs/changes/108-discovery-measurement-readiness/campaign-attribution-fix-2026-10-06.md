# C108 — entrada de campanha autenticada corrigida em 06/10/2026

Estado: **correção publicada e recebimento das UTMs comprovado no GA4**, sem declarar atribuição processada ou baseline aprovados. Não houve ativação de Ads.

## Defeito e correção

Uma visita autenticada à raiz com `utm_source=codex_validation&utm_medium=qa&utm_campaign=c108_20261006` era redirecionada pelo servidor para `/dashboard?continue=1` e depois para o projeto existente. A página pública não renderizava e os parâmetros desapareciam antes da coleta. Isso explica a perda de campanha nesse caminho específico; não comprova a causa de todas as linhas históricas `(not set)`.

O servidor agora mantém a landing quando há `utm_source`, `gclid`, `gbraid` ou `wbraid` válidos. A validação compartilhada admite somente valores delimitados e seguros, recusando parâmetros repetidos ou livres. A sanitização continua removendo queries privadas e UUIDs. Visita autenticada sem campanha continua retomando o projeto. O cabeçalho oferece “Meus projetos”; o formulário autenticado encaminha ao dashboard sem registrar um novo início de login.

## Release e verificações

- Commit `c54a30b`, tag `v06102026.1`.
- Candidato Vercel `dpl_r96GZ5TcYBX4EbQ1Nm5M1pxaF8NN`, promovido ao domínio canônico após build e health aprovados.
- `NEXT_PUBLIC_APP_VERSION` de produção alinhado a `v06102026.1`.
- Lint, TypeScript, grants explícitos, 159 testes gerais + 13 DOI e exportações aprovados. A compilação local foi impedida primeiro pelo acesso às fontes e depois por restrição de processo/porta do Turbopack. O build real na Vercel compilou e concluiu com sucesso; não registrar o comando local `npm run check` como integralmente aprovado.
- Smoke anônimo no candidato: landing, login e versão corretos, sem erro de servidor.
- Smoke autenticado canônico: URL com as três UTMs permaneceu na landing; o acesso à raiz sem parâmetros retomou o projeto QA existente. Nenhum novo projeto foi criado nesta execução.
- Consentimento conferido na interface: métricas aceitas, publicidade recusada. Tag presente: `G-MKFYYRZG87`.

## Evidência na propriedade 550650234

Em Realtime > Event count > page_view > page_location, o painel exibiu:

| URL recebida | Contagem naquele instante |
| --- | ---: |
| `https://mapadapesquisa.com.br/?utm_source=codex_validation&utm_medium=qa&utm_campaign=c108_20261006` | 2 |
| `https://mapadapesquisa.com.br/dashboard` | 2 |
| `https://mapadapesquisa.com.br/dashboard/projects/project` | 1 |

As duas ocorrências públicas correspondem a duas visitas deliberadas; não constituem prova de duplicidade nem um teste completo de deduplicação. A URL privada recebida está sem UUID. O painel First user source ainda não mostrou valor; uma visita de campanha dentro de uma sessão preexistente não comprova uma nova origem de sessão.

Evidências: [landing autenticada](evidence-2026-10-06/campaign-landing-authenticated-fixed.png), [recebimento no GA4](evidence-2026-10-06/ga4-campaign-page-location-received.png), [leitura da tabela](evidence-2026-10-06/ga4-campaign-page-location-received.txt).

## Limites e continuidade

Conferir aquisição por Session source / medium e campanha no recorte posterior à publicação, após processamento. Segmentar o tráfego QA, validar o funil e fechar o baseline exigido nas specs. A lista operacional exige 14 dias limpos após a última correção relevante; para este caminho corrigido em 06/10, a janela não pode terminar antes de 20/10, sujeita a evidência e ausência de novas correções. Essa é uma regra do plano do projeto, não uma exigência do Google para criar anúncios.

A C109 segue como rascunho na MSR-BR, com nome final e €2/dia salvos; a autorização de ativação continua condicionada ao GA4 validado. A automação histórica de 08/10 pode reavaliar, mas não aprovar a nova janela pela data original.

Reversão técnica: promover o deployment anterior `dpl_CxWHb7xSbp9HrfhwhSJTP3TTdEqd` e restaurar o identificador público `v03102026.3`. Isso reintroduziria a perda de campanha autenticada. Nenhuma configuração remota de GA4 foi modificada nesta correção.
