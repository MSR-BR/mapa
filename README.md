# Mapa da Pesquisa

Plataforma web para apoiar o planejamento inicial de pesquisas científicas, TCCs, dissertações e teses.

## Estado

As Changes 001 e 001.1 estabelecem a fundação técnica em Next.js, pronta para deployment futuro na Vercel e integração com Supabase. Autenticação, projetos, geração, edição e exportação pertencem às próximas changes aprovadas.

## Requisitos

- Node.js 22.13 ou superior.
- npm compatível com o lockfile versionado.

## Desenvolvimento

```bash
npm ci
npm run dev
```

A aplicação fica em `http://localhost:3000` e o health check em `http://localhost:3000/api/health`.

O deployment público será realizado somente na Change 006.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run check` para executar o gate completo.

## Especificações

O planejamento, os padrões compartilhados e as changes ficam em `.specs/`. Nenhuma change deve ser implementada sem aprovação explícita.
