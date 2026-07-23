# Change 005 — Testes e validação

Status: concluída em 23/07/2026.

## Objetivo

Validar o MVP como um sistema completo e corrigir lacunas que impeçam um piloto seguro.

## Escopo validado

- Gate local completo: lint, typecheck, testes e build de produção.
- Jornada real em produção: login, projeto, briefing, geração, edição, salvamento e recarga.
- Integrações reais com Research Starter e Gemini.
- Autorização por RLS, acesso anônimo e propriedade de projeto.
- Responsividade em viewport móvel e smoke em desktop.
- Health check, logs sanitizados e recuperação de falhas externas.
- Auditoria de dependências e documentação de riscos residuais.

## Critérios de aceite

- [x] As jornadas críticas disponíveis no MVP passam.
- [x] O quality gate de `testing-strategy.md` passa para o escopo implementado.
- [x] Não há violação conhecida de isolamento entre usuários.
- [x] Falhas externas não sobrescrevem a última estrutura válida.
- [x] Riscos residuais possuem proprietário e decisão documentada.
- [x] Evidências e procedimentos operacionais estão registrados.

## Observação de escopo

A exportação DOCX/PDF continua pertencendo à Change 006 e, portanto, não integra o gate funcional desta change. O deployment Vercel foi antecipado para permitir o teste E2E real do restante do MVP; isso não encerra a Change 006.

## Evidências

Consulte `closure-evidence.md` para a matriz requisito → teste, incidentes corrigidos, runbooks e riscos residuais.
