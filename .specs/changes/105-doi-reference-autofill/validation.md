# Validação — C105

## Evidências iniciais

- `npm run check` passou na primeira execução: lint, tipos, suíte existente,
  13 testes novos de DOI, PDF/DOCX e build com rota de consulta incluída.
- Crossref real: `10.1038/nphys1170` retornou “Measured measurement”, autor,
  revista, volume/ano/páginas e abstract vazio, corretamente preservado.
- DataCite real: `10.14454/qdd3-ps68` retornou documentação do schema v4.7,
  autores e ano 2026, sem inventar abstract ou revista.
- Gate inicial detectou Next.js 16.3.5 e brace-expansion vulneráveis; CPD não
  é considerado aprovado até aplicar patches e repetir as verificações.

## Execução reproduzível

- `npm run check`
- `npm run security:gate`
- `npm run test:doi`
- `scripts/verify-doi-ui.mjs`: requer Playwright com Chromium/WebKit; se instalado
  em cache externo, apontar `PLAYWRIGHT_MODULE` e `PLAYWRIGHT_ASSERT_MODULE` aos
  respectivos `index.mjs`. Usa o componente/CSS reais, respostas HTTP simuladas
  e nenhum dado remoto. Não equivale a E2E autenticado de produção.

## Gates locais finais

- `npm run check`: 141 testes existentes + 13 testes de DOI = **154/154**, lint,
  tipos, exports PDF/DOCX e build Next.js 16.3.8 aprovados.
- `npm run security:gate`: `PASS_WITH_ACCEPTED_RISK`; nenhuma vulnerabilidade
  no npm audit. Permanecem somente os riscos transversais já aceitos no perfil S3.
- Patches: Next.js/eslint-config-next 16.3.8; brace-expansion 1.1.21 e 5.0.12.
- Chromium e WebKit: **4/4 combinações** desktop 1280×900 / mobile 390×844
  passaram nos cenários de metadados parciais, edição durante consulta, falha com
  cadastro manual, salvar, duplicidade, resposta atrasada, Escape/foco e layout.
- O teste detectou foco inicial/final inconsistente do diálogo nativo; corrigido
  explicitamente e revalidado nos dois motores.
- Screenshots temporários em `tmp/c105-{Chromium,WebKit}-{390,1280}.png`, fora do Git.
- Teste de navegador usa componente e CSS reais com HTTP simulado; prova de
  provedores reais foi independente. Produção é registrada separadamente no CPD.

Resultado remoto, candidato exato e readback serão registrados no CPD da change.
