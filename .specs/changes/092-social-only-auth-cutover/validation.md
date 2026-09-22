# Validação

## Antes do corte

- Relatório assinado de que não restam contas necessárias sem acesso social.
- Login, logout e nova sessão aprovados nos dois provedores.
- Teste documentado de rollback da interface e da configuração de senha.
- Termos, Privacidade, ajuda e comunicação revisados.

## Depois do corte

- Login novo e recorrente por Google e LinkedIn.
- Conta previamente criada por senha mantém o mesmo ID e os mesmos projetos.
- Rotas e ações antigas de senha não permitem autenticação nem cadastro.
- Callback: sucesso, cancelamento, erro, sessão expirada e `next` inválido.
- Perfis Aluno/Orientador, troca de modo, supervisão obrigatória, revisão,
  exportações e isolamento RLS.
- `npm run check`, auditoria de segurança, E2E, build e `git diff --check`.
- Deploy, health, domínio canônico, logs e janela de observação sem 5xx/loops.
