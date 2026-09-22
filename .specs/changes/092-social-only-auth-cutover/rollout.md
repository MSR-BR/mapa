# Rollout e recuperação

## Pré-condições inegociáveis

- C91 concluída e CPD aprovado.
- Nenhuma conta necessária depende exclusivamente de senha.
- Dois provedores públicos e saudáveis.
- Responsável disponível para suporte e rollback.

## Ativação

1. Publicar a interface social-only com bloqueio reversível controlado.
2. Fazer smoke com contas novas e existentes nos dois provedores.
3. Desativar novos cadastros/entrada por senha no Supabase após autorização.
4. Repetir E2E de perfis e observar erros de Auth/callback.
5. Manter janela ampliada de observação e suporte.

## Recuperação

- Se um único provedor falhar, desligar sua flag e orientar os demais.
- Se houver bloqueio relevante de contas, reativar temporariamente senha no
  servidor e na interface, sem recriar usuários nem alterar IDs.
- Se houver duplicação de identidade, interromper o rollout e investigar; não
  apagar ou mesclar contas diretamente.
- Rotacionar imediatamente qualquer credencial exposta e revisar logs.
