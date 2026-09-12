# Evidências de encerramento — Change 077

## Execução

- Modelo: gpt-5.6-sol com raciocínio xhigh.
- Fluxo: Pó Mágico e CPD completo.
- Escopo: remoção visual no menu, sem migration, RLS, seleção, persistência ou
  permissão de perfil.

## Implementação

- Removidos `Área de trabalho: ...` e `Este perfil permanece associado à conta.`
  do menu.
- Mantidos `Perfil da conta` e o valor explícito `Aluno` ou `Orientador`.
- Removido `workspaceLabel` do contrato de apresentação e o seletor CSS sem uso.
- Testes negativos impedem a reintrodução das duas mensagens no componente.
- A revisão Next.js confirmou que a fronteira do Client Component e suas props
  serializáveis permanecem válidas.

## Gates

- `npm run check`: aprovado.
- Lint e typecheck: aprovados.
- Testes: 93/93 aprovados.
- Exportação PDF e build Next.js 16.3.5: aprovados.
- `npm audit --audit-level=moderate`: zero vulnerabilidades.
- `npm run security:audit`: aprovado; nenhum segredo encontrado nos arquivos
  rastreados.
- `git diff --check`: aprovado.

## Produção

- Deployment: `dpl_HiCEa53yXkM9b2AWbnHvruEJ2vb1`.
- Artefato: `https://mapadapesquisa-dlb5kddso-msr-brs-projects.vercel.app`.
- Domínio: `https://mapadapesquisa.com.br`.
- Estado: READY, alvo Production.
- Domínio canônico: HTTP 200 com cabeçalhos de segurança ativos.
- `/api/health`: `status=ok`, com Gemini, Resend, Research Starter e Supabase
  configurados.
- Logs de erro: nenhum registro no período inspecionado.

## Encerramento

Os critérios de aceite foram atendidos. A simplificação não modifica o perfil
persistido nem a separação de permissões entre Aluno e Orientador.
