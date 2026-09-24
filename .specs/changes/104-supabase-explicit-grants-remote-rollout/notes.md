# Notas

## Decisões

- A C103 já provou a instalação nova em PostgreSQL 17; a C104 não repete essa
  auditoria sem motivo e concentra-se no estado remoto.
- O projeto público usa chave publicável e JWT; `service_role` não será movido
  para cliente nem recuperado como atalho.
- O provedor Email/senha foi aposentado na C92. Os runners legados por senha
  podem servir como especificação, mas não justificam reativar esse provedor.
- Uma falha pré-mutação é um gate de segurança bem-sucedido: ela interrompe o
  rollout até existir correção revisada e prova local.

## Rollback

- Se nenhuma mutação for necessária, o rollback remoto é não aplicável; basta
  remover fixtures e restaurar os modos das contas de teste.
- Se surgir correção de grants/RLS, o rollback não editará migrations aplicadas
  nem fará reset destrutivo. Será um roll-forward mínimo, previamente ensaiado,
  com readback pós-aplicação e restauração explícita do contrato anterior.
