# Operação do Mapa da Pesquisa

## Ambiente

- Produção: `https://mapadapesquisa.com.br`
- Versão pública: `v18082026.1` (tag Git correspondente)
- Vercel Functions: `gru1` (São Paulo), uma única região compatível com o plano Hobby.
- Supabase: projeto `aeaweherkrqmlqnxsmib`, plano Free, região `sa-east-1`.
- Gemini e Research Starter: chaves exclusivamente server-side.

## Autenticação e domínio canônico

- `NEXT_PUBLIC_APP_URL` na Vercel: `https://mapadapesquisa.com.br`.
- Site URL no Supabase Auth: `https://mapadapesquisa.com.br`.
- Redirect URL permitida no Supabase Auth: `https://mapadapesquisa.com.br/auth/callback`.
- `https://mapa-gray-two.vercel.app` deve responder com redirecionamento permanente para o domínio canônico.
- Depois de alterar qualquer domínio, validar o fluxo completo “tema → login → callback → geração”; uma Site URL correta sem a Redirect URL permitida faz o Supabase descartar o callback PKCE solicitado.

## Custos e limites

- Não ativar plano pago, PITR, branch, read replica ou add-on no Supabase sem nova aprovação explícita.
- Exportações não usam Supabase Storage.
- Geração externa ocorre somente por ação explícita, com até 20 referências.
- Monitorar uso do Gemini na conta já paga e uso do Supabase no painel Free.

## Retenção e LGPD — política inicial do piloto

- Dados de projeto são mantidos enquanto a conta estiver ativa e forem necessários ao serviço.
- “Excluir projeto” oculta imediatamente o projeto e seus derivados da aplicação.
- Registros excluídos devem ser purgados em até 30 dias no piloto, após verificação de backup e solicitação pendente.
- Exportações não são armazenadas pelo Mapa; a cópia baixada passa a ser responsabilidade do usuário.
- Solicitações de acesso, correção ou eliminação devem ser tratadas pelo responsável pelo produto antes da abertura pública.
- Não registrar prompts, documentos, chaves ou conteúdo acadêmico completo em logs.

## Backup no Supabase Free

O plano Free não oferece ao responsável o mesmo fluxo de restauração diária dos planos pagos. Antes de migrações destrutivas ou de um piloto relevante:

1. Obter a connection string direta do projeto sem registrá-la no Git.
2. Executar `supabase db dump` ou `pg_dump` em ambiente confiável.
3. Criptografar o dump e armazená-lo fora do Supabase, em local controlado pelo responsável.
4. Validar o arquivo com `pg_restore --list` ou restauração em banco temporário autorizado.
5. Registrar data, responsável, checksum e resultado da validação.

## Rollback da aplicação

1. Identificar o último deployment estável com `npx vercel ls`.
2. Executar `npx vercel rollback <deployment-id>` ou promover o deployment estável.
3. Validar `/api/health`, login, projeto, geração existente e exportações.
4. Consultar logs de produção e registrar o incidente.

## Falha de exportação

1. Confirmar que a estrutura está salva e sem alterações pendentes.
2. Verificar autenticação e propriedade do projeto.
3. Consultar logs Vercel sem registrar o conteúdo do documento.
4. Reproduzir com `npm run exports:verify`.
5. Renderizar os arquivos de teste antes de novo deployment.

## Smoke pós-deploy

1. `GET /api/health` retorna `status: ok`.
2. Usuário anônimo é redirecionado ao login no dashboard.
3. Usuário autenticado abre o próprio projeto.
4. DOCX e PDF retornam `200`, MIME correto e `Content-Disposition: attachment`.
5. Arquivo real abre/renderiza e corresponde à versão indicada na interface.
