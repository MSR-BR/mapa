# Change 038 — Domínio `www`

**Estado: Concluída em 20/08/2026**

## Objetivo

Decidir se `www.mapadapesquisa.com.br` fará parte do endereço público e manter
uma única URL canônica sem quebrar autenticação, e-mails ou indexação.

## Decisão

O endereço público oficial é `https://mapadapesquisa.com.br`. O subdomínio
`www.mapadapesquisa.com.br` não será publicado nesta fase: ele não foi
registrado no Vercel nem no DNS, evitando uma segunda superfície de
autenticação, indexação e suporte. Os endereços técnicos antigos da Vercel
continuam redirecionando permanentemente para o domínio canônico.

## Submudanças

1. Registrar a decisão sobre o uso de `www`.
2. Como `www` foi rejeitado, nenhum alias ou registro DNS adicional é criado.
3. Manter os redirecionamentos permanentes dos hosts técnicos antigos para
   `https://mapadapesquisa.com.br`.
4. Atualizar URL canônica, `NEXT_PUBLIC_APP_URL`, links de suporte, sitemap,
   robots, Open Graph e landing page.
5. Atualizar Supabase Auth, Google OAuth, callbacks, magic links e webhook URLs.
6. Testar login por e-mail e Google, logout, callbacks, exportações e suporte
   no endereço canônico.

## Critérios de aceite

- Existe apenas um endereço canônico indexável.
- Os hosts técnicos antigos redirecionam preservando o fluxo autorizado; o
  host `www` permanece deliberadamente não publicado.
- Nenhum callback, link de e-mail ou webhook usa host antigo incorretamente.
- Sitemap, canonical e metadados apontam para o host escolhido.
