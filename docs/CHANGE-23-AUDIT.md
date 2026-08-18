# Change 23 — Auditoria geral e segurança

Data da auditoria: 18/08/2026  
Versão liberada após a change: `v18082026.7`

## Escopo

Auditoria estática do repositório, revisão das rotas de API, autenticação, isolamento por proprietário, vínculo estudante–orientador, exposição de segredos, exportações, indexação e headers de segurança. A auditoria não registra prompts, conteúdo acadêmico, tokens ou senhas.

## Correções aplicadas

- Desativado o header `X-Powered-By`.
- Adicionados `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `X-DNS-Prefetch-Control`.
- Adicionada rejeição de uma origem explicitamente cross-site nas mutações `/api/*`, antes da atualização da sessão Supabase.
- Criada migration com trigger transacional que limita o orientador à revisão pendente, preservando o conteúdo acadêmico do estudante.
- Aplicada CSP dinâmica com nonce para JSON-LD, hidratação Next e Google Analytics consentido.
- Adicionado rate limiting por origem/IP para endpoints públicos que consomem recursos externos:
  - sugestões de prompt: 15 solicitações por minuto;
  - suporte: 5 mensagens por hora.
  - A resposta informa `Retry-After` e a estrutura é limitada a 10.000 entradas por instância.
- Criado `npm run security:audit`, que verifica segredos rastreados, variáveis públicas sensíveis, RLS nas migrations, autenticação das rotas de projeto, usos de HTML bruto, headers e indexação privada.

## Evidências automatizadas

| Verificação | Resultado |
| --- | --- |
| `npm run security:audit` | passou; 195 arquivos verificados, sem segredo detectado |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm test` | passou: 60 testes |
| `npm run exports:verify` | passou; PDF válido |
| `npm run build` | passou; 18 páginas estáticas/dinâmicas compiladas |
| `/api/health` em produção | já validado: `status: ok` |

As migrations locais não puderam ser executadas porque o Docker do ambiente não estava acessível. Isso não altera os arquivos nem o resultado dos testes estáticos.

## Revisão de acesso

- As tabelas públicas criadas nas migrations (`projects`, `generation_jobs`, `research_structures`, `research_workflows`, `user_profiles`, `legal_consents`) habilitam RLS.
- As rotas de projeto exigem claims Supabase verificados no servidor; a rota de exportação usa `auth.getClaims()` e filtra pelo `owner_id`.
- As funções de vínculo de orientador são `SECURITY DEFINER`, têm `search_path` explícito, verificam `auth.uid()`, revogam execução pública e concedem execução apenas a `authenticated`.
- `user_metadata` é usado apenas para nome/avatar de apresentação; não decide autorização.
- Dashboard, autenticação e API estão fora de indexação pública.

## Riscos residuais e próximos controles

1. **P2 — verificação remota/E2E.** O fluxo completo aluno–orientador precisa ser executado com `MAPA_E2E_STUDENT_EMAIL`, `MAPA_E2E_ADVISOR_EMAIL` e `MAPA_E2E_PASSWORD` configurados. Essas variáveis não estavam disponíveis no ambiente desta execução; nenhuma senha foi criada ou inferida.
2. **P2 — aplicação da migration remota.** A migration de endurecimento está no repositório, mas o conector Supabase devolveu `permission denied` para aplicar DDL nesta sessão. Ela precisa ser aplicada no SQL Editor do projeto antes de considerar o RLS endurecido em produção.
3. **P3 — publicação da regra global.** A regra global de sugestões foi preparada no Vercel Firewall em modo de observação (`100/60s` por IP, excedente apenas em log). A publicação exige revisão de tráfego e publicação explícita no painel/CLI. O plano atual recusou a regra equivalente para suporte; o limitador da aplicação continua ativo nesse endpoint.

## Decisão

Não há falha crítica ou segredo exposto detectado. A change pode ser liberada com os riscos residuais acima explicitamente documentados. Os itens P2 devem ser tratados antes de ampliar o piloto público.
