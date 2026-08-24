# Change 046 — PDF final conforme modelo acadêmico e registro CBL

Status: concluída

## Objetivo

Reorganizar a exportação final em PDF segundo o modelo acadêmico fornecido pelo
responsável pelo projeto, mantendo o conteúdo validado do Mapa da Pesquisa, suas
referências cruzadas e a indicação de produção pelo aplicativo.

## Escopo

- Capa com a marca do Mapa da Pesquisa, título, produto acadêmico, revisão e data.
- Estrutura hierárquica: `1 INTRODUÇÃO`, `2 REVISÃO DA LITERATURA`,
  `3 METODOLOGIA DA PESQUISA`, `4 ESTUDO DE CASO / ANÁLISE E DISCUSSÃO DOS RESULTADOS`,
  `5 CONCLUSÃO E RECOMENDAÇÕES PARA FUTURAS PESQUISAS` e `REFERÊNCIAS`.
- Referências Research Starter e referências cruzadas `[R01]`, `[R02]` etc. no corpo.
- Página final com texto de produção, link clicável para o aplicativo e registro
  CBL/ISBN `978-65-01-44943-2`, acompanhado do código de barras fornecido.
- Exportação exclusivamente em PDF neste momento; DOCX continua bloqueado pela rota.

## Critérios de aceite

1. O endpoint de PDF gera um arquivo válido com a nova hierarquia e sem perder o mapa
   validado, os avisos ou as referências.
2. O link para `https://mapadapesquisa.com.br` é clicável no PDF.
3. O ISBN e o código de barras CBL aparecem na página final sem sobrepor o texto.
4. A renderização visual é legível em páginas de conteúdo e na página de registro.
5. Lint, typecheck, testes, exportação de validação, build e `git diff --check` passam.
