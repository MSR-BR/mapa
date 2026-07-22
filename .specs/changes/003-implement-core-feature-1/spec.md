# Change 003 — Projetos e briefing

Status: concluída em 22/07/2026.

## Objetivo

Permitir que o usuário gerencie projetos e forneça os dados necessários à futura geração.

## Requisitos

- Listar, criar, abrir, editar, excluir e duplicar projetos.
- Capturar tema opcional, situação-problema, palavras-chave, área e nível.
- Validar no cliente e servidor, com limites documentados.
- Salvar rascunhos e proteger contra perda de alterações.
- Exibir estados vazio, carregando, erro e sucesso.
- Permanecer compatível exclusivamente com o Supabase Free, sem Storage, Realtime, Edge Functions ou consultas adicionais.

## Limites aprovados

| Campo | Regra |
| --- | --- |
| Título | obrigatório; até 160 caracteres |
| Tema | opcional; até 500 caracteres |
| Situação-problema | opcional; até 5.000 caracteres |
| Palavras-chave | até 12 itens únicos; até 60 caracteres por item |
| Área do conhecimento | opcional; até 120 caracteres |
| Nível acadêmico | opcional; graduação, especialização, mestrado, doutorado ou outro |

## Critérios de aceite

- Operações persistem e respeitam o proprietário.
- Duplicação cria novo id e título distinguível, sem compartilhar estado mutável.
- Exclusão exige confirmação e segue a política de exclusão lógica.
- Formulário informa erros por campo e preserva entradas válidas.
- Projeto salvo reaparece corretamente após nova sessão.

## Arquivos a modificar

- Rotas do painel e projetos.
- Módulos `projects` e `research-brief`.
- Componentes de formulário e lista.
- Schema/migração somente se necessário.
- Testes e documentação.

## Testes a executar

- Regras e limites do briefing.
- Integração CRUD e autorização negativa.
- Formulário, preservação de dados e proteção contra perda.
- Fluxo E2E das operações.
- Acessibilidade, responsividade e build.

## Checklist de conclusão

- [x] Campos e limites aprovados e documentados.
- [x] CRUD e duplicação implementados.
- [x] Validação dupla implementada.
- [x] Proteção inicial contra perda de alterações implementada.
- [x] Autorização negativa preservada e coberta pela evidência autenticada vigente.
- [x] Fluxos CRUD cobertos por ações, testes e persistência autenticada.
- [x] Responsividade e acessibilidade verificadas.
- [x] Testes, documentação e evidências finais atualizados.
