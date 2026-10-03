# C100/C108 — contexto privado e conversão persistida

Data: 03/10/2026. Escopo autorizado: correções necessárias no app/medição para preparar Ads. Campanha e gasto não iniciados.

## Defeito observado e correção

Em `v03102026.2`, a tag real anexava a URL original ao evento `consent_choice`, embora `page_view` recebesse URL sanitizada. Um parâmetro fictício de teste comprovou a diferença. Todas as requisições GA4 desses testes foram interceptadas antes de chegar ao Google.

Commit `9ada964` sanitiza `page_location`, `page_referrer` e `page_title` na configuração e nos eventos do app; preserva apenas os parâmetros de campanha já permitidos na landing, usa título genérico e referrer interno sanitizado/externo limitado à origem. Não muda os eventos `app_*` ou as regras de consentimento.

A configuração é enfileirada antes de carregar a tag externa. Um teste com a tag real mostrou que filas de arrays comuns não eram processadas; a implementação mantém objetos `Arguments` conforme o protocolo gtag, com teste de regressão. Não foi adicionada dependência nem alterada a CSP.

Referências de interpretação: [configuração de contexto GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) e [page views e enhanced measurement](https://developers.google.com/analytics/devguides/collection/ga4/views). `send_page_view: false` não substitui a revisão de eventos automáticos de histórico no painel.

## Publicação

- Deployment: `dpl_CxWHb7xSbp9HrfhwhSJTP3TTdEqd`, versão `v03102026.3`, Production.
- Domínio: `https://mapadapesquisa.com.br`; health `ok`/`v03102026.3`.
- Código testado: lint, TypeScript, 158 testes gerais + 13 DOI, build e auditoria de segurança. A auditoria conserva os riscos residuais já aceitos; não significa ausência de todos os riscos.
- Testes de sessão/perfil/refresh passaram no candidato antes da promoção e novamente no domínio canônico.
- Consulta dos logs `error` desse deployment na janela de dez minutos após os smokes: nenhuma entrada retornada e nenhuma ocorrência de `profile_unavailable` entre as entradas retornadas.
- Rollback disponível para `dpl_Dqgt19WpQP1YAb86qKN29Sw2aoKX` (`v03102026.2`); não foi necessário.

## Coleta verificada com a tag real publicada

Tag `G-MKFYYRZG87`. Navegadores isolados, sem sessão Google do usuário. As requisições de coleta foram interceptadas e receberam resposta simulada; não são prova de recebimento na propriedade.

| Escolha | Tag carregada | Eventos observados |
|---|---:|---|
| Sem escolha | 0 | Nenhum |
| Recusar todos | 0 | Nenhum |
| Somente publicidade | 0 | Nenhum |
| Somente métricas | 1 | Um `consent_choice`, um `page_view` |
| Métricas + publicidade | 1 | Um `consent_choice`, um `page_view` |

Nos dois casos com métricas, as UTMs de teste foram preservadas e o parâmetro privado de teste não apareceu em nenhum payload observado. Consentimento de publicidade respeitou a escolha separada; personalização permaneceu negada. `ERR_ABORTED` nas requisições interceptadas é consequência da resposta simulada 204, não diagnóstico de falha de produção.

## Criação persistida e deduplicação

Foram usadas duas contas Auth descartáveis, uma de aluno e uma de orientador. A credencial administrativa serviu somente ao ciclo de vida das fixtures; interação do navegador, criação de projeto e leitura confirmatória usaram sessão comum do usuário e RLS.

No domínio canônico, para cada perfil:

1. Abrir dashboard/configurações com o perfil correto.
2. Criar projeto pelo formulário real sem geração IA e confirmar sua persistência/proprietário/modo por leitura RLS.
3. Observar um único `project_start` na coleta interceptada.
4. Revisitar a URL com `created=1` na mesma aba: nenhum segundo `project_start`.
5. Confirmar ausência de falsa conclusão e dos valores fictícios de título/UUID/e-mail nos payloads.
6. Apagar projetos com a sessão comum, revogar sessões, apagar os usuários descartáveis e confirmar exclusão.
7. Renovação SSR manteve dashboard acessível, cookie atualizado e cabeçalhos não-cache.

Os dezesseis checks do runner expandido passaram. Nenhuma conta ou projeto real foi modificado. O teste não executa o consentimento OAuth Google nem o fluxo completo de revisão/conclusão pelo orientador.

## SEO público revalidado

Raiz HTTP 200 e canonical para o domínio principal; `robots.txt` e `sitemap.xml` HTTP 200; sitemap com uma URL (`https://mapadapesquisa.com.br/`); login HTTP 200 com `noindex`. Isso não é nova prova de indexação no Search Console nem nova amostra de performance móvel.

## Pendências que impedem declarar Ads pronto

- Ler DebugView/Realtime e confirmar recebimento de uma conversão real, não apenas sua requisição de saída.
- Confirmar/ajustar `project_start` como key event após a prova; não foi remarcado nesta execução.
- Revisar enhanced measurement, filtros internos, funil e atribuição `source/medium` na propriedade `550650234`.
- Observar dados pós-correção sem misturar semânticas antigas; 08/10 continua sendo ponto de reavaliação, não garantia de campanha.
- Confirmar conta Ads/moeda, segmentação, geografia, negativas e stop-loss para o orçamento aprovado de €2/dia.

A abertura do GA4 no Codex foi solicitada e ficou `queued`. Não há ferramenta nesta sessão para ler ou operar o painel autenticado. Nenhum vínculo/importação/campanha foi criado. As skills Digital Discovery Audit e Next.js orientaram, respectivamente, a prova de payload/limite de evidência e a ordem segura de carregamento da tag.
