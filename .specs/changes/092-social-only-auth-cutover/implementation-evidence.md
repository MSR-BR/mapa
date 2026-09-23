# Evidências de implementação — Change 092

**Status:** concluída em produção em 22/09/2026.

## Resultado funcional

- Google é o único método público para entrar ou criar conta.
- LinkedIn, formulário de e-mail/senha, cadastro e recuperação por senha foram
  removidos da interface, das ações públicas e do callback.
- As rotas legadas de cadastro, recuperação, redefinição e confirmação retornam
  ao login Google-only; destinos externos continuam recusados.
- E-mail permanece como identidade, contato e chave do vínculo
  Aluno–Orientador. Usuários, identidades e dados existentes não foram apagados.
- Perfis, troca de modo, autoria, supervisão, projetos e RLS não foram alterados
  pelo corte de autenticação.

## Gates locais

- `npm run check`: lint, TypeScript, 128/128 testes, verificação de exportações
  e build Next.js 16.3.5 aprovados.
- `npm run security:audit`: aprovado; nenhuma credencial ou PII exposta.
- `git diff --check`: aprovado.
- Commit funcional: `c75cb84`.

## Preview e produção

- Preview validado: `dpl_8eu4nLjp6eMigDwD5unUNPDydrg9` — READY.
- Produção: `dpl_8ppqxCmDQEYDdMSFuGQuFgBk1PL1` — READY e aliasado a
  `https://mapadapesquisa.com.br`.
- Versão pública: `v22092026.3`; health HTTP 200 com `status=ok`.
- A tela de login contém Google e não contém input de e-mail, senha ou LinkedIn.
- Desktop e viewport móvel real de 390 × 844 px foram inspecionados: conteúdo
  visível, sem overflow horizontal e sem overlay do Next.js.
- Dashboard anônimo redireciona para `/login`.
- Signup, recuperação e reset redirecionam com HTTP 307 e aviso Google-only.
- Callback forjado com provedor diferente de Google é recusado e retorna erro
  genérico de acesso.
- Logs de erro pós-rollout: nenhum registro encontrado.

## Supabase e sessão real

- Estado remoto confirmado: `google=true`, `email=false`,
  `linkedin=false` e `linkedin_oidc=false`.
- O cadastro global permanece permitido porque novas contas Google ainda devem
  poder entrar; somente o provedor Email foi desativado.
- Uma conta Google existente concluiu login e logout no domínio canônico antes
  e depois do corte do provedor Email.
- Após o segundo login, a sessão chegou ao dashboard e solicitou o novo aceite
  legal da versão 1.3.0. O agente não aceitou termos em nome do usuário.
- Nenhum aplicativo, Client ID ou Client Secret LinkedIn foi criado.

## Configuração Vercel

- `GOOGLE_AUTH_ENABLED=true` confirmado em Preview e Production.
- `NEXT_PUBLIC_APP_VERSION=v22092026.3` confirmado como configuração pública
  em Preview e Production.
- `LINKEDIN_AUTH_ENABLED` removido de Preview e Production.

## Rollback

O corte é reversível sem recriar usuários: reativar temporariamente o provedor
Email no Supabase e promover o deployment anterior
`dpl_BkrNPsVRQhYvTpcR2EmwcwGJZaaT`. Nenhuma senha, identidade, autoria,
revisão, projeto ou vínculo foi excluído.
