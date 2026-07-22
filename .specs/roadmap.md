# Roadmap de implementação

## Princípios de sequenciamento

Cada fase entrega uma base verificável para a seguinte. Integrações externas permanecem atrás de contratos. O avanço depende da aprovação e da conclusão do gate anterior.

| Ordem | Mudança | Estado em 22/07/2026 | Resultado e gate de saída |
|---|---|---|---|
| 001 | Criar estrutura do projeto | Concluída | Next.js/Vercel saneado, ferramentas e smoke aprovados. |
| 002 | Implementar fundação do MVP | Concluída | Autenticação, Supabase Free, RLS, migração e shell aprovados. |
| 003 | Implementar projetos e briefing | Parcialmente antecipada | CRUD básico existe; faltam validação por campo, proteção contra perda e E2E completo. |
| 004 | Implementar geração e editor | Não iniciada | Job, estrutura validada, progresso, regeneração e edição. |
| 005 | Testes e validação | Não iniciada | Cobertura crítica, segurança, acessibilidade e responsividade do MVP completo. |
| 006 | Exportação e deployment | Não iniciada | DOCX/PDF, custos, região, retenção, LGPD e produção Vercel. |

## Marcos

- M0: arquitetura e especificações aprovadas — concluído.
- M1: fundação técnica pronta — concluído.
- M2: gerenciamento de projetos utilizável — parcialmente entregue, formalizado na Change 003.
- M3: estrutura gerada e editável — pendente.
- M4: MVP validado — pendente.
- M5: piloto implantado — pendente.

## Dependências externas

- Hosting: Vercel confirmado.
- Banco e Auth: Supabase/PostgreSQL confirmado no projeto `aeaweherkrqmlqnxsmib`.
- Provedor de IA e orçamento: decidir antes da Change 004.
- Contrato do Research Starter: necessário antes de qualquer integração específica.
- Custos, região final, privacidade, retenção, termos e responsável pelo tratamento: decidir antes do piloto na Change 006.

## Fora do roadmap do MVP

Templates por área, versões, compartilhamento, colaboração em tempo real, integração bibliográfica e ferramentas adicionais serão avaliados após métricas e feedback do piloto.
