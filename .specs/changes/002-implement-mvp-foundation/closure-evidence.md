# Evidências de encerramento — Change 002

Data: 22/07/2026

## Resultado

A fundação do MVP foi concluída em Next.js/Vercel com Supabase Free. Nenhuma branch paga, chave administrativa na aplicação, Realtime, Storage ou Edge Function foi adicionada.

## Eficiência de uso do Supabase

- Biblioteca inicial reduzida de 100 para 12 projetos.
- Consultas de detalhe deixaram de usar `select *`.
- Verificação autenticada deduplicada dentro da mesma renderização do servidor.
- Listas futuras devem usar paginação por cursor.
- Dados privados permanecem sem cache compartilhado entre usuários.
- Índice remoto confirmado em `(owner_id, updated_at desc)`.
- Advisor de performance: sem avisos.

## Segurança e identidade

- Conta demo principal e conta de isolamento criadas e confirmadas.
- Login real, persistência de sessão e logout verificados no navegador.
- Visitante redirecionado para login e acesso anônimo à tabela negado.
- Teste real com dois usuários confirmou bloqueio RLS de leitura, atualização e exclusão entre proprietários.
- Recuperação retorna mensagem genérica anti-enumeração e registra a solicitação no Auth.
- A entrega do e-mail demo recebeu limite `429` do SMTP compartilhado gratuito; transporte de e-mail real será revalidado na Change 005/006 com endereço e configuração de piloto.

## Migração

- Migração original aplicada no projeto remoto.
- A mesma migração foi aplicada com sucesso em PostgreSQL 17 vazio e descartável no Docker local.
- Foram confirmados: tabela `projects`, quatro políticas RLS e índice do proprietário.
- Nenhuma branch remota foi criada.

## Gates executados

- `npm run check`: aprovado — lint, TypeScript, 15 testes e build.
- `npm audit --audit-level=high`: zero vulnerabilidades.
- `npm run supabase:verify`: conexão com o projeto correto aprovada.
- `npm run supabase:verify-rls`: acesso anônimo negado.
- `npm run supabase:verify-authenticated-rls`: isolamento com dois usuários aprovado.
- `npm run supabase:verify-migration-local`: migração em banco vazio aprovada.
- Advisor de performance: limpo.

## Riscos residuais aceitos

1. O advisor de segurança informa que a proteção HaveIBeenPwned está desativada. A documentação oficial limita o recurso ao plano Pro; não será ativado porque Supabase Free é requisito obrigatório.
2. A matriz completa de dispositivos e acessibilidade automatizada pertence à Change 005. Nesta fundação foram implementados breakpoints, foco visível, redução de movimento e estados responsivos.
3. Observabilidade de produção, limites de uso e alertas pertencem à Change 006; o código atual evita polling e serviços Supabase desnecessários.

## Decisão

A Change 002 está encerrada. Os riscos acima não impedem a Change 003 e não autorizam contratação de recursos pagos.
