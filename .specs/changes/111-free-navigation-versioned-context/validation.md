# Validação C111 — 06/10/2026

## Evidência local

- 182 testes: 169 da suíte principal e 13 de DOI, sem falhas. Dez testes de domínio C111 incluem os 49 pares de navegação, rascunho/contexto, descendentes preservados, proposta independente, restauração de metodologia, 1.000 entradas legadas e isolamento da duplicação.
- Harness importa as rotas reais; somente autenticação, banco, provedores e e-mail são fronteiras sintéticas. Navegação escreve zero vezes e chama IA zero vezes; gravação idêntica não cria revisão; confirmação conserva capítulos; CAS atrasado é rejeitado com 409; acesso indevido é negado; lista de versões não contém corpos.
- Chromium e WebKit, 320/1280 px: editar, cancelar saída, falhar ao salvar, salvar/retornar/recarregar, botão Voltar, foco do aviso, proposta/descartar, comparação e mapa final: 4/4. Layout anterior: 28/28 cenários, 320–1440 px, Aluno/Orientador. Sem overflow ou exceções de página.
- PostgreSQL 17 descartável: 20 migrations, aplicação C111 repetida, 1.000 entradas legadas preservadas, grants/RLS, outro proprietário, modo inativo, orientador autorizado, escrita direta no histórico negada, cliente antigo bloqueado, congelamento da revisão pendente, aprovação e concorrência: PASS.
- PDF/DOCX gerados; lint e TypeScript aprovados. Compilação Next com webpack: ver recibo CPD. Turbopack local encontrou EPERM ao abrir porta, por isso usado o compilador alternativo oficial.
- Segurança: auditoria estática PASS_WITH_ACCEPTED_RISK; runtime npm audit sem vulnerabilidades após sharp 0.35.5/source-map-js 1.2.2. Auditoria completa mantém alerta dev-only de braces (detalhe abaixo); não é reportada como PASS integral.

## Limites

Os testes funcionais usam dados sintéticos e não chamam IA paga. Não equivalem a E2E autenticado de usuários reais em produção. História legada só tinha elementos, sem versões das relações: o produto informa essa limitação e mantém relações atuais na recuperação. Versões C111 guardam unidades completas.

## Segurança das dependências

GHSA-vfj7-8cjw-p6xm (braces <=3.0.3) não possui versão corrigida. Nesta árvore está exclusivamente em eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch. A configuração de lint usa padrões do repositório, sem entrada acadêmica ou padrões fornecidos por usuários; não há caminho HTTP da aplicação para esse pacote. Responsável pelo projeto: Mario; limite operacional: somente ferramenta de desenvolvimento/build com padrões controlados. Reavaliar no próximo update de ESLint/Next ou se padrões externos forem aceitos. Não foi feito downgrade nem ocultado o alerta; o gate composto retorna não zero no npm audit completo. Decisão técnica desta entrega: risco residual restrito ao lint, sem bloqueio da publicação do runtime auditado.

Fontes primárias: [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
