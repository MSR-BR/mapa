# Mapa da Pesquisa

Plataforma web para apoiar o planejamento inicial de pesquisas científicas, TCCs, dissertações e teses.

## Estado

As Changes 001 a 005 estão concluídas. O MVP já possui autenticação, projetos e briefing no Supabase, geração acadêmica com Research Starter + Gemini, editor persistente e deployment validado na Vercel. A Change 006 permanece para exportação DOCX/PDF e fechamento operacional do piloto.

Produção: <https://mapa-gray-two.vercel.app>

## Requisitos

- Node.js 22.13 ou superior.
- npm compatível com o lockfile versionado.

## Desenvolvimento

```bash
npm ci
npm run dev
```

A aplicação fica em `http://localhost:3000` e o health check em `http://localhost:3000/api/health`.

As chaves do Gemini e do Research Starter são usadas somente no backend. Nunca prefixe esses segredos com `NEXT_PUBLIC_`.

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
