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
