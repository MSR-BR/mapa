# Validação

- `node --import tsx --test tests/dashboard-continuation.test.ts`: 3/3.
- `npm test` na base publicada: 216/216 principais, 13/13 DOI, 39/39 AI e 4/4 de glob; harnesses adicionais sem falha.
- `npm run typecheck`: passou. `npm run lint`: zero erros, um aviso preexistente em `tests/foundation.test.mjs`.
- `next build --webpack` com fonte Geist local de teste: passou (22 páginas estáticas, rotas dinâmicas compiladas). O build Turbopack padrão não passou no ambiente isolado: primeiro por rede bloqueada para Google Fonts, depois por porta interna negada pelo host; a tentativa com mock também esbarrou no resolvedor interno. Isso não prova defeito do app. Um build remoto real continua necessário antes do deploy.
- Prévia real da **branch limpa** em 572 px: frase visível logo abaixo dos dois botões, sem sobreposição; [captura](../../../docs/divulgacao/c154-home-implemented-preview.jpg). AX expõe a frase e os dois links com destinos preservados. Clique no CTA abriu `/mapa` com formulário Rápido/Avançado. Requisição sem cookie a `/mapa` retornou HTTP 200 com formulário, link “Entrar” e promessa de Google; não se gerou projeto nem custo de IA.
- Dashboard autenticado não foi aberto para evitar leitura de título/conteúdo de projeto privado; a matriz de permissões/estados foi verificada por testes de função pura. Revisão visual real desse cartão com conta de teste ainda não realizada.
- `security_fast_check.py --mode worktree`: PASS, 19 arquivos, zero gatilhos sensíveis. `npm run security:audit`: PASS_WITH_ACCEPTED_RISK, com riscos residuais do perfil S3 já documentados; nenhuma migration ou mudança de API/Auth/segredo.
