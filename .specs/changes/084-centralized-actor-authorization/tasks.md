# Tarefas

1. Criar tipos discriminados e DAL `server-only` do contexto do ator.
2. Substituir `loadUserProfile` fail-open por leitura com erro explícito.
3. Integrar o contexto ao layout, dashboard e página de projeto.
4. Aplicar gate de proprietário+autoria compatível a criar, atualizar, duplicar,
   excluir, gerar, descobrir, selecionar, definir, estruturar capítulos,
   metodologia, mapa final, navegar, referenciar, integrar e exportar.
5. Fazer a criação gravar autoria pelo contexto server-side; impedir seleção
   dessa autoria pelo cliente.
6. Aplicar gate Aluno a definir orientador, enviar para supervisão e lembrar o
   orientador.
7. Aplicar gate Orientador+vínculo à revisão e ao lembrete ao estudante.
8. Garantir que duplicação preserve autoria e integração aceite somente fontes
   do perfil ativo, produzindo saída com a mesma autoria.
9. Corrigir consentimento legal para ignorar `profileRole` do cliente.
10. Criar respostas HTTP e testes de estado obsoleto/erro de banco.
11. Manter tudo atrás da flag e executar CPD sem habilitá-la.
