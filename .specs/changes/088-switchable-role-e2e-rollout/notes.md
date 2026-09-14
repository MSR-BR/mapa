# Notas

- O E2E deve validar permissões, não apenas textos visíveis.
- Contas de teste podem permanecer, mas projeto, workflow, eventos operacionais
  temporários e vínculos criados pelo teste devem ser removidos.
- Logs e analytics registram somente modo anterior/novo, resultado e código de
  motivo; nunca e-mail ou conteúdo acadêmico.
- Se houver falha crítica após policies estritas, manter a aplicação compatível
  e aplicar correção roll-forward; não fazer downgrade destrutivo do schema.
