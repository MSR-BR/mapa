# Especificação de mudanças — Mapa da Pesquisa

Status: especificação aprovada para orientação. Nenhuma mudança de produto é executada por este documento.

## Objetivo

Concluir a comunicação entre estudantes e orientadores, formalizar termos e suporte, consolidar o domínio público, melhorar descoberta orgânica, revisar exportações e executar uma auditoria de segurança antes da próxima publicação.

## Princípios comuns

- Cada change deve ser pequena, revisável e publicada somente após testes.
- Toda mudança de interface deve funcionar em celular e desktop.
- Dados pessoais, e-mails e conteúdo de projetos devem obedecer RLS e ao princípio do menor privilégio.
- Notificações devem ser idempotentes, não bloquear a ação principal e registrar falhas sem expor conteúdo sensível em logs.
- Ao final de cada etapa: CPD (check, persist, deploy/document): executar testes, verificar persistência/autorização, documentar resultado e só então publicar.

## Change 15 — Fluxo completo de notificações

### Submudanças

1. Mapear todos os eventos que exigem ação: envio de etapa pelo estudante, comentário/solicitação de correção do orientador, validação do orientador, convite ou vínculo de orientador.
2. Definir destinatário, remetente, `reply-to`, assunto, corpo e link direto para cada evento.
3. Usar `notificacao@mapadapesquisa.com.br` como remetente normal e `noreply@mapadapesquisa.com.br` quando não houver autor para respostas.
4. Garantir que a resposta do e-mail vá ao autor da intervenção, quando disponível.
5. Criar deduplicação por evento/etapa/revisão para evitar e-mails repetidos em retries.
6. Tratar falha do Resend como erro observável e não como falha da operação de salvar/validar.
7. Criar contas de teste aluno e orientador em ambiente seguro; simular todas as transições e confirmar recebimento, conteúdo e links.
8. Testar autorização: aluno não pode validar como orientador; orientador só vê projetos vinculados; notificações não vazam dados de outro projeto.

### Critérios de aceite

- Cada intervenção gera no máximo uma notificação por destinatário/evento.
- O e-mail identifica projeto, etapa, ação necessária e botão/link correto.
- Fluxo aprovado, rejeitado e corrigido é testado nos dois perfis.

## Change 16 — Termos, privacidade e suporte

### Submudanças

1. Criar popup de Termos de uso, Política de privacidade e Suporte; fechar ao clicar fora e por botão de fechar.
2. Exigir aceite na primeira entrada, registrando versão, data e usuário; bloquear uso autenticado até aceitar.
3. Incluir nos termos o recebimento de e-mails transacionais, uso de IA/Research Starter, armazenamento de projetos e responsabilidade de revisão pelo usuário.
4. Redigir privacidade com dados coletados, finalidade, retenção, compartilhamento com provedores, direitos do titular e contato.
5. Criar suporte `suporte@mapadapesquisa.com.br`, encaminhando mensagens para `mario.reis.junior@gmail.com` via Resend/rota segura; validar antiabuso e limite de envio.
6. Incluir créditos: Sergio Luiz Braga França (com link institucional informado) e Mario Reis, seguindo os dados já usados no projeto TERMO.
7. Adicionar logo da UFF somente com ativo autorizado e texto alternativo; não incorporar imagem de terceiros sem licença.
8. Registrar versão dos documentos e exibir “atualizado em”.

### Critérios de aceite

- Popup é acessível por teclado, responsivo e fecha ao clicar fora.
- Novo usuário não consegue usar o app sem aceitar a versão vigente.
- Mensagem de suporte chega ao endereço de destino sem expor credenciais.

## Change 17 — Domínio canônico

### Submudanças

1. Usar `https://mapadapesquisa.com.br` como URL canônica pública.
2. Confirmar aliases Vercel para raiz e `www` (se adotado) e redirecionamento único para a versão canônica.
3. Atualizar Supabase Auth redirect URLs, e-mails, links internos, metadata, sitemap e variáveis de ambiente.
4. Testar login, callback, links de e-mail, exportação e links antigos `vercel.app`.

## Change 18 — SEO técnico e conteúdo

### Submudanças

1. Definir metadata por página: title, description, canonical, Open Graph, Twitter card e idioma `pt-BR`.
2. Criar `robots.txt`, `sitemap.xml`, favicon e imagem social.
3. Marcar landing page com Schema.org apropriado (SoftwareApplication/Organization, sem alegações não comprovadas).
4. Não indexar dashboard, projetos privados, callbacks, páginas autenticadas ou dados de usuários.
5. Adicionar headings semânticos, alt text, foco visível e performance de carregamento.

## Change 19 — Landing page `/home.html`

### Submudanças

1. Criar página pública estática/SSR em `/home.html` ou rota equivalente, com redirecionamento claro da raiz.
2. Apresentar proposta de valor, etapas do mapa, Research Starter, referências, perfis aluno/orientador e CTA de cadastro.
3. Incluir créditos, contato de suporte, termos e privacidade.
4. Não revelar prompts internos, chaves, dados de projetos ou conteúdo de usuários.
5. Otimizar mobile-first, acessibilidade, LCP/CLS e compartilhamento social.

## Change 20 — Google Analytics

### Submudanças

1. Criar propriedade GA4 na conta `mario.reis.junior@gmail.com` e registrar o Measurement ID.
2. Implementar consentimento antes de analytics não essenciais; respeitar recusa e não rastrear conteúdo de projetos.
3. Medir somente eventos agregados: visita, CTA, login, início/conclusão de etapa e exportação, sem texto livre ou e-mail.
4. Documentar retenção, acesso e desligamento em ambiente de desenvolvimento.

## Change 21 — PDF final

### Submudanças

1. Adicionar rodapé/cabeçalho discreto no PDF final: “Criado com Mapa da Pesquisa” com link para `https://mapadapesquisa.com.br`.
2. Manter referências, citações cruzadas e paginação legíveis.
3. Validar visualmente PDF em A4, celular/visualizador e impressão.
4. Não inserir a marca no rascunho de modo a sugerir conclusão quando ainda houver bloqueios.

## Change 22 — Versionamento visível

### Submudanças

1. Definir convenção compatível com GitHub/SemVer: `MAJOR.MINOR.PATCH` e data de build opcional.
2. Exibir versão discreta no rodapé público e em páginas de suporte, sem poluir o dashboard.
3. Derivar a versão de uma única fonte (package/release metadata), evitando divergência.
4. Atualizar changelog/release note a cada publicação relevante.

## Change 23 — Auditoria geral e segurança

### Submudanças

1. Executar lint, typecheck, testes unitários, testes de API, build e smoke test E2E.
2. Revisar RLS, rotas server-side, validação de ownership, vínculo orientador–aluno e exposição de IDs.
3. Procurar segredos no repositório, logs e bundles; rotacionar chaves se houver exposição.
4. Revisar CSRF, XSS, sanitização de texto gerado, rate limiting, upload/exportação e limites do Resend.
5. Verificar cabeçalhos de segurança, cookies, redirects, CORS e páginas não indexáveis.
6. Testar recuperação de sessão, logout, múltiplos dispositivos e contas aluno/orientador.
7. Produzir relatório com severidade, evidência, correção e risco residual.

## Change 24 — CPD de cada etapa

Para cada change acima, antes de marcar como concluída:

1. **Check:** testes automatizados, inspeção visual e fluxo manual nos perfis relevantes.
2. **Persist:** confirmar banco, RLS, eventos e variáveis de ambiente em produção.
3. **Deploy:** publicar em preview, validar, promover para produção e registrar URL/commit.
4. **Document:** registrar resultado, pendências e instruções de rollback.

## Ordem recomendada

1. Change 15 (notificações e testes de fluxo).
2. Change 16 (termos, privacidade, suporte e créditos).
3. Change 17 (domínio canônico).
4. Change 18 e 19 (SEO e landing page).
5. Change 20 (analytics com consentimento).
6. Change 21 e 22 (PDF e versão).
7. Change 23 (auditoria final).
8. Change 24 (CPD aplicado a cada entrega).

## Dependências e decisões pendentes

- Texto jurídico final deve ser revisado pelo responsável antes de publicação.
- Logo UFF e dados biográficos devem ter autorização de uso.
- É necessário decidir se `www.mapadapesquisa.com.br` será alias ou não.
- O Measurement ID do GA4 só deve entrar após a criação da propriedade e definição de consentimento.
- O endereço de suporte deve ser tratado como encaminhamento; ele não é uma caixa de entrada automaticamente.
