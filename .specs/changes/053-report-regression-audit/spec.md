# Change 053 — Auditoria de regressão do relatório de 21–25/08

Status: planejada

## Origem

Relatório `MAPA DA PESQUISA (1).docx`, que reabre problemas já tratados pelas
Changes 042–049 e pode representar regressão entre ambientes ou cache de
produção.

## Objetivo

Revalidar em produção e em ambiente local cada item do relatório, corrigindo
somente o que ainda falhar e registrando evidência rastreável.

## Escopo

- Mapa Rápido: sugestões enquanto digita, preservação do briefing e entrada
  correta na descoberta de propostas.
- Descoberta: seis cards, retry, mensagens de erro e integração Gemini +
  Research Starter.
- Dashboard: tema/título identificável nos projetos em andamento.
- Domínio: endereço canônico `mapadapesquisa.com.br`, redirecionamentos e
  callback de autenticação.
- Exportação: PDF no formato acadêmico escolhido, referências, conclusão,
  recomendações, link do app e registro CBL.
- Recuperação de senha: envio, callback, destino interno e redefinição.
- Compatibilidade mobile/desktop, cache e versão publicada.

## Critérios de aceite

1. Cada item do relatório possui resultado “aprovado”, “corrigido” ou
   “bloqueado por dependência externa”, com evidência.
2. Nenhum fluxo perde o briefing durante autenticação ou retry.
3. Os smokes local, E2E autenticado e produção passam na mesma versão.
4. A auditoria atualiza o roadmap, o runbook, a versão do rodapé e o CPD.
5. Se nenhum defeito permanecer, a Change é encerrada sem criar uma cópia das
   Changes 042–049 já concluídas.

