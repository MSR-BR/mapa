# Plano futuro — não executado

1. Revisar `local-changes.patch` sobre o snapshot anterior C123–C126; `files.json`
   vincula os arquivos aos hashes. Não aplicar sobre HEAD puro sem as Changes
   anteriores. Não misturar nem descartar alterações locais anteriores.
2. Tratar os cinco avisos dev remanescentes e as pendências globais, incluindo
   UX-06 e verificações operacionais. Nova revisão precisa de gates sobre candidato
   exato. Testes locais não são autorização de release.
3. Para aplicação remota futura, confirmar ledger, schemas/ACLs e backup utilizável
   sem ler segredos. C127 não adiciona chave/configuração nem altera teto de IA.
4. Preparar commits/deploy e SQL como alvos de autorização separados. O conjunto
   inclui as três migrations C125 e a nova migration C127. O adaptador de cópia
   estudantil C125 deve estar no servidor antes de aplicar a C125.
5. Opção de ordem segura para o conjunto: publicar o servidor compatível primeiro;
   enquanto a RPC C127 não existir, reenvios falham fechados com 503, sem envio.
   Aplicar então as migrations aprovadas e conferir ledger, privilégios e fluxo.
   Essa breve indisponibilidade de lembretes precisa entrar na janela planejada;
   edição/exportação não depende do contador de lembretes.
6. Smoke autorizado posterior: owner→reminder→cooldown, advisor→recipient correto,
   concorrência, falha simulada e isolamento. Envio real só com autorização específica.

## Rollback

Preferir correção à frente. Reverter ao handler antigo reabre SEC-04; não remover
só a reserva para contornar erro. Se a migration falhar antes do COMMIT, a transação
é revertida; verificar estado antes de repetir. Se já aplicada, manter a RPC e
as tabelas durante rollback do restante do app, bloqueando reenvios por código
seguro. Não descartar contadores em produção: isso reinicia proteção de frequência.
Compensação SQL, se indispensável, exige nova migration revisada e autorização.
Não voltar ao Next vulnerável; escolher uma versão corrigida compatível.
Não alterar migrations C125 já aplicadas nem apagar mapas, revisões ou textos.

PUBLICATION_STATE: NOT_REQUESTED. Sem commit/deploy nesta execução.
