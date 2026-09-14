# Cenários obrigatórios

## Fluxo principal

1. Conta A seleciona Aluno, aceita termos e cria projeto.
2. A vincula o e-mail da conta B como orientador.
3. B em Aluno não vê nem abre o projeto de A.
4. B troca para Orientador, aceita termos se necessário e recebe o projeto.
5. B comenta, solicita correção e depois aprova uma etapa.
6. B troca para Aluno; projeto de A desaparece e tentativa direta é negada.
7. A em Aluno recebe a devolutiva e avança.
8. A troca para Orientador; seu projeto próprio desaparece e mutações falham.
9. A volta para Aluno; projeto e estado reaparecem intactos.

## Concorrência

1. Duas abas de A carregam `role_version = N` em Aluno.
2. Aba 1 troca para Orientador e recebe `N+1`.
3. Aba 2 tenta salvar etapa e trocar com versão N.
4. Servidor/RLS negam a gravação; aba 2 atualiza para o modo atual.

## Segurança

- UPDATE direto de `user_profiles`.
- RPC com versão e papel inválidos.
- Leitura direta cruzada em ambos os modos.
- Edição acadêmica pelo Orientador.
- Auto-orientação e vínculo a projeto alheio.
- Consentimento com `profileRole` oculto adulterado.
