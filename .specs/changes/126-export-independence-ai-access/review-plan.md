# Revisão e futura publicação

1. Revisar o diff incremental C126 sobre C123/C124/C125, principalmente a decisão
   de login sem cota diária e a reserva mensal para Gemini primário. Todos os
   arquivos/hashes estão no manifesto. O diff inclui binários das fontes; logs e
   imagens são evidências auxiliares no diretório `evidence/`.
2. Revisar os riscos ainda abertos da auditoria global (não considerar as Ordens
   anteriores publicadas). SEC-06/AI-04 sem cota diária por decisão humana.
3. Antes de publicar, confirmar por metadados o funcionamento e o valor US$ 5 do
   contador atual e presença das configurações exigidas, sem exibir segredos.
   Esta etapa não foi realizada nem altera a autorização remota atual.
4. Montar candidato exato e gate de release com as dependências C123/C124/C125.
   C126 não adiciona migration. As migrations da C125 continuam exigindo sua
   própria revisão/autorização e sequência de publicação.
5. Só após autorização explícita do candidato: commit/push/deploy e smoke
   canônico. A autorização atual é somente implementação local.

Rollback futuro: restaurar apenas os arquivos C126 pelo pacote incremental,
sem desfazer as Changes anteriores. Atenção: reverter custo restaura a lacuna
anterior de reserva do Gemini primário; avaliar antes de publicar rollback.
Não executar rollback remoto automaticamente.

Não é CPD limpo: a árvore mantém alterações intencionais não commitadas.
