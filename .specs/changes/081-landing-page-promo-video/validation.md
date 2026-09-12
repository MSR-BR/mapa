# Validação

- `mdls` para codecs, duração, dimensões e tamanho do MP4 recebido.
- SHA-256 do arquivo original e da cópia pública.
- Inspeção visual de quadros em 0,5, 8, 18, 30, 45, 60 e 72 segundos.
- Verificação do poster escolhido em resolução original.
- Teste de regressão em `tests/foundation.test.mjs`.
- `npm run lint`.
- `npm run typecheck`.
- `npm run test`.
- `npm run build`.
- Smoke HTTP da rota e das mídias em servidor local.
- Revisão visual desktop e móvel.
- `git diff --check`.
