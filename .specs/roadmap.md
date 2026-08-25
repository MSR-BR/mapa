# Roadmap de implementação

## Princípios de sequenciamento

Cada fase entrega uma base verificável para a seguinte. Integrações externas permanecem atrás de contratos. O avanço depende da aprovação e da conclusão do gate anterior.

| Ordem | Mudança | Estado | Resultado e gate de saída |
|---|---|---|---|
| 001 | Criar estrutura do projeto | Concluída | Next.js/Vercel saneado, ferramentas e smoke aprovados. |
| 002 | Implementar fundação do MVP | Concluída | Autenticação, Supabase Free, RLS, migração e shell aprovados. |
| 003 | Implementar projetos e briefing | Concluída | CRUD, briefing validado, proteção contra perda e evidências encerrados. |
| 004 | Implementar geração e editor | Concluída | Research Starter, Gemini, schema 1.0.0 e editor persistente aprovados. |
| 005 | Testes e validação | Concluída | Jornada real, segurança, responsividade, dependências e produção aprovadas. |
| 006 | Exportação e fechamento do piloto | Concluída | DOCX/PDF, região, retenção inicial, rollback e produção aprovados. |
| 007 | Dashboard, integração e referências | Concluída | Navegação, integração de mapas, literatura otimizada e referências nas exportações. |
| 008 | Login com Google | Concluída | Login Google e e-mail operacionais no domínio canônico. |
| 009 | Mapa da Pesquisa v2 | Concluída | Contrato global, estados, persistência e regras da nova jornada aprovados. |
| 010 | Descoberta de propostas | Concluída | Prompt pesquisado e seis cards distintos e fundamentados, com integração real validada. |
| 011 | Problemática e objetivos | Concluída | Etapas 1, 2 e 3 editáveis, versionadas e validadas. |
| 012 | Capítulos 2 e 4 | Concluída | Etapas 4 e 5 editáveis, rastreáveis e ligadas aos objetivos e à literatura verificável. |
| 013 | Metodologia e resultados esperados | Concluída | Matriz metodológica completa por objetivo, com classificação editável e resultados esperados validados. |
| 014 | Rastreabilidade e coerência | Concluída | Página final única, grafo de origem/destino e motor de regras. |
| 015 | Transição e entrega do v2 | Implantada em produção | Legado preservado, dashboard/exportações atualizados, CPD e smoke público concluídos; pendente apenas validação autenticada real. |
| 025 | Entrada estruturada da situação-problema | Concluída | Cinco perguntas orientadas substituem o prompt único, preservam o briefing no workflow e chegam à descoberta com compatibilidade legada. |
| 026 | Tipo de produto e níveis de aprofundamento | Concluída | Seleção de TCC, monografia, dissertação, tese e artigos, com guia auxiliar aplicado às instruções da IA em todas as etapas. |
| 027 | SEO, landing page e indexação pública | Concluída | Metadados, dados estruturados, textos públicos, sitemap, robots e documentação alinhados às entradas estruturadas e aos produtos acadêmicos. |
| 028 | Compatibilidade de rascunhos legados | Concluída | Recuperação de prompts antigos sem perder a validação mínima da nova entrada estruturada. |
| 029 | Recuperação do briefing após autenticação | Concluída | Rascunho preservado até a criação ser confirmada, com recuperação mesmo se o callback perder o parâmetro de retorno. |
| 030 | Roteiro rápido e construção avançada | Concluída | Prompt livre com sugestões e entrada estruturada coexistem em cards recolhíveis, com persistência segura nos dois caminhos. |
| 031 | Recuperação do callback Google | Concluída | Código OAuth recebido na URL raiz é trocado por sessão e retorna ao dashboard; falhas preservam o destino e o rascunho. |
| 032 | Retomada pós-login e início recolhido | Concluída | O rascunho autenticado aguarda o aceite legal, segue direto para a descoberta em cards e o dashboard oferece roteiro rápido e construção avançada recolhidos por padrão; textos legais atualizados. |
| 033 | Distribuição do suporte para a equipe | Concluída | Mensagens enviadas por suporte@mapadapesquisa.com.br chegam aos e-mails institucionais de Mario Reis e Sérgio França; o reply-to continua sendo o e-mail informado pelo usuário. |
| 034 | Recebimento direto em suporte@mapadapesquisa.com.br | Concluída | Resend Receiving, MX, webhook e endpoint verificados; mensagem externa encaminhada com sucesso para `marioreis@id.uff.br` e `sfranca@id.uff.br`. |
| 035 | Teste E2E aluno–orientador | Concluída | Runner autenticado executou o fluxo de perfis, vínculo, leitura supervisionada, correção, aprovações, mapa final e referências em projeto temporário; limpeza confirmada. |
| 036 | Auditoria Supabase e segurança residual | Concluída | Migrations remotas e locais, grants das funções SECURITY DEFINER, RLS remoto autenticado/anônimo, rate limiting, Firewall publicado em modo observação, advisor via CLI, build e smoke aprovados; a indisponibilidade do conector MCP não bloqueia a auditoria equivalente. |
| 037 | Revisão legal e autorização do responsável | Concluída | Termos, privacidade, consentimento por papel, créditos, contatos e acessibilidade revisados; autorização de uso confirmada pelo professor responsável da UFF. |
| 038 | Domínio `www` | Concluída | Domínio raiz confirmado como único endereço público; hosts técnicos antigos redirecionam para ele e `www` foi deliberadamente não publicado. |
| 039 | Fechamento operacional do piloto | Concluída | CPD técnico, E2E, domínio, integrações, segurança de aplicação, exportações, Docker local, smoke, commit limpo e tag `v21082026.1` aprovados. |
| 040 | Paridade dos modos de entrada na home | Concluída | Home alinhada ao dashboard, com Mapa Avançado recomendado, Mapa Rápido recolhido e contraste visual entre os cards. |
| 041 | Relatos de problemas e triagem privada | Concluída | Formulário na home e no app, anexos privados, RLS por usuário, notificação Resend e painel de triagem restrito à equipe. Migration, testes e produção aprovados. |
| 042 | Mapa Rápido com sugestões resilientes | Concluída | Sugestões locais aparecem enquanto o usuário digita, refinamento por IA continua quando disponível e o fluxo rápido mantém alternativas de tema, formulação e recorte sem bloquear o início. |
| 043 | Descoberta de propostas resiliente | Concluída | Research Starter e Gemini têm tratamento de respostas inválidas, retry transitório, normalização de referências, limite de tempo, retry de cards e diagnóstico por etapa; o briefing é preservado. |
| 044 | Validação final do pipeline Gemini + Research Starter | Concluída | Smokes reais do Gemini, Research Starter e descoberta, E2E autenticado aluno–orientador, exportação PDF, testes, lint, typecheck, build, deploy e smoke público aprovados. |
| 045 | Observabilidade e manutenção pós-piloto | Concluída | Correlation ID, logs operacionais sanitizados, health check sem cache, runbook, testes e smoke público aprovados; produção em `v23082026.4`. |
| 046 | PDF final conforme modelo acadêmico e registro CBL | Concluída | PDF final reorganizado no formato do modelo fornecido, com capítulos 1–5, referências cruzadas, link do aplicativo, registro CBL/ISBN e código de barras incorporado; produção em `v23082026.5`. |
| 047 | Conclusão, impactos e agenda de pesquisa | Concluída | PDF final diferencia resultados esperados, explicita impactos potenciais, oportunidades derivadas da literatura e recomendações relacionadas ao tema, objetivos e referências. |
| 048 | Recuperação de senha e retorno seguro | Concluída | Link de recuperação usa confirmação OTP segura, preserva destinos internos e mantém compatibilidade com callbacks antigos. |
| 049 | Auditoria final e encerramento operacional | Concluída | Código, Supabase, integrações, segurança, exportações, domínio, produção e CPD revalidados; versão final publicada em `v23082026.8`. |
| 050 | Persistência do orientador no projeto | Concluída | Reabertura mostra o orientador salvo e só abre a edição mediante ação explícita; versão `v25082026.1`. |
| 051 | Linguagem de cobertura dos objetivos | Concluída | Capítulos 2 e 4 usam “Atende parcialmente” e “Atende completamente”, com cobertura OE/OEG no mapa final e PDF; versão `v25082026.2`. |
| 052 | Explicação e garantia da otimização da literatura | Concluída | Card e endpoint explicam a nova busca no Research Starter, preservam referências externas e informam as associações recalculadas; versão `v25082026.3`. |
| 053 | Auditoria de regressão do relatório de 21–25/08 | Concluída | Auditoria local, E2E autenticada, integrações Gemini/Research Starter, Supabase/RLS, segurança, exportação PDF, domínio canônico, SEO, callbacks e smoke de produção aprovados; limitação do Docker local e `www` não publicado ficaram documentados; versão `v25082026.5`. |
| 054 | Instrumentação de produto e funis no GA4 | Planejada | Contrato de eventos, métricas de acesso, ativação, conclusão, abandono, etapas, aluno–orientador, literatura, exportação e suporte, com consentimento e sem PII; implementação e validação no GA4 ficam para a próxima etapa. |

## Marcos

- M0: arquitetura e especificações aprovadas — concluído.
- M1: fundação técnica pronta — concluído.
- M2: gerenciamento de projetos utilizável — concluído.
- M3: estrutura gerada e editável — concluído.
- M4: MVP validado — concluído.
- M5: piloto implantado — concluído em ambiente controlado.
- M6: fluxo conceitual v2 aprovado — concluído.
- M7: descoberta, problemática, objetivos, capítulos, metodologia e resultados esperados validados.
- M8: mapa rastreável e coerente entregue — concluído.
- M9: v2 implantado com compatibilidade legada — concluído em produção; validação autenticada real permanece como checklist operacional.

## Dependências externas

- Hosting: Vercel confirmado.
- Banco e Auth: Supabase/PostgreSQL confirmado no projeto `aeaweherkrqmlqnxsmib`.
- Provedor de IA: Gemini 2.5 Flash confirmado na conta já paga pelo responsável.
- Contrato do Research Starter: v1 integrado exclusivamente pelo backend.
- Custos, privacidade, retenção, termos e responsável pelo tratamento devem continuar monitorados durante o rollout do v2.

## Evolução pós-MVP aprovada para especificação

O Mapa da Pesquisa v2 substitui a geração monolítica por descoberta assistida, validação em etapas, biblioteca metodológica, rastreabilidade e coerência. A implementação deve seguir estritamente as Changes 009 a 015, uma por vez.

## Fora do roadmap atual

Templates completos por área, compartilhamento, colaboração em tempo real, redação integral da pesquisa e aprendizado entre usuários permanecem fora do escopo.
