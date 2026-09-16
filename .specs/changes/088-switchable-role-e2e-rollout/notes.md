# Notas

- O E2E deve validar permissões, não apenas textos visíveis.
- “Projeto próprio” sempre significa autoria compatível com o perfil ativo; a
  troca de perfil não reclassifica o projeto.
- O e-mail da Vercel é evidência datada, não autorização para trocar
  nameservers. DNS externo é suportado e está funcional na verificação de
  16/09/2026.
- A troca para DNS da Vercel é opcional e precisa preservar todos os registros,
  especialmente os de e-mail/Resend.
- Contas de teste podem permanecer, mas projeto, workflow, eventos operacionais
  temporários e vínculos criados pelo teste devem ser removidos.
- Logs e analytics registram somente modo anterior/novo, resultado e código de
  motivo; nunca e-mail ou conteúdo acadêmico.
- Se houver falha crítica após policies estritas, manter a aplicação compatível
  e aplicar correção roll-forward; não fazer downgrade destrutivo do schema.
