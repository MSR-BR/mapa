# Change 055 — Auditoria live da descoberta e briefing rápido

Status: em andamento em 26/08/2026

## Objetivo

Auditar a falha observada na tela de propostas, corrigir regressões locais
identificáveis e separar claramente defeito de código de credencial externa.

## Achados

- Gemini respondeu com saída estruturada válida.
- Supabase respondeu e a autenticação da aplicação permaneceu operacional.
- O Research Starter respondeu `HTTP 401 unauthorized` em produção. A chave
  configurada no Vercel não é aceita pelo provedor.
- Projetos do modo rápido podiam persistir a mesma frase nos cinco campos do
  briefing, causando repetição no pedido original e no payload de descoberta.

## Alterações

- Erro de credencial do Research Starter agora recebe código próprio,
  mensagem acionável e status HTTP 503; o briefing continua preservado.
- A tela de descoberta diferencia a necessidade de atualização da integração.
- O modo rápido grava a frase uma única vez; projetos antigos com cinco valores
  idênticos são compactados antes da interpretação.
- Versão pública atualizada para `v26082026.2`.

## Gate externo

Para concluir a Change 055, a equipe deve substituir a credencial inválida por
uma chave válida do Research Starter na variável `RESEARCH_STARTER_API_KEY` do
ambiente Production da Vercel. O valor da chave não deve ser enviado em chat,
logs ou código.
