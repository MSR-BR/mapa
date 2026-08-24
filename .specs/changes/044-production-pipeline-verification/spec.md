# Change 044 — Validação final do pipeline Gemini + Research Starter

Status: concluída

## Objetivo

Validar o caminho completo de descoberta e geração após a recarga dos créditos
Gemini, sem persistir dados de teste do usuário. A validação cobre os dois
modos de entrada, a busca bibliográfica verificável, o fluxo autenticado de
aluno e orientador e as exportações do mapa.

## Escopo

- Smoke real do Gemini com saída estruturada compatível com o schema 1.0.0.
- Smoke real do Research Starter com referências verificáveis.
- Smoke real de descoberta: três sugestões do Mapa Rápido e seis propostas do
  Mapa Avançado, sendo uma exata e cinco alternativas, todas ligadas às
  referências retornadas.
- Fluxo E2E autenticado aluno–orientador no Supabase, incluindo vínculo,
  leitura supervisionada, comentário, solicitação de correção, aprovações,
  conclusão e referências associadas.
- Verificação do PDF, testes estáticos, typecheck, lint, build e diff limpo.

## Critérios de aceite

1. Gemini responde sem erro de quota e valida a saída estruturada.
2. Research Starter retorna referências sem expor chave ou falhar por campos
   bibliográficos opcionais.
3. A descoberta produz exatamente seis candidatos, com o primeiro `exact`, os
   demais `alternative`, posições 1–6 e IDs de referência válidos.
4. O fluxo aluno–orientador termina com todas as etapas aprovadas, exercita uma
   solicitação de correção e mantém pelo menos três referências no mapa final.
5. O projeto temporário criado pelo E2E é removido ao terminar, inclusive em
   caso de falha.
6. PDF, testes, typecheck, lint e build passam.

## Verificação

- `npm run gemini:verify`
- `npm run research-starter:verify`
- `npm run research-proposals:verify`
- `npm run supabase:verify-advisor-student`
- `npm run exports:verify`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
