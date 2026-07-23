# Change 007 — Dashboard, integração e referências

Status: concluída em 23/07/2026.

## Objetivo

Simplificar a navegação, tornar referências externas obrigatórias para novas gerações e permitir que o proprietário integre mapas salvos com IA.

## Requisitos

- A home pública pergunta “O que você quer desenvolver?” sem texto auxiliar.
- O cabeçalho autenticado oferece botões de Dashboard e área pessoal.
- Salvar um projeto retorna à biblioteca.
- O menu de cada card abre junto aos três pontos e oferece Abrir ou Excluir.
- Dois a quatro projetos salvos podem ser selecionados e integrados pelo Gemini.
- A integração consulta somente projetos e estruturas do usuário autenticado.
- Títulos gerados e integrados são resumidos pelo Gemini em até 80 caracteres.
- Antes da busca, o Gemini converte o pedido integral em título curto, palavras-chave específicas e consulta acadêmica de até 240 caracteres.
- O prompt integral continua preservado no briefing; somente a consulta temática otimizada é enviada ao Research Starter.
- Gerações sem referências verificáveis do Research Starter falham sem sobrescrever conteúdo.
- DOCX e PDF identificam o Research Starter e incluem link para o serviço.

## Segurança e orçamento

- Nenhuma tabela, recurso pago ou chave pública foi adicionado.
- A integração é explícita, limitada a quatro projetos e executada no backend.
- Referências são renumeradas por projeto e validadas antes da persistência.
- Projetos parciais de uma integração com falha de persistência são ocultados por soft delete.

## Critérios de aceite

- [x] Textos e navegação correspondem ao fluxo aprovado.
- [x] Card e botão de opções abrem o mesmo popup ancorado.
- [x] Integração rejeita projetos sem estrutura salva ou fora da propriedade do usuário.
- [x] Research Starter com zero referências não é tratado como sucesso.
- [x] Instruções de formato e frases conversacionais não contaminam a consulta enviada ao Research Starter.
- [x] Exportações exibem referências e atribuição clicável.
- [x] Testes, lint, TypeScript e build passam antes do deploy.
