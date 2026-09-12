# Change 071 — Verificador E2E compatível com papel imutável

**Status:** concluída

## Objetivo

Restaurar a simulação autenticada aluno–orientador sem enfraquecer a regra de que o papel da conta é escolhido uma vez e não pode ser alterado.

## Escopo

- substituir o `upsert` de `user_profiles` por uma leitura do perfil da própria conta autenticada;
- exigir que as contas de teste já possuam os papéis permanentes esperados;
- apresentar erro instrutivo para perfil ausente ou papel divergente;
- manter a criação e a limpeza do projeto temporário já usadas pelo roteiro.

## Fora de escopo

- não alterar RLS, policies, grants ou migrations;
- não alterar papéis de contas existentes;
- não alterar a experiência do produto para aluno ou orientador.

## Critérios de aceite

1. O roteiro não faz `INSERT` ou `UPDATE` em `user_profiles`.
2. Uma conta sem perfil ou com papel divergente encerra com orientação clara, sem criar um projeto.
3. Contas de teste corretas concluem vínculo, comentários, devolução, aprovações e mapa final.
4. O projeto temporário é removido após a execução, inclusive em caso de falha depois da criação.

## CPD

- **Check:** lint, typecheck, testes e simulação `supabase:verify-advisor-student`.
- **Persist:** os dados reais e os papéis das contas de teste permanecem inalterados.
- **Deploy/document:** registrar evidência e publicar somente se a mudança passar por todos os gates.
