# Verificação de metodologia e literatura — 15/10/2026

**Resultado: verificações locais aprovadas; causa dos dois bloqueios recentes não confirmada.** Não foi feita alteração de código ou publicação.

## Dados observados

Consulta GA4 550650234 de 06–15/10, com dimensões data, evento, etapa, motivo e origem/mídia. Fuso do GA4: America/Rio_Branco; não alinhar automaticamente com Ads (America/Sao_Paulo). Dados de 15/10 são parciais.

- Antes de 13/10: **85 stage_blocked**, **6 generation_failed** e **2 export_pdf_failed**.
- Em 13/10, dia da publicação C118: **2 stage_blocked** na metodologia/validation, origem QR. Sem horário/versão por evento, não separar antes/depois do deploy.
- Em 14/10: **2 stage_blocked** na metodologia/provider_invalid_response, origem direta, **1 usuário reportado nesse grupo**. São posteriores à data da publicação, mas não comprovam a versão aberta no navegador.
- Nenhum generation_failed ou export_pdf_failed retornado no recorte de 12–15/10. Isso não garante ausência de falhas.
- Eventos não equivalem a pessoas ou projetos únicos. Não somar usuários entre grupos. Com zero cliques de Ads, não atribuir esses erros à campanha.

Fonte completa: [errors-by-date.json](evidence-cpc-test-2026-10-15/errors-by-date.json).

## Limitação identificada no código

Em `modules/research-workflow/methodology-workspace.tsx`, o catch registra `stage_blocked/provider_invalid_response` para várias situações: HTTP não bem-sucedido, resposta ilegível, ausência de workflow ou rede. A rota também pode retornar conflitos e outras falhas de persistência/contexto. Esse motivo **não identifica o provedor nem a causa**.

Não foi reproduzido bloqueio em cenário sintético equivalente. Os testes cobrem limites e avanço, mas não substituem uma reprodução autenticada do caso real. Não foram lidos projetos privados nem disparadas gerações pagas.

## Verificações executadas

1. `node --import tsx --test tests/analytics.test.ts tests/generation-field-limits.test.ts tests/methodology-assistance.test.ts tests/card-regeneration.test.ts`: **33 testes aprovados**, zero falhas.
2. `node scripts/verify-guided-methodology-routes.mjs`: **14 cenários aprovados**, incluindo preenchimento, avanço, preservação, falha e conflitos.
3. `node scripts/verify-card-regeneration-routes.mjs`: **13 cenários aprovados**, incluindo regeneração isolada, preservação na falha e referências aditivas.
4. `node scripts/verify-generation-limits-routes.mjs`: aprovado para limites e rascunhos antigos.
5. `npm run exports:verify`: aprovado para DOCX, PDF, PDF avançado, rascunho avançado e modo rápido.
6. Quatro links de divulgação: rota /mapa, atribuição pública e sanitização verificadas localmente.

Os testes usam dados sintéticos e substituições dos serviços externos. Não comprovam o comportamento de uma geração real ou da persistência em produção.

## Inspeção pública

Landing exibiu **v13102026.1**. O CTA abriu /mapa; formulário avançado fechado, rápido aberto e geração exigindo login Google. Não foi feita geração.

A navegação da home para /mapa não conserva a query original nesse link. Por isso, os novos links de distribuição vão diretamente a /mapa com UTMs: preservam a identificação na página de entrada antes da escolha de consentimento. Não houve correção de navegação nesta execução.

## Pendência e próximo passo

Acompanhar recorrência por etapa/origem. Se persistir, distinguir o status HTTP e o tipo de falha com diagnóstico sanitizado, reproduzir o caso e então corrigir a causa. Nunca registrar textos da pesquisa, chaves, identificadores pessoais ou respostas integrais do provedor. Os dois eventos de 14/10 permanecem **não resolvidos por evidência**; não declarar correção apenas porque os testes passaram.
