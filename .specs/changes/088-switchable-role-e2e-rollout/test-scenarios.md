# Cenários obrigatórios

## Fluxo principal

1. Conta A seleciona Aluno, aceita termos e cria o projeto estudantil A-S.
2. A vincula o e-mail da conta B como orientador.
3. B em Aluno cria seu projeto estudantil B-S e não vê nem abre A-S.
4. B troca para Orientador, aceita termos se necessário e recebe A-S na seção
   “Projetos orientados”.
5. B comenta e solicita correção em A-S, sem conseguir editar seu conteúdo.
6. Ainda como Orientador, B cria projetos próprios B-O pelos modos Rápido e
   Avançado, edita, integra, exporta e conclui sem supervisor externo.
7. B volta para Aluno: B-S reaparece; A-S e B-O ficam ocultos e negados por URL.
8. A em Aluno recebe a devolutiva, corrige, reenvia e B aprova como Orientador.
9. A troca para Orientador: A-S fica oculto e não pode ser editado ou
   autoaprovado; A cria um projeto autônomo A-O.
10. A volta para Aluno: A-S e sua supervisão reaparecem intactos; A-O fica
    preservado para o modo Orientador.

## Concorrência

1. Duas abas de A carregam `role_version = N` em Aluno.
2. Aba 1 troca para Orientador e recebe `N+1`.
3. Aba 2 tenta salvar etapa e trocar com versão N.
4. Servidor/RLS negam a gravação no projeto `authoring_role=student`; aba 2
   atualiza para o modo atual.

## Segurança

- UPDATE direto de `user_profiles`.
- RPC com versão e papel inválidos.
- INSERT com `authoring_role` falsificado e UPDATE posterior dessa coluna.
- Leitura direta cruzada em ambos os modos.
- Edição acadêmica pelo Orientador em projeto estudantil vinculado.
- Vínculo ou envio à supervisão em projeto próprio de Orientador.
- Auto-orientação e vínculo a projeto alheio.
- Consentimento com `profileRole` oculto adulterado.
