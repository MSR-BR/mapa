# Mapa da Pesquisa

O Mapa da Pesquisa começa com cinco perguntas para formular a situação-problema e uma escolha de produto acadêmico: TCC, monografia, dissertação, tese, artigo de evento ou artigo de periódico. A seleção orienta o aprofundamento da IA, enquanto o Research Starter fornece referências verificáveis para revisão do estudante e do orientador.

Plataforma web para apoiar o planejamento inicial de pesquisas científicas, TCCs, dissertações e teses.

## Estado

As Changes 001 a 006 estão concluídas. O MVP possui autenticação, projetos e briefing no Supabase, geração acadêmica com Research Starter + Gemini, editor persistente, exportações DOCX/PDF e deployment validado na Vercel.

Produção: <https://mapadapesquisa.com.br>

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

As exportações são geradas sob demanda no backend e não consomem Supabase Storage.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run check` para executar o gate completo.

### Verificação aluno/orientador

O fluxo completo com duas contas reais do Supabase pode ser verificado com:

```bash
npm run supabase:verify-advisor-student
```

Antes de rodar, configure `MAPA_E2E_STUDENT_EMAIL`, `MAPA_E2E_ADVISOR_EMAIL` e `MAPA_E2E_PASSWORD`
com contas de teste controladas. Por padrão, o script apenas autentica contas existentes; para criar contas
explicitamente fornecidas, defina `MAPA_E2E_CREATE_USERS=true`.

## Especificações

O planejamento, os padrões compartilhados e as changes ficam em `.specs/`. Nenhuma change deve ser implementada sem aprovação explícita.
