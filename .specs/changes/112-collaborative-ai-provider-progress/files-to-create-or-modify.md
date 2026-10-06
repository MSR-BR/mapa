# Superfícies implementadas localmente

- `modules/ai/`: contrato, política, adaptadores, cancelamento, limite financeiro, revisão complementar e transporte de progresso.
- `modules/generation/gemini.ts`: 13 operações existentes passam pelo contrato comum; prompts e validações de domínio preservados.
- `lib/observability/ai-usage.ts`, `provider-health.ts` e rota health: métricas sanitizadas dos dois provedores e flag opcional.
- Rotas de descoberta, geração, definição, capítulos, metodologia, mapa final, integração e sugestões: NDJSON opcional no mesmo pedido, compatível com JSON.
- Workspaces do fluxo, painel de projetos, sugestões e histórico C111: progresso efetivo, cancelamento, propostas e revisão orientativa.
- `save-versioned-workflow.ts`, schemas e edição versionada: preservação de proposta tardia sem sobrescrever contexto recente; aceite exige versão vigente.
- Migration `20261006214054_c112_ai_budget.sql`, tipos Supabase e manifesto: duas tabelas privadas e reserva mensal atômica; sem segredo ou teto ativo na migration.
- `package.json`, lockfile, `.env.example` e aviso de privacidade: SDK OpenAI compatível, configuração de servidor e finalidade do tratamento.
- Testes de adaptadores, falhas, cancelamento, concorrência, streaming, orçamento PostgreSQL e UI Chromium/WebKit.
- Documentação C112 e linhas correspondentes do roadmap.

A chave permanece somente em `.env.local`, ignorado pelo Git. Nenhuma configuração remota, migration remota ou publicação C112 foi realizada até este registro.
