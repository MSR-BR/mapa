# C102 — Infraestrutura transversal de segurança

## Status

Concluída e publicada em produção em 24/09/2026.

## Contexto

O Mapa da Pesquisa processa conteúdo acadêmico privado, identidades, vínculos entre Aluno e Orientador, comentários de revisão e relatos de suporte. A aplicação já possui RLS, autorização centralizada, CSP, proteção de origem, buckets privados e validação de webhooks, mas faltava um perfil canônico de segurança, um gate de release reproduzível e uma regra transversal que impedisse mensagens brutas de provedores e banco nos logs de produção.

## Classificação

- Nível: `S3_SENSITIVE`.
- Topologia: aplicação gerenciada em Vercel, Supabase, Gemini, Research Starter e Resend.
- Não se aplica: controles de infraestrutura própria `S4` (host, Docker, proxy reverso ou PostgreSQL autogerenciado).

## Objetivo

Estabelecer uma camada transversal, verificável e proporcional ao risco para mudanças de autenticação, APIs, banco, IA, dados privados, segredos e infraestrutura.

## Escopo

1. Criar um perfil canônico de segurança com ativos, dados, fronteiras de confiança, controles, riscos aceitos e gatilhos de autorização.
2. Criar um gate de release com revisão do candidato exato, destino, rollback e prova pós-release.
3. Sanitizar os logs de runtime restantes sem alterar contratos de API ou comportamento funcional.
4. Ampliar a auditoria local para verificar controles públicos, upload privado, webhook assinado, documentação e privacidade dos logs.
5. Adicionar testes unitários e estáticos que impeçam regressão dos controles.
6. Registrar a preparação para grants explícitos do Supabase como pendência separada, sem executar SQL remoto nesta Change.

## Fora do escopo

- Alterar Vercel, Supabase, DNS, Google, Resend ou outro provedor remoto.
- Executar migrations, grants ou mudanças de RLS em produção.
- Rotacionar segredos ou chaves.
- Implantar rate limit distribuído sem evidência de abuso ou necessidade operacional.
- Introduzir antivírus de anexos ou infraestrutura própria.
- Executar o conteúdo de `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md`; isso pertence às Changes C103/C104.

## Critérios de aceite

- O perfil classifica o projeto como `S3_SENSITIVE` e documenta controles e riscos residuais.
- O gate diferencia validação local de autorização e mutação remota.
- Nenhum arquivo de runtime fora dos observadores centrais usa `console.error`, `console.warn` ou `console.info`.
- Falhas operacionais registram somente campos permitidos, código normalizado e status HTTP válido; mensagens brutas são descartadas.
- Relatos de bugs preservam limite de 5 MB, tipos de imagem permitidos, nome seguro, bucket privado e `upsert: false`.
- O recebimento de suporte continua exigindo assinatura do Resend e limite agregado de anexos.
- Rotas públicas de suporte, relato de bugs e sugestões mantêm limitação de taxa.
- RLS continua presente para todas as tabelas públicas criadas pelas migrations.
- Auditoria de dependências não encontra vulnerabilidades de severidade alta ou crítica.
- Lint, tipos, testes, exportações e build passam.

## Riscos aceitos nesta etapa

- O rate limit atual é por instância e pode perder estado entre execuções serverless.
- Anexos recebidos por e-mail são limitados em tamanho, mas não passam por antivírus antes do encaminhamento interno.
- A restauração de backup e o E2E autenticado dependem de prova operacional periódica e não são inferidos por análise estática.
- A compatibilidade com grants explícitos de novos objetos Supabase será tratada separadamente antes da mudança obrigatória de 30/10/2026.

## Plano de reversão

Reverter o commit funcional da C102 restaura os logs e a auditoria anteriores. A mudança não cria dados, não altera esquema e não depende de rollback remoto.

## Gate de implantação

A publicação foi autorizada após validação local completa e revisão do commit candidato exato. A evidência está em `cpd-2026-09-24.md`.

## Validação local

- `npm run check`: lint, tipos, 137/137 testes, exportações PDF/DOCX e build Next.js aprovados.
- `npm run security:gate`: auditoria S3 em `PASS_WITH_ACCEPTED_RISK`, `npm audit` com zero vulnerabilidades e `git diff --check` aprovado.
- `security_fast_check.py --mode worktree`: aprovado, 17 arquivos inspecionados e zero gatilhos sensíveis.
- Testes direcionados de observabilidade e segurança: 11/11 aprovados após o reforço final do sanitizador.
- A única configuração remota alterada no CPD foi o identificador público `NEXT_PUBLIC_APP_VERSION`; nenhuma consulta, migration, grant ou policy Supabase foi executada.
