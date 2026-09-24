# Learning record — Change 096

## Observação

SEO e GA4 podem parecer saudáveis isoladamente e ainda formar um sistema de divulgação não confiável. O site tinha metadados, sitemap, GA4 ativo e dezenas de eventos, mas duas homes canônicas dividiam os sinais e um parâmetro de produto contaminava a aquisição.

## Lições promovidas

1. Auditar em quatro camadas: repositório, site público, propriedade de mensuração e propriedade de busca.
2. Não reutilizar nomes de aquisição como source, medium, campaign, term ou content para contexto interno do produto.
3. Tráfego recebido não prova mensuração útil; key event, funil com dados e atribuição limpa são gates separados.
4. Google Ads deve permanecer bloqueado enquanto canonical, Search Console, consentimento e conversão principal não forem comprovados.
5. A landing escolhida para divulgação precisa ser avaliada junto com a raiz; neste caso, a landing dedicada teve LCP muito pior e reforçou a necessidade de consolidação.

## Lições rejeitadas

- considerar presença de eventos como prova de que o funil está configurado;
- inferir ausência ou presença no índice apenas por uma busca site:;
- ativar anúncios para “gerar dados” antes de corrigir a medição;
- promover FAQPage como oportunidade de rich result após a descontinuação do recurso;
- alterar configurações externas durante uma auditoria sem autorização de implementação.

## Evolução aplicada

- skill pessoal digital-discovery-audit;
- Digital Discovery & Growth blueprint v1.0;
- Pó Mágico v20260923.002;
- sequência C097–C100 com mídia paga atrás de gates.

## Confiança

Alta. As lições combinam evidência no código, produção, GA4 autenticado, DNS, Lighthouse e documentação oficial atual.
