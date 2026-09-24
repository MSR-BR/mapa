# Validação local — C103

Data: 24/09/2026.

## Resultado

`PASS_WITH_ACCEPTED_RISK` local. A compatibilidade de instalação nova foi
comprovada; drift e comportamento remoto pertencem à C104.

## Evidências aprovadas

- `npm run supabase:verify-explicit-grants`: 18 migrations, oito tabelas,
  doze funções, zero views e zero sequences alinhadas ao manifesto.
- Três regressões automatizadas passaram: estado atual, objeto futuro não
  declarado e grant amplo indevido.
- `npm run supabase:release-gate`: todas as migrations foram aplicadas em
  PostgreSQL 17 descartável; 28 policies, privilégios efetivos, funções,
  RLS, bucket privado e ausência de sequences foram confirmados.
- `npm run supabase:verify-migration-local`: fundação legada aprovada.
- `npm run supabase:verify-mode-aware-rls`: matriz de modo, autoria, vínculo,
  filhos, RPC, grants e trigger aprovada.
- `npm run supabase:verify-student-advisor-gate`: rascunho, bloqueio direto,
  revisão, aprovação e autonomia do Orientador aprovados.
- `npm run check`: lint, tipos, verificador de grants, 140/140 testes,
  exportações PDF/DOCX e build Next.js 16.3.5 aprovados.
- `npm run security:audit`: `PASS_WITH_ACCEPTED_RISK`; o item de grants
  explícitos passou e os riscos transversais já aceitos permaneceram visíveis.
- `npm run security:gate`: auditoria S3, grants, `npm audit` com zero
  vulnerabilidades e `git diff --check` aprovados.

O primeiro `npm run check` encontrou uma asserção documental antiga da C102
que dizia não ter existido qualquer alteração remota, embora o CPD registre o
deploy Vercel e a atualização da versão pública. A asserção foi corrigida para
o limite verdadeiro — nenhuma ação Supabase — e a suíte completa passou.

## Não executado por limite de autoridade

- `npm run supabase:verify-rls`: consulta o projeto Supabase remoto.
- `npm run supabase:verify-authenticated-rls`: autentica duas contas, troca
  papéis e cria/apaga projeto e workflow no banco remoto.
- Dashboard, Migration History, Data API, ACLs e Security Advisor remotos.
- Opt-in antecipado e qualquer SQL, migration, grant, policy ou configuração.

Essas ações exigem autorização específica para a C104. A ausência dessas provas
não é descrita como sucesso remoto.

## Decisão

Não criar migration redundante. A fonte fornecida
`SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` foi preservada sem modificação e fora
do commit da C103.
