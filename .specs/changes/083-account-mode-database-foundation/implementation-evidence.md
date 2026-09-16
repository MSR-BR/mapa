# Evidência de implementação e produção — Change 083

**Data:** 16/09/2026
**Estado:** concluída, versionada e publicada em produção.

## Preflight remoto

- Projeto confirmado: `aeaweherkrqmlqnxsmib` (`mapa-da-pesquisa`).
- Histórico alinhado: 13 migrations, última
  `20260911190000 lock_user_profile_role`.
- Snapshot sanitizado: 13 perfis, 65 projetos, 7 projetos de contas orientadoras
  com campos de supervisão, sendo 6 auto-orientados e 1 com supervisor terceiro.
- Zero papel inválido, zero projeto sem perfil, zero auto-orientação de Aluno e
  zero divergência entre e-mail próprio e os seis vínculos auto-orientados.
- Nenhuma linha com e-mail, título, conteúdo acadêmico ou segredo foi registrada.

## Reconciliação adotada

- Os seis projetos auto-orientados foram classificados como autoria de
  Orientador e tiveram `advisor_id`/`advisor_email` redundantes removidos.
- O projeto com supervisor terceiro foi classificado como autoria histórica de
  Aluno e manteve o vínculo.
- O verificador isolado passou a cobrir ambos os casos e a abortar
  auto-orientação de Aluno com rollback integral.

## Aplicação remota

- Migration aplicada em uma única transação, incluindo o registro em
  `supabase_migrations.schema_migrations`.
- Versão: `20260916163351`.
- Nome: `account_mode_database_foundation`.
- O SQL Editor retornou `Success. No rows returned`.

## Postflight

- 14 migrations; C83 é a mais recente.
- 13 perfis versionados e 13 eventos `baseline`.
- 65 projetos: 50 `advisor`, 15 `student`.
- Zero perfil sem versão, zero projeto sem autoria e zero projeto de Orientador
  com supervisão.
- Uma supervisão externa histórica preservada.
- Três triggers e três constraints obrigatórias presentes.
- RLS ativa em `user_profile_role_events`.
- `anon` e `authenticated` sem SELECT na trilha; `service_role` com SELECT.
- UPDATE direto de `user_profiles` e EXECUTE de `switch_active_role`
  continuam revogados.

## Validações

- PostgreSQL 17 isolado: aprovado.
- `npm run check`: aprovado, 97/97 testes.
- `git diff --check`: aprovado.
- `npm run supabase:verify`: aprovado.
- `npm run supabase:verify-rls`: aprovado.
- `npm run security:audit`: aprovado.
- E2E real Aluno–Orientador: aprovado, com limpeza do projeto temporário.
- Security Advisor: 0 erros; 3 avisos preexistentes.
- Performance Advisor: 0 erros; 6 avisos preexistentes.
- Domínio canônico: HTTP 200; health: `status=ok`.

## CPD

- Commit funcional: `6702f70` (`feat: add account mode database foundation`).
- Push: branch `codex/change-003-004` sincronizada com `origin`.
- Deployment: `dpl_xKYU68AYP9bQJABUyot7TbjFz4AT`, target `production`, estado
  `Ready`; build Next.js 16.3.5 concluído com sucesso.
- URL técnica:
  `https://mapadapesquisa-cx5qltxl0-msr-brs-projects.vercel.app`.
- Alias canônico: `https://mapadapesquisa.com.br`, HTTP 200.
- `/api/health`: `status=ok`, com Supabase, Gemini, Resend e Research Starter
  configurados.
- A troca de modo permanece indisponível até as Changes 084–087.
