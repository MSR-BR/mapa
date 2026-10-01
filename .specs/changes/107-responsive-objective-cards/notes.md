# Diagnóstico e decisões

A linha antiga dividia espaço entre dois campos e dois botões em quatro
colunas, com larguras mínimas e alinhamento inferior. O breakpoint de 600 px
não cobria tablets/janelas intermediárias. Os cards agora têm no máximo duas
colunas de conteúdo; o rodapé não participa da grade de campos.

A C106 testou o campo de orientação isoladamente e não detectou a regressão
do formulário completo. A C107 exercita o workspace e CSS reais, com dados
fictícios; não equivale a E2E autenticado de produção ou teste de geração IA.

Container queries usam uma coluna como fallback seguro. `field-sizing`
amplia o campo conforme o texto quando disponível; `rows` e resize vertical
mantêm a edição viável em navegadores sem suporte.
