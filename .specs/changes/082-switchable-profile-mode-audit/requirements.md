# Requisitos

- Examinar interface, Server Components, Server Actions, Route Handlers, RLS,
  funções SQL, consentimento legal, analytics e verificador E2E.
- Distinguir identidade autenticada, modo ativo, perfil de autoria imutável e
  vínculo com cada projeto.
- Preservar projetos, vínculos, comentários, consentimentos e histórico atuais.
- Tratar o banco como fonte autoritativa do modo ativo.
- Não usar `user_metadata`, `localStorage` ou conteúdo enviado pelo formulário
  como fonte de autorização.
- Definir comportamento determinístico para múltiplas abas e trocas concorrentes.
- Garantir defesa em profundidade: UI, DAL/rotas e RLS devem concordar.
- Preservar a criação rápida/avançada para ambos os modos; projetos criados
  como Orientador são autônomos e não possuem supervisão externa.
- Não executar migration, código de produto, teste mutável ou deploy nesta Change.
