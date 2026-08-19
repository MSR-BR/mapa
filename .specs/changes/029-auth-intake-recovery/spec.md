# Change 029 — Recuperação do briefing após autenticação

Status: concluída

## Problema

O briefing estruturado preenchido na página pública era salvo antes do login,
mas podia ser apagado assim que o dashboard pós-login montava. Se o callback
perdesse `resume=1` ou a criação retornasse erro, o estudante voltava a uma
tela vazia e precisava redigitar as cinco respostas.

## Escopo

- manter o rascunho no navegador enquanto a ação de criação estiver em curso;
- recuperar qualquer rascunho recente, mesmo quando o parâmetro de retorno do
  login não sobreviver ao fluxo de autenticação;
- preservar o tipo de produto e impedir o envio automático de um briefing sem
  esse campo obrigatório;
- remover o backup somente depois do redirecionamento para uma página de
  projeto existente, que representa sucesso da criação;
- descartar somente rascunhos inválidos ou expirados (24 horas).

## Critérios de aceite

1. preencher as cinco perguntas e o tipo de produto, entrar com e-mail ou
   Google e retornar ao dashboard sem perder nenhum campo;
2. se a criação falhar, o conteúdo continuar visível para correção e tentativa;
3. se a criação funcionar, a página do projeto limpar o backup local;
4. um rascunho com mais de 24 horas não ser restaurado;
5. lint, tipos, testes e build passarem.
