# Change 004 — Geração e editor

Status: concluída em 23/07/2026.

## Objetivo

Gerar uma estrutura acadêmica inicial validada, permitir regeneração segura e oferecer edição persistente.

## Requisitos

- Adaptador configurável de IA e prompts versionados.
- Job com progresso persistido, idempotência e nova tentativa controlada. Cancelamento durante chamadas externas síncronas foi considerado inviável nesta versão.
- Schema canônico conforme `shared/output-format.md`.
- Editor seguro dos capítulos e seções.
- Salvamento, aviso de alterações e regeneração com confirmação.
- Aplicação integral da política anti-alucinação.
- Research Starter opera exclusivamente no backend conforme o contrato v1 fornecido.

## Decisões iniciais

- Schema canônico `ResearchStructure` iniciado na versão `1.0.0`.
- Prompt de estrutura iniciado como `structure-v1`.
- Os cinco capítulos obrigatórios são validados por identidade, ordem e quantidade.
- Nenhum provedor de IA, chamada externa ou recurso pago será ativado sem aprovação de orçamento.
- Gemini foi aprovado como provedor de geração, usando a conta paga já mantida pelo responsável.
- Research Starter v1 foi aprovado como fonte externa de referências e evidências.
- A integração Research Starter ocorre somente no backend e limita a consulta antes de encaminhar evidências ao Gemini.

## Critérios de aceite

- Estrutura contém os cinco capítulos e seções obrigatórias.
- Resposta externa inválida não sobrescreve dados salvos.
- Progresso reflete estados reais; falha oferece nova tentativa.
- Regeneração não apaga edição sem confirmação explícita.
- Editor salva e restaura conteúdo sanitizado.
- Referências inventadas são bloqueadas ou sinalizadas antes de persistir.

## Checklist de conclusão

- [x] Provedor Gemini e conta paga aprovados; limites operacionais serão monitorados.
- [x] Schema e prompt inicial versionados.
- [x] Jobs resilientes implementados.
- [x] Editor e proteção contra perda completos.
- [x] Política anti-alucinação testada.
- [x] Integração Research Starter não foi inventada.
- [x] Testes e documentação atualizados.

## Subchanges entregues

- **004.1 — Pipeline de evidências:** Research Starter limitado a 20 referências e Gemini 2.5 Flash com saída estruturada.
- **004.2 — Execução resiliente:** estados reais persistidos, idempotência por usuário e falha sem sobrescrever conteúdo válido.
- **004.3 — Editor:** capítulos editáveis, salvamento versionado, proteção contra perda e confirmação de regeneração.
- **004.4 — Validação:** RLS, bloqueio de referências desconhecidas, testes automatizados e verificadores reais das APIs.

## Economia de recursos

- Uma única estrutura atual é mantida por projeto por `upsert`.
- Nenhuma consulta externa ocorre no carregamento da página; a geração é sempre explícita.
- O polling existe somente enquanto uma geração solicitada está em andamento.
- Referências e evidências são compactadas antes do Gemini e limitadas a 20 itens.
