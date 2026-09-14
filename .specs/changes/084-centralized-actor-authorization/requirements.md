# Requisitos

- Criar contexto canônico de ator a partir de sessão válida e banco.
- Distinguir perfil ausente, consulta falha e valor inválido; nunca assumir Aluno.
- Disponibilizar gates reutilizáveis de modo Aluno, modo Orientador, projeto
  próprio e projeto vinculado.
- Autorizar novamente em toda mutação, mesmo que o botão esteja oculto.
- Manter Proxy apenas para renovação/checagem otimista de sessão.
- Não depender de layout, JWT custom claim, metadata ou prop do cliente.
- Padronizar códigos `profile_mode_mismatch` e `profile_mode_stale`.
- Preservar `404` para recurso sem relação e evitar vazamento de título/dados.
- Proteger o novo comportamento com `ACCOUNT_MODE_SWITCH_ENABLED=false` por
  padrão até a C87.
- Derivar o consentimento legal exclusivamente do modo autoritativo.
