# Change 039 — Fechamento operacional do piloto

**Estado:** Concluída em 21/08/2026.

## Objetivo

Consolidar as mudanças implementadas, fechar riscos aceitos e registrar uma
versão de encerramento do piloto pronta para operação controlada.

## Submudanças

1. Revisar o estado das Changes 034–038 e nenhum bloqueio aberto.
2. Confirmar domínio, Resend, webhook, suporte, Google Analytics, SEO, landing
   page, exportação PDF e versionamento.
3. Executar CPD completo: testes, persistência/autorização, deploy e documentação.
4. Executar smoke test público e o teste autenticado E2E com as duas contas.
5. Atualizar roadmap, operations, changelog e instruções de rollback.
6. Registrar a versão `vDDMMAAAA.N` correspondente à publicação final do dia.
7. Publicar a versão de encerramento somente após a aprovação do responsável.

## Critérios de aceite

- Não há pendência crítica ou P2 sem decisão registrada.
- A publicação final está acessível no domínio canônico e foi verificada.
- Documentação, versão no rodapé e tag Git correspondem à mesma release.
- O relatório final identifica evidências, limites conhecidos e plano de suporte.

## Limites e decisões registradas

- A validação local das migrations foi executada com Docker Desktop e aprovada.
- Os advisors do Supabase retornaram `permission denied` pelo conector MCP; a
  verificação equivalente foi executada pela CLI autenticada.
- A proteção contra senhas vazadas é exclusiva de planos pagos e foi retirada
  do escopo do piloto no plano Free; não constitui pendência.
- A autorização de uso do logo, textos e dados biográficos foi confirmada pelo
  professor responsável da UFF na C037; não há pendência institucional adicional.
- A versão `v21082026.1` foi publicada em um commit Git limpo, com a tag
  correspondente criada no repositório.
