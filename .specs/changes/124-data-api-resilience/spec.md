# C124 — Ordem 3: falhas do Data API sem sucesso ou ausência falsos

Data: 20/10/2026. Base Git `7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`,
com C123 já modificada no workspace. Autoridade: pedido humano para executar
somente Ordem 3, sem commit/deploy/Ads/GA4/Supabase remoto.

## Escopo

SEC-07: leituras de projeto, descoberta, geração, snapshot/status, exportação,
integração, orientador, página privada e relatos de problemas. Helpers de perfil
e autorização compartilham o mesmo limite de leitura. Falhas não podem ser
interpretadas como projeto ausente, orientador ausente, legado disponível ou
persistência concluída.

- `loadOrThrow`: GET/HEAD do PostgREST, no máximo três tentativas e cinco segundos
  por leitura/lote, incluindo tempo de resposta; AbortSignal cancela a consulta
  ao esgotar o prazo. Esperas de 500 e 1500 ms, apenas para falhas transitórias.
  O retry nativo do SDK instalado é desligado nessas SELECTs com `.retry(false)`
  para não multiplicar as tentativas; isso foi testado com o cliente real e fetch
  sintético para HTTP 520 e erro de rede. Relógio monotônico mede o prazo.
- `PGRST303 / JWT issued at future`, indisponibilidade do pool/banco, falhas de
  rede reconhecidas e HTTP 5xx: 503 e `Retry-After: 2`. Outros erros não são
  repetidos. JWT expirado, permissões e constraints continuam falhando fechado.
- Escritas/RPC/IA nunca são repetidas pelo helper. UPDATEs do escopo retornam
  uma linha confirmada; zero linhas resulta em 409, erro de consulta em 5xx.
  PATCH de estrutura usa também a revisão lida como predicado de concorrência.
- Persistência incerta não é sobrescrita por uma limpeza que marca fracasso ou
  oculta o projeto. Não há transação nova nem migração: estados parciais continuam
  possíveis entre escritas diferentes e precisam ser conferidos antes de repetir.
- Mensagens públicas não incluem erro bruto, JWT, conteúdo ou credenciais.
  Identidade, filtros de proprietário, autorização e RLS não são relaxados.

## HTTP, página e progresso

- Erros anteriores ao primeiro progresso útil devolvem HTTP 503 de verdade,
  mesmo com `Accept: application/x-ndjson` (antes o wrapper iniciava HTTP 200).
- Depois do início do stream, os cabeçalhos HTTP já foram enviados. Falha tardia
  devolve **resultado terminal 503 + Retry-After**, reconstruído pelo cliente,
  com progresso `failed`, nunca `completed`. O HTTP do transporte permanece 200;
  alterar isso exigiria retirar streaming ou mudar seu protocolo. Não declarar
  cumprimento literal de “nunca HTTP 200” para falhas após o começo do stream.
- Server Components não definem HTTP 503 arbitrário. Falha transitória na página
  redireciona a `/service-unavailable`, que responde HTML **503 / Retry-After /
  private,no-store / noindex** e oferece retorno à biblioteca. O primeiro salto
  segue o protocolo de redirect do Next; o destino é 503. Não há falso notFound.

## Aceitação / entrega

Injeção sintética de PGRST303 em cada rota e loader, recuperação transitória,
falha persistente, limite de tempo, erro/zero linhas nas escritas, concorrência,
limpeza com erro, exportação e preservação das regras de autorização. Nenhuma
chamada externa/paga. Executar `npm run check`, `test:methodology`, `test:cards`,
`test:exports` e testes específicos. Diff incremental contra workspace anterior
à C124; preservar integralmente C123. Publicação não solicitada.
