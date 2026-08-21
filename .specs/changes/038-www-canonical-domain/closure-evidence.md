# Evidências de encerramento — Change 038

Data da verificação: 20/08/2026.

- Vercel associa `mapadapesquisa.com.br` ao projeto `mapadapesquisa`.
- `https://mapadapesquisa.com.br` respondeu `HTTP 200`.
- `https://mapadapesquisa.vercel.app` respondeu `HTTP 308` para
  `https://mapadapesquisa.com.br/`.
- `https://mapa-gray-two.vercel.app` respondeu `HTTP 308` para o host Vercel
  canônico, que por sua vez redireciona para o domínio público.
- `www.mapadapesquisa.com.br` não possui resolução DNS e não foi adicionado ao
  projeto Vercel; isso confirma a decisão de não publicar `www`.
- Código, `NEXT_PUBLIC_APP_URL`, canonical, sitemap, robots, Open Graph,
  suporte, callbacks de autenticação e exportações apontam para o domínio
  principal.
- As variáveis de ambiente de produção relacionadas ao domínio existem no
  projeto Vercel; o valor público esperado é `https://mapadapesquisa.com.br`.
- O estado validado foi publicado em produção no deployment `dpl_8Zm3HZvELhvuwDRFYENuvrzwAu6p`, com aliases para o domínio raiz e os hosts técnicos antigos.

Conclusão: existe um único endereço público indexável e os hosts técnicos
antigos não competem com ele.
