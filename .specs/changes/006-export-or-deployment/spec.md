# Change 006 — Exportação e fechamento do piloto

Status: concluída em 23/07/2026.

## Objetivo

Entregar exportações fiéis em DOCX/PDF e consolidar o MVP em ambiente controlado.

## Decisões

- DOCX e PDF são gerados sob demanda no backend autenticado a partir da última versão salva.
- Arquivos não são persistidos no Supabase Storage nem na Vercel; existem apenas em memória durante a resposta.
- Supabase permanece no plano Free, sem PITR, branches pagas ou add-ons.
- O banco está em `sa-east-1` (São Paulo) e as Vercel Functions foram alinhadas a `gru1`.
- O template segue o preset `narrative_proposal` com capa `editorial_cover` adaptada ao contexto acadêmico.

## Critérios de aceite

- [x] DOCX abre e renderiza em ferramenta compatível.
- [x] PDF renderiza sem cortes, caracteres quebrados ou seções ausentes.
- [x] Conteúdo exportado coincide com a última versão salva.
- [x] Exportação exige sessão e projeto pertencente ao usuário.
- [x] Download privado não cria link público nem artefato persistente.
- [x] Deployment e smoke crítico passam.
- [x] Rollback, backup, retenção e resposta a incidentes estão documentados.

## Checklist de conclusão

- [x] Layout de documentos aprovado por renderização visual.
- [x] Exportadores implementados e validados.
- [x] Arquivos e links protegidos.
- [x] Custos, região e política inicial de dados registrados.
- [x] Backup/restore e rollback documentados.
- [x] Deploy e smoke concluídos.
- [x] Testes e documentação atualizados.

Consulte `closure-evidence.md` e `docs/operations.md`.
