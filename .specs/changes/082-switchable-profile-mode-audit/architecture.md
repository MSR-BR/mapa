# Arquitetura-alvo

## Modelo conceitual

```text
auth.users (identidade e sessão)
        |
        v
user_profiles (active_role + role_version + role_changed_at)
        |
        +--> modo Aluno
        |      +--> projetos próprios com authoring_role=student
        |      +--> orientação externa opcional
        |
        +--> modo Orientador
        |      +--> projetos próprios com authoring_role=advisor
        |      +--> construção autônoma, sem supervisão
        |      +--> projetos de estudantes vinculados para revisão
        |
        v
user_profile_role_events (trilha append-only)

projects (owner_id + authoring_role + advisor_id/advisor_email)
```

`owner_id` e `advisor_id` continuam expressando a relação permanente com cada
projeto. `authoring_role` registra, sem mudança posterior, se o projeto foi criado
no perfil Aluno ou Orientador. O modo ativo determina quais projetos e relações
podem ser exercidos agora.

## Contextos válidos

- `student + owner + authoring_role=student`: autoria com orientação opcional.
- `advisor + owner + authoring_role=advisor`: autoria autônoma, sem orientador.
- `advisor + advisor_id + authoring_role=student`: revisão externa, desde que
  o orientador não seja também o proprietário.
- Qualquer outra combinação é negada ou não exibida.

## Fonte de verdade

- Fonte autoritativa: `public.user_profiles.active_role`.
- Concorrência: `role_version` monotônico enviado como versão esperada.
- Auditoria: evento com modo anterior, novo modo, versão e horário; sem e-mail,
  conteúdo acadêmico, IP ou outro dado desnecessário.
- JWT não conterá o modo ativo, pois pode ficar obsoleto até o refresh do token.
- `localStorage`/`BroadcastChannel` poderão apenas avisar outras abas para
  atualizar a UI; nunca conceder acesso.

## Troca atômica

Uma RPC autenticada recebe `target_role` e `expected_version`, valida o usuário,
cria o perfil no primeiro acesso ou atualiza a linha existente, incrementa a
versão e registra o evento na mesma transação. Repetir o mesmo alvo é idempotente.
UPDATE direto pelo cliente permanece bloqueado; o INSERT inicial continua
restrito à própria conta e também é auditado por trigger.

## Autorização no Next.js

Um módulo `server-only` centraliza:

- sessão válida;
- perfil configurado e consulta sem erro;
- modo e versão atuais;
- consentimento da versão legal para esse modo;
- autoria imutável, propriedade ou vínculo do projeto conforme a ação.

Server Components, Server Actions e Route Handlers fazem checagem própria perto
da leitura/mutação. Layout e Proxy não são considerados barreiras suficientes.

## Respostas e estado obsoleto

- `401`: sessão ausente ou inválida.
- `403` com código `profile_mode_mismatch`: ação pertence ao outro modo.
- `404`: projeto inexistente ou sem relação, evitando revelar sua existência.
- `409` com código `profile_mode_stale`: `role_version` mudou em outra aba.

Após `403/409`, o cliente atualiza o contexto e redireciona ao dashboard correto.

## Consentimento

O aceite continua separado por modo. Após a primeira troca para um modo sem o
aceite vigente, a aplicação mostra o gate correspondente. A Server Action lê o
modo do banco e ignora qualquer papel informado pelo cliente.

## Rollout

1. Migration aditiva sem liberar troca.
2. DAL e código compatível publicados com feature flag desligada.
3. Configurações e interfaces estritas prontas sob a mesma flag.
4. Policies/funções endurecidas e RPC liberada em janela coordenada.
5. Flag ativada, E2E com contas de teste, observação e CPD.
