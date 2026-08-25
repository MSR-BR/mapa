# Change 052 — Explicação e garantia da otimização da literatura

Status: concluída

## Origem

Relatório `MAPA DA PESQUISA (1).docx`, registro de 25/08/2026: esclarecer a
função do quadro de otimização de referências ligado ao Research Starter.

## Objetivo

Tornar explícito quando e como a opção “Otimizar literatura” usa o Research
Starter, evitando que o usuário confunda a ação com uma simples revisão local
dos textos.

## Escopo

- Explicar no card que a ação executa uma nova busca no Research Starter com
  palavras-chave fornecidas pelo usuário.
- Informar que, após uma busca bem-sucedida, referências, tópicos e associações
  podem ser regenerados e que as associações específicas podem mudar.
- Informar que referências externas adicionadas manualmente permanecem
  preservadas e que a substituição só ocorre após resposta válida do serviço.
- Exibir estado de processamento, resultado parcial, falha e tentativa
  novamente com linguagem clara.
- Mostrar a quantidade de referências encontradas, associadas e não associadas
  antes e depois da otimização.
- Garantir que o botão não seja um placebo: a chamada deve alcançar o endpoint
  do Research Starter, registrar diagnóstico sanitizado e atualizar o workflow
  somente após sucesso.

## Critérios de aceite

1. O card explica a função e o momento recomendado para otimizar.
2. Uma otimização dispara uma nova busca real no Research Starter.
3. Falhas não apagam tópicos, referências ou edições anteriores.
4. O usuário consegue tentar novamente sem perder as palavras-chave.
5. Testes cobrem resposta completa, parcial, inválida, timeout e ausência de
   fontes verificáveis.
