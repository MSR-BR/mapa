# Requisitos

## Gate obrigatório

- Não iniciar o corte enquanto a C91 não estiver concluída em produção.
- Exigir Google e LinkedIn públicos, estáveis e testados com contas
  reais controladas.
- Inventariar contas somente por senha e garantir pelo menos uma identidade
  social vinculada a cada conta que precise continuar acessando o produto.
- Preparar comunicação e suporte antes da janela de corte.

## Interface e rotas

- Manter somente os botões “Continuar com Google” e “Continuar com LinkedIn” na
  tela de acesso.
- Remover formulário de e-mail/senha, link de cadastro e “Esqueci minha senha”.
- Desativar ou redirecionar de forma explícita `/signup`, `/forgot-password` e
  `/reset-password`, preservando um retorno claro ao login social.
- Remover mensagens e telemetria exclusivas de senha.
- Preservar `/auth/callback` para OAuth/OIDC e destinos internos seguros.

## Conta e dados

- Não remover o campo de e-mail da identidade, perfil, notificações, suporte ou
  vínculo Aluno–Orientador.
- Não criar nova conta quando o usuário entra com uma identidade já vinculada.
- Preservar `user.id`, modo ativo, autoria, projetos, revisões, exportações e
  preferências.
- Não fundir automaticamente contas com e-mails diferentes.
- Não apagar usuários, senhas ou identidades como parte do rollout inicial.

## Supabase e segurança

- Desabilitar novos cadastros por senha e impedir entrada por senha no servidor
  somente após o gate de continuidade e validação do rollback.
- Manter chaves administrativas exclusivamente no servidor/painel autorizado.
- Não editar tabelas internas de Auth diretamente.
- Fazer alterações remotas somente com autorização explícita e evidência do
  projeto Supabase correto.
