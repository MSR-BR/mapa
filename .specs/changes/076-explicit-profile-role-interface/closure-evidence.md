# Evidências de encerramento — Change 076

## Execução

- Modelo: gpt-5.6-sol com raciocínio xhigh.
- Fluxo: Pó Mágico, com especificação prévia, critérios de aceite, validação,
  evidência, aprendizado e CPD.
- Escopo de dados: nenhuma migration, alteração de RLS, vínculo ou dado
  acadêmico.

## Perfis e interface

- O primeiro acesso continua oferecendo `Sou aluno` e `Sou orientador`.
- O menu da conta identifica explicitamente `Aluno` ou `Orientador` e mostra a
  área de trabalho em segundo plano sem oferecer troca de papel.
- O dashboard identifica `Perfil Aluno` ou `Perfil Orientador`.
- A apresentação por papel foi centralizada em
  `modules/profile/presentation.ts`.
- O campo `E-mail do orientador` é habilitado para Aluno e oculto para
  Orientador; a revisão de um projeto compartilhado preserva o contexto legítimo
  de estudante.
- A revisão React/Next.js confirmou derivação direta do perfil persistido, sem
  estado duplicado, efeitos desnecessários ou violação da fronteira entre Server
  e Client Components.

## Simulação Aluno–Orientador

- `npm run supabase:verify-advisor-student`: aprovado com duas contas reais de
  teste e limpeza do projeto temporário.
- Papéis imutáveis foram confirmados após novo login.
- Isolamento antes do vínculo, associação do orientador e leitura supervisionada
  foram aprovados.
- O orientador não conseguiu editar o projeto do aluno.
- Comentário, recebimento pelo aluno, solicitação de correção e aprovação de
  todas as etapas foram aprovados.
- Mapa final, oito revisões e três referências associadas foram validados.

## Gates locais

- `npm run check`: aprovado.
- Lint e typecheck: aprovados.
- Testes: 92/92 aprovados.
- Exportação PDF: aprovada.
- Build Next.js 16.3.5 com Turbopack: aprovado.
- `git diff --check`: aprovado.

## Produção

- Deployment: `dpl_AsVvML65fECUU2XfhCGaFN4anYGd`.
- Artefato: `https://mapadapesquisa-gx3dy7kpb-msr-brs-projects.vercel.app`.
- Domínio: `https://mapadapesquisa.com.br`.
- Estado: READY, alvo Production.
- Domínio canônico: HTTP 200 com cabeçalhos de segurança ativos.
- `/api/health`: `status=ok`, com Gemini, Resend, Research Starter e Supabase
  configurados.
- Logs de erro do novo deployment: nenhum registro no período inspecionado.
- A automação visual do navegador não iniciou porque o ambiente rejeitou o
  componente symlink do caminho Dropbox. A limitação foi compensada por auditoria
  estática da interface, teste executável do contrato por papel, E2E real de duas
  contas e smoke da produção.

## Encerramento

Os critérios de aceite foram atendidos. A C76 substitui somente a neutralização
textual excessiva da C64; a permanência do perfil e o modelo de autorização
continuam inalterados.
