# Change 065 — Mapa Rápido com seleção que avança

**Status:** concluída

## Objetivo

Ao selecionar uma sugestão do Mapa Rápido, preencher o pedido escolhido e seguir
imediatamente para a próxima etapa sem deixar o usuário na mesma tela.

## Escopo

- adicionar callback de seleção ao componente de sugestões;
- aguardar a atualização do estado antes de submeter o formulário;
- no dashboard, criar o projeto e abrir a descoberta de propostas;
- na home pública, guardar o rascunho escolhido e abrir o login;
- manter Enter e o botão “Gerar mapa” com o comportamento atual;
- preservar sugestões locais e o fallback quando a IA não responder.

## Critérios de aceite

1. Clicar em Tema 1, Tema 2 ou Tema 3 usa exatamente o texto escolhido.
2. Um clique no dashboard inicia o mapa sem novo clique em “Gerar mapa”.
3. Um clique na home preserva o rascunho e avança ao login.
4. Não há submissão com o texto anterior do campo.
5. Falha no serviço de sugestões não impede a geração manual do mapa.

## CPD

- **Check:** contratos de seleção e avanço automático.
- **Persist:** o pedido escolhido usa o mesmo caminho persistido do envio manual.
- **Deploy/document:** lint, typecheck, testes, build e evidência de fechamento.
