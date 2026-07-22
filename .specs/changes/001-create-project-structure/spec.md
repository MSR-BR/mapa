# Change 001 — Criar estrutura do projeto

## Objetivo

Inicializar a base técnica executável, os padrões de qualidade e as fronteiras modulares, sem implementar funcionalidades de negócio.

## Requisitos

- Confirmar stack e decisões pendentes.
- Inicializar Next.js/TypeScript e gerenciador de pacotes.
- Configurar lint, formatação, typecheck e testes.
- Criar somente pastas necessárias e contratos mínimos entre módulos.
- Adicionar exemplo de ambiente sem segredos.
- Criar página inicial temporária e health check.
- Registrar instruções locais.

## Critérios de aceite

- Instalação reproduzível a partir do lockfile.
- Aplicação inicia localmente sem credenciais de produção.
- Build, lint, typecheck e teste smoke passam.
- Nenhuma feature do MVP ou integração externa está implementada.
- Estrutura respeita a arquitetura compartilhada.

## Arquivos a modificar

- Manifesto e lockfile do projeto.
- Configurações de TypeScript, framework, lint, testes e ambiente.
- `app/`, `modules/`, `lib/`, `tests/` e documentação inicial, conforme necessário.
- `.gitignore` e `.env.example`.

## Testes a executar

- Instalação limpa.
- Lint e typecheck.
- Teste unitário/smoke inicial.
- Build de produção.
- Inicialização e health check local.

## Checklist de conclusão

- [x] Stack aprovada.
- [x] Mudança explicitamente autorizada.
- [x] Estrutura mínima criada.
- [x] Ferramentas de qualidade configuradas.
- [x] Testes executados e registrados (`npm run check`, 2026-07-21).
- [x] Documentação atualizada.
- [x] Nenhum segredo ou feature fora de escopo incluído.

## Gate

**Não implementar até receber aprovação explícita do usuário.**
