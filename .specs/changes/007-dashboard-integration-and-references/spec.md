# Change 007 — Dashboard, integração e referências

Status: concluída em 23/07/2026.

## Objetivo

Simplificar a navegação, tornar referências externas obrigatórias para novas gerações e permitir que o proprietário integre mapas salvos com IA.

## Requisitos

- A home pública pergunta “O que você quer desenvolver?” sem texto auxiliar.
- O cabeçalho autenticado oferece botões de Dashboard e área pessoal.
- Salvar um projeto retorna à biblioteca.
- O menu de cada card abre exclusivamente pelos três pontos e oferece Abrir ou Excluir; clicar no card não abre o menu.
- O popup do card é renderizado acima da grade, aceita ações no primeiro clique e fecha ao clicar fora ou pressionar Esc.
- O menu da área pessoal fecha ao clicar fora ou pressionar Esc.
- Dois a quatro projetos salvos podem ser selecionados e integrados pelo Gemini.
- A integração consulta somente projetos e estruturas do usuário autenticado.
- Títulos gerados e integrados são resumidos pelo Gemini em até 80 caracteres.
- Projetos iniciados pelo prompt recebem título resumido antes da primeira persistência; o texto integral nunca é usado como identificação do card.
- Antes da primeira persistência e da busca, o Gemini converte o pedido integral em título curto, palavras-chave específicas, consulta acadêmica de até 240 caracteres e área do conhecimento.
- A consulta enviada às bases bibliográficas é produzida em inglês; título, área e interface permanecem no idioma do usuário.
- Se a busca dos últimos cinco anos não trouxer referências, o backend repete uma vez com intervalo de dez anos.
- Quando a área não estiver explícita, o Gemini propõe a área e o card a identifica como “Área proposta”.
- “Buscar literatura” aceita novas palavras-chave, substitui o foco anterior e regenera consulta, metadados, referências e estrutura.
- Regenerar, Buscar literatura e Salvar usam o mesmo tamanho e alinhamento; somente Salvar recebe destaque de cor.
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
- [x] Somente o botão de três pontos abre o popup ancorado do card.
- [x] A área pessoal fecha por clique externo ou Esc.
- [x] Integração rejeita projetos sem estrutura salva ou fora da propriedade do usuário.
- [x] Research Starter com zero referências não é tratado como sucesso.
- [x] Instruções de formato e frases conversacionais não contaminam a consulta enviada ao Research Starter.
- [x] Consulta bibliográfica em inglês evita a perda de resultados causada pelo ranqueamento multilíngue do Research Starter.
- [x] Novas palavras-chave podem disparar uma regeneração completa da literatura.
- [x] Exportações exibem referências e atribuição clicável.
- [x] Testes, lint, TypeScript e build passam antes do deploy.
