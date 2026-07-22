# Change 004 — Geração e editor

Status: iniciada em 22/07/2026.

## Objetivo

Gerar uma estrutura acadêmica inicial validada, permitir regeneração segura e oferecer edição persistente.

## Requisitos

- Adaptador configurável de IA e prompts versionados.
- Job assíncrono com progresso, idempotência, retry controlado e cancelamento quando viável.
- Schema canônico conforme `shared/output-format.md`.
- Editor seguro dos capítulos e seções.
- Salvamento, aviso de alterações e regeneração com confirmação.
- Aplicação integral da política anti-alucinação.
- Research Starter permanece inativo sem contrato.

## Decisões iniciais

- Schema canônico `ResearchStructure` iniciado na versão `1.0.0`.
- Prompt de estrutura iniciado como `structure-v1`.
- Os cinco capítulos obrigatórios são validados por identidade, ordem e quantidade.
- Nenhum provedor de IA, chamada externa ou recurso pago será ativado sem aprovação de orçamento.
- Até a escolha do provedor, a implementação fica restrita ao contrato, validação e segurança.

## Critérios de aceite

- Estrutura contém os cinco capítulos e seções obrigatórias.
- Resposta externa inválida não sobrescreve dados salvos.
- Progresso reflete estados reais; falha oferece nova tentativa.
- Regeneração não apaga edição sem confirmação explícita.
- Editor salva e restaura conteúdo sanitizado.
- Referências inventadas são bloqueadas ou sinalizadas antes de persistir.

## Checklist de conclusão

- [ ] Provedor, limites e orçamento aprovados.
- [x] Schema e prompt inicial versionados.
- [ ] Jobs resilientes implementados.
- [ ] Editor e proteção contra perda completos.
- [ ] Política anti-alucinação testada.
- [x] Integração Research Starter não foi inventada.
- [ ] Testes e documentação atualizados.
