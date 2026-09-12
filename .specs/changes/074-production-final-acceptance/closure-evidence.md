# Evidências de encerramento — Change 074

## Resultado

A jornada publicada foi homologada com contas separadas de estudante e revisão, verificações de navegador, API, Supabase, IA e observabilidade. A auditoria corrigiu a numeração residual de seis etapas no mapa final e na área de revisão; todas as superfícies agora usam quatro macroetapas e passos internos.

## Modelo

- `gpt-5.6-sol` com raciocínio `xhigh`.

## Correções da auditoria

- mapa final: rótulos alinhados a `Etapa N/4 · Passo N/M`;
- área de revisão: a mesma nomenclatura substitui a contagem histórica de seis etapas;
- verificador E2E: tentativa de troca de papel em aluno e revisor, novo login, isolamento antes do vínculo, leitura do comentário pelo aluno e confirmação da limpeza;
- teste de fundação da C74 adicionado.

## Verificação local

- `npm run check`: aprovado;
- lint e TypeScript: aprovados;
- testes: **89/89 aprovados**;
- exportação PDF: aprovada;
- build Next.js 16.2.11: aprovado;
- `git diff --check`: aprovado;
- Gemini real: `gemini-3.6-flash`, saída estruturada compatível.

## Verificação Supabase aluno–revisor

O runner autenticado terminou com `status: ok` e limpeza automática:

- papéis permanentes confirmados em uma nova sessão;
- tentativa de alterar `student ↔ advisor` recusada e papel original preservado;
- projeto invisível à conta revisora antes do vínculo;
- vínculo feito pelo aluno e projeto liberado somente para a conta vinculada;
- edição indevida de metadados pela conta revisora bloqueada;
- comentário salvo pela revisão e relido pela conta do aluno;
- solicitação de correção exercitada;
- sete etapas aprovadas, mapa concluído e três referências associadas;
- projeto e workflow temporários removidos.

## Verificação em navegador e API

- página pública carregou com conteúdo, sem tela em branco e sem overlay de erro;
- Mapa Rápido mostrou três sugestões;
- um clique em Tema 1 preservou o texto selecionado e abriu `/login?next=/dashboard?resume=1`;
- mapa sintético em produção mostrou `Etapa 4/4`, `Passo 2/2` e quatro destinos anteriores habilitados;
- mapa final exibiu os rótulos corrigidos para problemática, objetivos, capítulos, metodologia e encerramento;
- o retorno à matriz alcançou o backend e a repetição com a revisão anterior recebeu `409`, confirmando o controle de concorrência;
- a conta de teste ainda exige consentimento inicial; o teste não registrou aceite em nome do usuário, e por isso o repaint pós-clique não foi usado como evidência.

## Integrações

- Gemini: aprovado;
- Research Starter em produção: HTTP 200, status `partial`, três referências;
- health: `ok`, com Gemini, Research Starter, Supabase e Resend configurados;
- ressalva local: a chave do Research Starter em `.env.local` respondeu HTTP 401 e deve ser sincronizada com uma credencial válida antes do próximo smoke local. A chave de produção está válida e não foi alterada.

## Deploy e observabilidade

- deployment: `dpl_cGDwTzcRhYB8EGSF5AiqiKB5zZuY`;
- artefato: https://mapadapesquisa-jjgh4iph5-msr-brs-projects.vercel.app;
- domínio canônico: https://mapadapesquisa.com.br;
- alvo: produção;
- estado: `READY`;
- domínio e health responderam HTTP 200;
- scan pós-deploy: nenhum log de erro encontrado.

## Conclusão

A C74 está concluída para produção. A única ressalva é de ambiente de desenvolvimento: renovar/sincronizar a variável local do Research Starter; isso não afeta a aplicação publicada.
