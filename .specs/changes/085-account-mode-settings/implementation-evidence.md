# Evidências de implementação — Change 085

## Entrega

- Rota autenticada `/dashboard/settings`, invisível e inacessível enquanto
  `ACCOUNT_MODE_SWITCH_ENABLED` estiver desligada.
- Cartões claros para Aluno e Orientador, modo atual identificado e confirmação
  explícita em diálogo nativo acessível.
- Troca por Server Action com ator resolvido no servidor, versão esperada,
  `request_id` idempotente, mensagens seguras e revalidação do dashboard.
- Atualização entre abas por `BroadcastChannel` e evento `storage`; o sinal não
  transporta nem autoriza o papel e apenas solicita nova leitura do servidor.
- Consentimento legal reavaliado por papel e versão, analytics sanitizado e
  sessão Supabase preservada durante a troca.
- Cópia deixa explícito que ambos os perfis criam mapas rápidos e avançados:
  Aluno pode ser supervisionado; Orientador cria projetos autônomos e recebe
  revisões vinculadas em área separada.

## Segurança e consistência

- Payload adulterado é rejeitado por contrato de papel, versão e UUID.
- Duplo envio fica desabilitado no cliente, mas a consistência não depende do
  cliente: a RPC trata replay idempotente e conflito de versão no banco.
- O evento entre abas é apenas um hint; cada aba recarrega o contexto canônico.
- Nenhum projeto é convertido, apagado ou tem `authoring_role` alterado durante
  a troca.
- A funcionalidade depende da flag e do grant da RPC. Ambos continuam fechados
  nesta change para permitir publicação sem ativação antecipada.

## Evidências locais

- 107 testes aprovados, incluindo contratos estáticos e regras puras da troca.
- Build de produção, lint e TypeScript aprovados.
- Auditoria de segurança aprovada para segredos, RLS e 14 rotas acadêmicas.
- PostgreSQL 17 isolado aprovou os dois sentidos da troca, idempotência,
  concorrência e preservação de autoria.
- Smoke HTTP local aprovou raiz, redirecionamento autenticado e login.

## Limite desta change

- A interface estrita de todas as áreas por perfil pertence à C86.
- Grants e policies remotos conscientes do modo pertencem à C87.
- Ativação e homologação autenticada completa pertencem à C88.
