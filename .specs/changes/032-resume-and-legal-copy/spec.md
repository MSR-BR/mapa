# Change 032 — Retomada pós-login, dashboard recolhido e textos legais

## Objetivo

Garantir que o preenchimento avançado iniciado antes do login continue depois da
autenticação e do aceite inicial, criando o projeto e abrindo a descoberta nas
opções em cards. No dashboard, os dois caminhos de criação ficam recolhidos até
o usuário escolher um deles.

## Escopo

- Impedir que o rascunho seja submetido enquanto o gate de perfil/termos está
  sobre o dashboard.
- Retomar automaticamente o rascunho assim que o usuário estiver autorizado,
  inclusive se o parâmetro `resume=1` tiver sido perdido durante o aceite.
- Oferecer no dashboard os cards recolhíveis **Roteiro rápido** e
  **Construção avançada**; nenhum fica aberto por padrão.
- Atualizar os textos legais com o apoio do orientador, a indicação de uso do
  aplicativo e os créditos de Sérgio França, D.Sc., incluindo a Escola de
  Engenharia. A pergunta “Como tenho acesso a essa conta?” permanece apenas
  como comentário e não entra no texto publicado.

## Critérios de aceite

1. Um rascunho avançado preenchido antes do login não é perdido durante o
   aceite inicial e abre a descoberta com os cards de propostas.
2. O dashboard autenticado exibe os dois modos recolhidos por padrão e permite
   abrir apenas o modo escolhido.
3. O roteiro rápido do dashboard usa o prompt e as sugestões existentes.
4. Os textos legais exibem as alterações solicitadas e os links de e-mail e
   páginas continuam clicáveis.
5. Typecheck, lint, testes, build e smoke de produção passam.
