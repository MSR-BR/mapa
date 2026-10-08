# C113 — Auditoria de parâmetros Gemini — 07/10/2026

**Status:** auditoria e correção do smoke concluídas, versionadas em `ce97e4d` no CPD de 08/10. Runtime e modelos preservados; vínculo com o aviso não confirmado. [Fechamento](../114-landing-card-regeneration/cpd-2026-10-08.md).

O pedido posterior **“cpd limpo”** autoriza incorporar esta auditoria/script e seus testes ao fechamento da C114. O runtime Gemini permanece inalterado; o vínculo com o aviso continua não confirmado. Não autoriza smoke pago nem troca de modelo/chave.

## Autoridade e escopo

Pedido explícito do responsável em 07/10: investigar o aviso recebido por
`marioreis@id.uff.br`, corrigir somente código afetado, testar corpos de requisição
e erros simulados, e deixar o diff para revisão. Este pedido aprova este escopo;
não autoriza chamadas pagas, deploy, troca de modelo, ambiente, chave ou compra.

## Implementação mínima

- Preservar o gerador da aplicação: `gemini-3.6-flash`, `generateContent`,
  `thinkingLevel: "minimal"`, schemas, limites e política de fallback.
- Corrigir o smoke `scripts/verify-gemini.mjs`: omitir temperatura nos modelos
  atuais e aplicar `minimal` somente ao modelo 3.6 já validado. Outros modelos
  usam seu raciocínio padrão; isso não os habilita na aplicação.
- Preservar `temperature: 0` se o smoke for explicitamente configurado para
  Gemini 2.5; removê-la alteraria a amostragem. Não introduzir um thinking budget
  nem desativar seu raciocínio dinâmico. Nenhum uso atual de 2.5 foi encontrado.
- Cobrir JSON efetivamente serializado pelo SDK, grafias camelCase/snake_case,
  erro HTTP 400 sem retry/fallback e erros transitórios com fallback limitado.
- Registrar metadados de conta/publicação e limites de comprovação.

## Aceite local

- Testes offline com credenciais sintéticas e transporte inteiramente simulado.
- Lint, typecheck, testes e build locais; nenhuma execução real de `gemini:verify`.
- Nenhuma alteração de dependências, modelo, chave, configuração externa ou API.
- Diff não publicado, pronto para revisão; lacunas de vínculo explicitadas.

Resultados: 201 testes, typecheck e lint sem erros. Build isolado Webpack
aprovado; Turbopack limitado por restrição de abertura de porta do ambiente.
Detalhes e duas advertências preexistentes de lint na auditoria anexa.
