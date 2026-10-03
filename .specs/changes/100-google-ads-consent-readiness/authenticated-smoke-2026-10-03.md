# C100/C108 — sessão autenticada no candidato

Data: 03/10/2026, America/Sao_Paulo.

## Resultado comprovado

- A conexão Supabase isolada passou a listar `aeaweherkrqmlqnxsmib`, nome `mapa-da-pesquisa`, estado `ACTIVE_HEALTHY`. O primeiro login pertencia às outras organizações; o segundo login liberou a organização correta do Mapa.
- Candidato: `dpl_Dqgt19WpQP1YAb86qKN29Sw2aoKX`, health `ok`, versão `v03102026.2`.
- Duas contas Auth descartáveis foram criadas, uma por perfil. A credencial administrativa foi usada apenas no runner para criar usuários, gerar links sem envio de e-mail, revogar sessões e apagar usuários. Não foi adicionada ao app, ao navegador, ao repositório ou às variáveis de produção.
- A sessão comum foi emitida por `verifyOtp`, usando a chave publicável. Inserts e leituras dos perfis e dos registros legais de fixture passaram pela Data API sob o JWT do respectivo usuário e pelas políticas RLS.
- Aluno: dashboard HTTP 200 com `Perfil Aluno`; configurações HTTP 200 com `Preferências da conta`.
- Orientador: dashboard HTTP 200 com `Perfil Orientador`; configurações HTTP 200 com `Preferências da conta`.
- Para cada perfil, o runner simulou metadados de sessão expirados no cookie SSR, preservando tokens emitidos pelo Auth. O proxy renovou a sessão, devolveu cookie Auth atualizado e cabeçalhos de não-cache, e o dashboard continuou HTTP 200 com o perfil correto.
- As sessões de ambas as contas foram revogadas. Ambas as contas foram apagadas, e `getUserById` confirmou que não existiam mais. As linhas de fixture ligadas ao usuário têm exclusão em cascata.
- Consulta de logs do candidato, filtro `error`, janela de dez minutos: nenhuma entrada retornada. O smoke não reproduziu `profile_unavailable` ou `JWT issued at future`.
- O teste não mudou provedores de login, redirects, migrations ou permissões de produção. O formulário público continua usando Google.

## Limites da prova

O smoke verifica Auth → cookie SSR → proxy → perfil/RLS → páginas autenticadas no candidato. Ele não executa o consentimento OAuth do Google, não prova eventos recebidos no GA4 e não cria projetos ou workflows. A causa original do desalinhamento temporal de JWT permanece sem confirmação no serviço upstream.

Os verificadores PostgreSQL isolados também passaram para troca de perfil, autoria, vínculo, regras de acesso, exigência de aprovação do aluno e autonomia do orientador. Essas simulações locais não substituem a prova no domínio publicado.

## Publicação preparada e bloqueio de aprovação

A tentativa de `vercel promote dpl_Dqgt19WpQP1YAb86qKN29Sw2aoKX --yes` foi rejeitada antes da execução pela revisão automática: a autorização explícita abrangia o teste E2E, mas não aprovava claramente a promoção remota ao domínio principal. Nenhum comando alternativo foi usado para promover a versão.

Estado público confirmado antes da tentativa: `https://mapadapesquisa.com.br/api/health`, `ok`, `v01102026.4`. O release anterior é `dpl_5HNbcpExdtFzQRgNBYKPbGWLWC98`.

Plano apresentado antes da aprovação explícita:

1. Promover exclusivamente `dpl_Dqgt19WpQP1YAb86qKN29Sw2aoKX` ao domínio principal.
2. Confirmar health `ok`/`v03102026.2` e repetir o smoke com contas descartáveis diretamente no domínio canônico.
3. Se falhar, promover imediatamente o release anterior `dpl_5HNbcpExdtFzQRgNBYKPbGWLWC98`, conferir health `ok`/`v01102026.4` e registrar a causa.
4. Após publicação segura, verificar GA4 real: consentimento, evento após criação persistida, deduplicação, ausência de PII e atribuição. Só então concluir a prontidão para Google Ads.

Nenhuma campanha, vínculo Ads, importação de conversões ou gasto foi criado nesta verificação.

## Publicação autorizada e verificada

O usuário autorizou a promoção controlada ao responder “pode seguir”. Foi promovido exclusivamente `dpl_Dqgt19WpQP1YAb86qKN29Sw2aoKX`. O domínio `https://mapadapesquisa.com.br/api/health` confirmou `ok`/`v03102026.2`.

O runner foi repetido no domínio canônico, sem bypass de proteção Vercel: os doze checks de sessão/perfil próprio, dashboard, configurações, refresh com cookie e não-cache, revogação e exclusão passaram para as duas contas descartáveis. Não foi necessário reverter. Consulta dos logs `error` desse deployment na janela de dez minutos retornou zero entradas.

Isso encerra o bloqueio de autenticação/publicação observado nesta tarefa, não a validação da conversão ou da atribuição GA4. A inspeção posterior de consentimento encontrou um problema distinto de contexto de URL em eventos analíticos, registrado em `implementation-2026-10-03.md`.

## Release posterior de privacidade

O problema analítico foi corrigido no commit `9ada964` e publicado em `v03102026.3`, deployment `dpl_CxWHb7xSbp9HrfhwhSJTP3TTdEqd`. O mesmo smoke autenticado passou no candidato e novamente no domínio principal. A execução canônica foi ampliada com criação e leitura RLS de projetos, deduplicação de `project_start`, exclusão dos projetos e inspeção da coleta interceptada. Os dezesseis checks passaram, com exclusão das contas e revogação de sessões. [Evidência e limites da medição](analytics-collection-2026-10-03.md).
