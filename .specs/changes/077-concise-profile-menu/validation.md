# Validação

- Busca estática dos textos removidos no componente.
- Testes negativos que impeçam a reintrodução das duas mensagens.
- `npm run check`.
- `npm audit --audit-level=moderate` e `npm run security:audit`.
- Deploy Production, HTTP 200, `/api/health` e logs.
- `git diff --check` e repositório final limpo e sincronizado.
