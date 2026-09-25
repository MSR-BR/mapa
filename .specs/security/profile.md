# Perfil de segurança do Mapa da Pesquisa

## Classificação e escopo

- Classificação: `S3_SENSITIVE`.
- Aplicação: Next.js gerenciado na Vercel.
- Dados e autenticação: Supabase gerenciado, projeto `aeaweherkrqmlqnxsmib`.
- Provedores server-side: Gemini, Research Starter e Resend.
- Fora do escopo: infraestrutura própria de host, Docker, proxy reverso ou PostgreSQL autogerenciado (`S4`).

## Ativos e dados protegidos

| Ativo | Sensibilidade | Controle principal |
|---|---|---|
| Projetos e mapas acadêmicos | Privado | RLS, autorização central por ator e autoria imutável |
| Identidade e modo da conta | Pessoal/controle de acesso | Google OAuth, modo persistido e versionado no banco |
| Vínculo Aluno–Orientador e pareceres | Privado | RLS, triggers e validação do fluxo |
| Relatos de bugs e anexos | Pessoal/operacional | Validação, limite, bucket privado e acesso restrito |
| Prompts e respostas de IA | Conteúdo acadêmico privado | Somente backend; conteúdo excluído dos logs |
| Chaves e segredos | Crítico | Variáveis server-side; nunca `NEXT_PUBLIC_*` |

## Fronteiras de confiança

1. Navegador → proxy/rotas Next.js: origem de mutações, validação de entrada, autenticação e autorização.
2. Next.js → Supabase: RLS e grants complementam a autorização da aplicação.
3. Next.js → Gemini/Research Starter: somente backend, respostas tratadas como entrada não confiável.
4. Resend → webhook: corpo aceito somente após verificação de assinatura.
5. Aplicação → logs: somente eventos estruturados e campos permitidos; sem mensagens brutas, e-mails, prompts, respostas ou tokens.

## Matriz de controles

| Controle | Estado | Evidência local |
|---|---|---|
| Autorização central nas rotas de projeto | Verificado | `modules/projects/auth.ts` e auditoria estática |
| RLS em tabelas públicas criadas por migration | Verificado localmente | `scripts/audit-security.mjs` |
| CSP com nonce, HSTS, framing, MIME e referrer | Verificado | `proxy.ts` e `next.config.ts` |
| Rejeição de origem cross-site em mutações | Verificado | `proxy.ts` |
| Segredos fora do cliente e do repositório | Verificado localmente | `.env.example` e scanner |
| Logs sanitizados | Verificado por teste | `lib/observability/request-context.ts` |
| Upload de bugs privado e limitado | Verificado localmente | rota e migration do bucket |
| Webhook de suporte assinado | Verificado localmente | `app/api/inbound/resend/route.ts` |
| Rate limit distribuído | Parcial | limite atual é em memória por instância |
| Varredura antimalware de anexos recebidos | Não implementado/risco aceito | anexos são limitados e encaminhados internamente |
| Restore de backup e E2E autenticado | Verificação operacional | requer execução periódica separada |
| Grants explícitos Supabase pós-30/10/2026 | Aplicado / E2E aprovado | C104 removeu `TRUNCATE`/`TRIGGER`/`REFERENCES` legados em produção, confirmou 19 migrations, 8 tabelas, 28 policies, 12 funções e ACLs mínimas, e aprovou o fluxo Google Aluno–Orientador com limpeza e restauração |

## Regras obrigatórias

- Autenticação, modo ativo, autoria do projeto e relação de supervisão são dimensões separadas.
- Avisos acadêmicos podem orientar; autorização, integridade técnica e aprovação humana continuam bloqueantes.
- RLS e grants são camadas distintas e devem ser declarados juntos em novas migrations.
- Funções `SECURITY DEFINER` exigem `search_path` fixado, privilégios mínimos e revisão de `EXECUTE`.
- Logs não podem conter mensagens brutas de exceções, conteúdo acadêmico, e-mail, identificadores de usuário, tokens ou corpos de provedor.
- Flags de segurança falham fechadas; uma falha de leitura não habilita acesso.

## Ações que exigem autorização explícita

- Deploy de produção ou promoção de alias.
- Migration, grant, função, trigger, policy ou alteração de Auth/RLS no Supabase remoto.
- Alteração de segredo, chave, DNS, domínio, OAuth, webhook ou configuração de provedor.
- Envio externo, campanha paga, gasto ou exclusão material de dados.

## Riscos aceitos e revisão

Os riscos parciais acima permanecem visíveis no relatório da auditoria e devem ser reavaliados quando houver abuso, aumento de volume, incidente, mudança regulatória ou alteração da topologia. Aceitação de risco não equivale a controle verificado.
