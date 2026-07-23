# Roadmap de implementação

## Princípios de sequenciamento

Cada fase entrega uma base verificável para a seguinte. Integrações externas permanecem atrás de contratos. O avanço depende da aprovação e da conclusão do gate anterior.

| Ordem | Mudança | Estado em 22/07/2026 | Resultado e gate de saída |
|---|---|---|---|
| 001 | Criar estrutura do projeto | Concluída | Next.js/Vercel saneado, ferramentas e smoke aprovados. |
| 002 | Implementar fundação do MVP | Concluída | Autenticação, Supabase Free, RLS, migração e shell aprovados. |
| 003 | Implementar projetos e briefing | Concluída | CRUD, briefing validado, proteção contra perda e evidências encerrados. |
| 004 | Implementar geração e editor | Concluída | Research Starter, Gemini, schema 1.0.0 e editor persistente aprovados. |
| 005 | Testes e validação | Concluída | Jornada real, segurança, responsividade, dependências e produção aprovadas. |
| 006 | Exportação e fechamento do piloto | Concluída | DOCX/PDF, região, retenção inicial, rollback e produção aprovados. |

## Marcos

- M0: arquitetura e especificações aprovadas — concluído.
- M1: fundação técnica pronta — concluído.
- M2: gerenciamento de projetos utilizável — concluído.
- M3: estrutura gerada e editável — concluído.
- M4: MVP validado — concluído.
- M5: piloto implantado — concluído em ambiente controlado.

## Dependências externas

- Hosting: Vercel confirmado.
- Banco e Auth: Supabase/PostgreSQL confirmado no projeto `aeaweherkrqmlqnxsmib`.
- Provedor de IA: Gemini 2.5 Flash confirmado na conta já paga pelo responsável.
- Contrato do Research Starter: v1 integrado exclusivamente pelo backend.
- Custos, região final, privacidade, retenção, termos e responsável pelo tratamento: decidir antes do piloto na Change 006.

## Fora do roadmap do MVP

Templates por área, versões, compartilhamento, colaboração em tempo real, integração bibliográfica e ferramentas adicionais serão avaliados após métricas e feedback do piloto.
