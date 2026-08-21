# Change 041 — Relatos de problemas e triagem privada

**Estado:** Concluída em 21/08/2026.

## Objetivo

Oferecer um caminho claro para que alunos e orientadores relatem falhas com
contexto suficiente para diagnóstico, sem expor o conteúdo a outros usuários.
Os relatos devem ser persistidos com segurança, notificar a equipe por e-mail
e permanecer disponíveis em uma fila de triagem simples.

## Escopo

- Disponibilizar **Relatar problema** na home pública e nas áreas autenticadas.
- Abrir um formulário em modal que funcione em celular e desktop, com assunto,
  e-mail para resposta, etapa, descrição e captura de tela opcional.
- Capturar automaticamente URL, navegador e user-agent sem registrar segredos.
- Aplicar honeypot, validação de tamanho/tipo e limite de cinco envios por hora
  por IP.
- Persistir os dados em `public.bug_reports`, com RLS para que o usuário veja
  apenas seus próprios relatos e a equipe autorizada faça a triagem.
- Armazenar anexos no bucket privado `bug-report-attachments`, servindo apenas
  links assinados temporários no painel restrito.
- Notificar `marioreis@id.uff.br` e `sfranca@id.uff.br` via Resend, usando
  `notificacao@mapadapesquisa.com.br` e `reply-to` do remetente.
- Disponibilizar `/admin/bugs` somente para os dois e-mails administrativos,
  com filtros e atualização de status, prioridade e notas internas.
- Manter o relato salvo mesmo quando a notificação de e-mail estiver
  indisponível.
- Atualizar documentação operacional, robots, testes, versão pública e
  evidências de encerramento.

## Fora do escopo

- Expor anexos ou relatos publicamente.
- Criar caixa de e-mail ou alterar DNS/Resend Receiving.
- Permitir que um usuário leia ou edite o relato de outro usuário.
- Criar integrações de tickets externas.

## Regras de segurança

- Não usar `service_role` ou outra chave privilegiada no navegador.
- A lista administrativa deve ser validada no servidor, além do controle visual
  do menu.
- A mensagem de e-mail deve conter somente metadados e o identificador do
  relato; o anexo continua privado no Supabase.
- O usuário é instruído a não enviar senhas, tokens, chaves ou dados sensíveis.

## Gate de saída

- Migration criada e aplicada no projeto Supabase correto.
- Suíte de testes, typecheck, lint e build aprovados.
- Smoke da home, modal e rota administrativa concluído.
- Documentação e versão `v21082026.3` atualizadas.
