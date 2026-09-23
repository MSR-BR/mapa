> **Status: cancelada em 22/09/2026.** O responsável decidiu não criar uma Página pública no LinkedIn e manter somente o login Google. Este arquivo permanece como histórico e não autoriza implementação ou ativação do LinkedIn.

# Rollout e recuperação

## Ativação

1. Implementar e testar com as flags desligadas.
2. Configurar aplicativos e segredos nos ambientes de preview/teste.
3. Liberar para equipe e contas controladas.
4. Validar identidade e dados existentes por provedor.
5. Configurar produção ainda com flags desligadas.
6. Ativar um provedor por vez e observar callback, erros e suporte.
7. Homologar o LinkedIn mantendo senha/e-mail como contingência.

## Recuperação

- Falha de um provedor: desligar somente sua flag; os demais acessos continuam.
- Loop de callback: desligar o provedor e preservar sessão/rascunho existentes.
- Suspeita de duplicação: interromper rollout, não mesclar contas manualmente e
  auditar identidades pelo processo administrativo autorizado.
- Vazamento de segredo: revogar/rotacionar no provedor e no Supabase, desligar a
  flag e revisar logs; nunca corrigir apenas no código.

A retirada de senha não faz parte desta recuperação nem desta Change.
