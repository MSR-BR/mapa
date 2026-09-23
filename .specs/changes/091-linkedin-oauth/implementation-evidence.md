# Evidências de implementação protegida — 22/09/2026

## Estado

A camada da aplicação está pronta para deployment com
`LINKEDIN_AUTH_ENABLED=false`. A Change 091 ainda não está homologada porque
o aplicativo LinkedIn e o provedor `linkedin_oidc` no Supabase não foram
configurados nem testados com contas reais controladas.

## Implementado

- contrato central com allowlist exclusiva para `google` e
  `linkedin_oidc`;
- flags server-side fail-closed verificadas também na Server Action;
- callback PKCE generalizado, erros por provedor e destino interno sanitizado;
- botões acessíveis, estado de envio e telemetria enumerada sem PII;
- e-mail/senha, cadastro, recuperação e Google preservados;
- Privacidade atualizada para a versão 1.2.0;
- `LINKEDIN_AUTH_ENABLED=false` criado para Preview e Production na Vercel.

## Verificações locais

- lint, TypeScript, auditoria de segurança, exportações e build: aprovados;
- 127 testes aprovados antes do teste adicional de analytics social;
- navegador desktop 1440×1000 e móvel 390×844: conteúdo, botões de 50 px,
  ausência de overflow horizontal, overlay ou erro de runtime;
- flags ligadas no teste isolado: Google e LinkedIn renderizados;
- flags ausentes/desligadas: ambos ocultos e senha preservada;
- scanner: nenhum segredo ou token encontrado.

## Estado externo observado

O endpoint público de configuração do Supabase respondeu 200: Google e e-mail
ativos; `linkedin_oidc` inativo. A consulta não acessou dados de usuários nem
exibiu a chave pública usada na requisição.

## Pendências para homologação

1. Criar/confirmar aplicativo LinkedIn sob controle do responsável e habilitar
   “Sign In with LinkedIn using OpenID Connect”.
2. Cadastrar o callback Supabase e configurar Client ID/Secret somente no painel
   Supabase.
3. Homologar conta nova, mesma conta/e-mail verificado, e-mail diferente,
   cancelamento e ausência de e-mail.
4. Revalidar Aluno, Orientador, troca de modo, projetos, revisão e RLS.
5. Ativar a flag, observar produção e só então concluir CPD/Pó Mágico da C91.
