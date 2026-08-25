# Change 050 — Persistência do orientador no projeto

Status: concluída

## Origem

Relatório `MAPA DA PESQUISA (1).docx`, registro de 25/08/2026: ao reabrir um
projeto com orientador já salvo, o campo de e-mail volta a aparecer como se
estivesse vazio.

## Objetivo

Fazer o vínculo do orientador persistir visualmente e funcionalmente entre
aberturas, dispositivos e retomadas do projeto, sem solicitar novamente um
e-mail já salvo.

## Escopo

- Reidratar o e-mail e o estado do vínculo a partir do projeto salvo.
- Exibir, por padrão, um resumo de orientador vinculado ou pendente, em vez do
  formulário aberto novamente.
- Oferecer uma ação explícita “Alterar orientador” para substituir ou remover
  o vínculo quando o autor desejar.
- Manter o vínculo pendente quando a conta ainda não existir e concluir a
  associação quando o orientador entrar com o mesmo e-mail.
- Aplicar o comportamento ao Mapa Rápido, ao Mapa Avançado e à edição do
  projeto no dashboard.
- Preservar notificações, permissões e RLS atuais.

## Critérios de aceite

1. Após salvar um e-mail, recarregar o projeto não exibe um campo vazio nem
   perde o valor salvo.
2. Um projeto com vínculo confirmado mostra o orientador e o estado “Conta
   vinculada”.
3. Um projeto com vínculo pendente informa que o e-mail foi guardado e que a
   associação será concluída quando a conta for criada.
4. O formulário só abre depois de uma ação explícita de alteração.
5. O fluxo E2E aluno–orientador continua aprovando, comentando e notificando
   normalmente.
