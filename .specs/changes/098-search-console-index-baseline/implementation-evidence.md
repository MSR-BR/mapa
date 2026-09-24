# Evidências de implementação — Change 098

Data da execução: 24/09/2026
Estado: concluída

## Propriedade e DNS

- Conta responsável confirmada no Search Console.
- Propriedade de domínio `sc-domain:mapadapesquisa.com.br` criada e verificada
  pelo método DNS em 24/09/2026.
- Foi adicionado somente um TXT de verificação no apex. O valor completo não é
  repetido neste artefato; ele permanece publicamente consultável no DNS.
- O TXT respondeu nos autoritativos `d.sec.dns.br` e `e.sec.dns.br`, no
  resolvedor local e no Cloudflare `1.1.1.1`.
- A, MX, DMARC, DKIM, SPF do subdomínio de envio, DS e DNSKEY foram comparados
  antes/depois e permaneceram inalterados.

## Sitemap

- `https://mapadapesquisa.com.br/sitemap.xml` foi submetido com sucesso em
  24/09/2026.
- O estado inicial foi `Couldn't fetch`; após a leitura seguinte, o Search
  Console registrou `Sitemap processed successfully`, duas páginas descobertas
  e zero vídeos.
- A verificação independente retornou HTTP 200, `Content-Type:
  application/xml`, resposta HTTP 200 com user-agent Googlebot e XML bem
  formado pelo `xmllint`, com duas URLs.
- O sitemap foi processado sem remoção, reenvio destrutivo ou alteração de
  conteúdo durante a janela de propagação.

## Inspeção de URLs

- `https://mapadapesquisa.com.br/`: está no Google e indexada; última captura
  em 12/09/2026 por Googlebot smartphone; fetch bem-sucedido; indexação
  permitida; canonical declarada e selecionada apontam para a raiz.
- `https://mapadapesquisa.com.br/home.html`: ainda desconhecida pelo índice; o
  teste ao vivo confirmou HTTP acessível, rastreamento e indexação permitidos,
  canonical declarada para a própria `/home.html` e vídeo detectado.
- `https://mapadapesquisa.com.br/login`: desconhecida pelo índice; o teste ao
  vivo confirmou bloqueio por `robots.txt`, comportamento esperado para a rota
  de autenticação.
- `http://mapadapesquisa.com.br/`: desconhecida pelo índice; HTTP responde 308
  para HTTPS e o teste ao vivo declarou a canonical HTTPS da raiz.
- O host técnico legado testado responde 308 para outro host técnico da Vercel;
  ele não pertence à propriedade de domínio e não foi alterado nesta Change.

## Baseline dos relatórios

- Performance: processamento inicial; sem dados disponíveis para consultas,
  páginas, cliques, impressões, CTR ou posição em 24/09/2026.
- Page indexing: processamento inicial; sem contagem agregada disponível.
- Core Web Vitals: dados de uso insuficientes nos últimos 90 dias para mobile e
  desktop.
- Settings: propriedade adicionada em 24/09/2026 e conta autenticada exibida
  como proprietária verificada.

## Associação GA4

- Propriedade selecionada: `Mapa da Pesquisa (550650234)`.
- Fluxo selecionado: `Mapa da Pesquisa — Web`, ID `15460310071`, URL
  `https://mapadapesquisa.com.br`.
- A associação foi confirmada em 24/09/2026.
- O Search Console exibe GA4, Mapa da Pesquisa e o stream Web na lista de
  serviços associados.
- O GA4 exibe o domínio, o tipo Domain, o stream `15460310071`, a conta que
  realizou a ligação e a data em Admin > Product links > Search Console links.

## Fechamento

- Todos os critérios de aceite foram comprovados em 24/09/2026; os relatórios
  agregados continuam sujeitos ao processamento normal do Google.

## CPD

- Contexto: a C096 encontrou ausência de propriedade Search Console e de vínculo
  com GA4; a C097 reparou a taxonomia e iniciou a janela de observação.
- Problema: não havia governança autoritativa da indexação nem baseline orgânico.
- Decisão: criar uma propriedade de domínio, verificar por um único TXT,
  preservar integralmente a zona, enviar o sitemap e coletar evidência direta.
- Estado: propriedade, DNS, sitemap, vínculo GA4 e baseline inicial concluídos;
  C098 encerrada sem alteração de código ou deploy.
- Pó Mágico evoluído para `po_magico_v20260924.002.md`, com Digital Discovery
  & Growth v1.2.
