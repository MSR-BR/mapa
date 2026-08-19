# Change 030 — Roteiro rápido e construção avançada

Status: concluída

## Objetivo

Oferecer duas formas de iniciar um mapa sem retirar a liberdade do usuário:

- **Roteiro rápido:** prompt em linguagem natural, com sugestões de tema e
  formulação enquanto o texto é escrito;
- **Construção avançada:** as cinco perguntas orientadas e o tipo de produto
  acadêmico da entrada estruturada.

As opções aparecem como cards recolhíveis. A construção avançada inicia aberta;
o roteiro rápido inicia recolhido.

## Persistência e autenticação

- O modo escolhido e seu conteúdo são salvos no backup local antes do login.
- A página inicial também restaura um backup recente caso o login falhe ou o
  usuário volte para ela.
- O dashboard identifica um backup rápido e o envia como prompt legado, sem
  exigir o rádio de tipo acadêmico da construção avançada.
- O backup continua protegido pela Change 029 e só é removido após criação
  confirmada do projeto.

## Critérios de aceite

1. alternar entre os dois cards sem perder o texto de nenhum modo;
2. receber sugestões no roteiro rápido enquanto digita;
3. concluir o roteiro rápido após autenticação e chegar aos cards de propostas;
4. concluir a construção avançada mantendo os cinco campos e o tipo de produto;
5. login inválido não apagar o rascunho;
6. tipos, lint, testes e build passarem.
