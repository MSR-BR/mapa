# Requisitos

- Criar contexto canônico de ator a partir de sessão válida e banco.
- Distinguir perfil ausente, consulta falha e valor inválido; nunca assumir Aluno.
- Disponibilizar gates reutilizáveis para autoria própria compatível com o modo,
  ações exclusivas de Aluno e revisão vinculada exclusiva de Orientador.
- Autorizar projeto próprio somente quando `owner_id = auth.uid()` e
  `projects.authoring_role = user_profiles.active_role`.
- Permitir criação, Mapa Rápido/Avançado e todo o ciclo de autoria nos dois
  modos; derivar a autoria do contexto server-side, nunca do payload.
- Reservar vínculo, troca de orientador e envio à supervisão para projetos
  próprios criados como Aluno.
- Tratar projeto próprio criado como Orientador como autônomo, sem orientador e
  sem espera de aprovação externa.
- Autorizar novamente em toda mutação, mesmo que o botão esteja oculto.
- Manter Proxy apenas para renovação/checagem otimista de sessão.
- Não depender de layout, JWT custom claim, metadata ou prop do cliente.
- Padronizar códigos `profile_mode_mismatch` e `profile_mode_stale`.
- Preservar `404` para recurso sem relação e evitar vazamento de título/dados.
- Proteger o novo comportamento com `ACCOUNT_MODE_SWITCH_ENABLED=false` por
  padrão até a C87.
- Derivar o consentimento legal exclusivamente do modo autoritativo.
- Preservar `authoring_role` em duplicação e exigir fontes compatíveis com o
  modo ativo em integração; o projeto integrado herda esse mesmo perfil.
