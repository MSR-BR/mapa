# C119 — Validação — 15/10/2026

## Defeitos reproduzidos e correções

1. Rascunho com contexto antigo, mas revisão de workflow atual, era reportado como alteração em outra aba. Agora retorna `context_stale`, orienta salvar e revisar o contexto, e permite salvar/voltar enquanto pré-requisitos são revisados. Salvar não confirma o contexto implicitamente. O aceite explícito pelo painel existente preserva o texto e permite validar.
2. Workflow confirmado e persistido seguido de falha na atualização auxiliar do título retornava 500, induzindo a interface a declarar fracasso. Agora retorna sucesso com aviso; o título acadêmico permanece no mapa e o botão permite continuar ao encerramento. A biblioteca pode manter o título anterior até uma atualização bem-sucedida. Aprovação do orientador não é dispensada.

Além disso, erros de rede, cancelamento, resposta ilegível, persistência e conflito deixam de ser classificados indiscriminadamente como resposta inválida da IA. A rota registra versão, operação, status e códigos controlados, sem identificadores de projeto, texto acadêmico ou respostas brutas do provedor.

## Verificações executadas

- `npm run test`: **226 testes aprovados** (190 principais, 13 DOI, 23 IA), com fronteiras externas simuladas.
- `npm run test:methodology`: 14 cenários anteriores C117 e regressões C119 para contexto antigo, aceite explícito, rascunho/volta, conflito real, erro de banco, erro retornado/exceção na sincronização do título, autorização, aprovação estudantil e preservação após falha da IA.
- Rotas versionadas C111, 13 cenários por quadro C114 e limites de geração C118 aprovados.
- UI real com serviços locais sintéticos: editar título → salvar contexto antigo → reconhecer revisão → Próximo → mapa final com título preservado; falha secundária do título → aviso de metodologia salva → Continuar para encerramento → mapa final. Console do segundo percurso sem erros observados. Evidências em `evidence/`; não representam dados de usuários reais.
- Lint sem erros, um aviso preexistente em fixture de teste; TypeScript e `git diff --check` aprovados.
- Exportações DOCX/PDF, PDF Avançado final/rascunho e Rápido gerados com sucesso, sem alterar seus templates.
- Build Webpack aprovado. Primeira tentativa restrita falhou exclusivamente ao resolver Google Fonts; repetição autorizada com rede passou. Ambiente local preservado, inclusive seu identificador público antigo; versão de produção será atualizada no CPD.
- Segurança estática `PASS_WITH_ACCEPTED_RISK`; grants estáticos: 11 tabelas, 17 funções, 21 migrations. Zero vulnerabilidades nas dependências de produção; cinco high dev-only preexistentes na cadeia ESLint, sem dependência/lockfile novos. Atualização forçada sugerida pelo npm rebaixaria o framework de lint e fica fora desta correção.
- Revisão React: estado de erro local ao formulário, aplicação do workflow apenas após sucesso, texto preservado em falha, destino de recuperação com foco e avisos acessíveis. Sem alteração de autenticação, banco, RLS ou modelos.

## Limites

Os dois eventos históricos de 14/10 não contêm detalhe suficiente para atribuir causa. A consulta histórica Vercel foi recusada pelo conector/CLI; a consulta agregada Supabase também não foi autorizada. Nenhum dado privado de projeto foi retornado. **O vínculo entre os eventos e os defeitos reproduzidos é não confirmado.**

Nenhuma chamada paga de IA ou geração autenticada em produção foi executada. Os testes cobrem código real e persistência simulada; a conferência de publicação cobre health, versão e negações de acesso. Não equivale a garantir disponibilidade futura dos serviços externos.
