# Tarefas

1. Refatorar dashboard para carregar a biblioteca própria compatível com o modo.
2. Compartilhar `QuickStartForm` e os fluxos Rápido/Avançado entre os dois
   modos, com autoria definida pelo servidor.
3. No Orientador, criar seções distintas “Meus projetos” e
   “Projetos orientados”.
4. No Aluno, manter somente projetos próprios e ferramentas de supervisão.
5. Refatorar página de projeto para selecionar editor próprio ou workspace de
   revisão somente após autorização DAL.
6. Substituir “orientador proprietário” derivado do perfil por projeto autônomo
   derivado de `authoring_role=advisor`.
7. Auditar menus, botões, modais, estados vazios, lembretes e textos legais.
8. Corrigir contexto analytics e adicionar `profile_mode_changed` sem PII.
9. Validar acessibilidade e responsividade de ambos os modos.
10. Publicar com flag desligada e executar CPD.
