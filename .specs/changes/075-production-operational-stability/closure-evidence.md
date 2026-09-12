# Evidências de encerramento — Change 075

## Execução

- Modelo: gpt-5.6-sol com raciocínio xhigh.
- Fluxo: Pó Mágico, com especificação, gates, evidência, aprendizado e CPD.
- Escopo de dados: nenhuma migration, alteração de RLS, perfil ou dado acadêmico.

## Credencial e ambientes

- `RESEARCH_STARTER_MAPA_API_KEY` é o único nome lido pelo código ativo.
- A entrada local legada foi removida sem imprimir ou copiar seu valor.
- Duas entradas legadas foram removidas da Vercel por ID e a entrada canônica de
  Preview também foi removida.
- O inventário final mantém uma única credencial canônica, do tipo Secret e com
  alvo exclusivo Production.
- Nenhum segredo foi puxado, exibido, documentado ou versionado.

## Runtime, instalação e dependências

- Node.js foi fixado em `22.x`; o primeiro build da C75 confirmou a mudança
  efetiva de Node 24.x para Node 22.x.
- Os postinstalls de `esbuild` e `unrs-resolver` foram auditados e negados
  explicitamente; lint, testes e build funcionaram com essa política.
- O aviso transitivo `uuid@10` foi removido pela atualização compatível do
  Resend para 6.28.
- Next.js e `eslint-config-next` foram alinhados em 16.3.5; Tailwind em 4.3.3;
  PostCSS em 8.5.28; Sharp em 0.35.4.
- `npm audit --audit-level=moderate`: zero vulnerabilidades.

## Gates locais

- `npm run check`: aprovado.
- Lint e typecheck: aprovados.
- Testes: 90/90 aprovados.
- Exportação PDF: aprovada.
- Build Next.js 16.3.5 com Turbopack: aprovado.
- `npm run security:audit`: aprovado, com aviso apenas informativo sobre smokes
  remotos que foram executados separadamente.
- `git diff --check`: aprovado.

## Produção

- Deployment final: `dpl_A96gpBn81Z4Rfu5tqDxoRpYKACZi`.
- Artefato: `https://mapadapesquisa-okupy0d8z-msr-brs-projects.vercel.app`.
- Domínio: `https://mapadapesquisa.com.br`.
- Estado: READY, alvo Production.
- Build remoto: Next.js 16.3.5 em Node.js 22, concluído em 38 segundos.
- Domínio canônico: HTTP 200.
- `/api/health`: `status=ok`, quatro provedores configurados.
- Smoke autenticado do Research Starter: HTTP 200, três referências e relatório
  processado com resultado parcial válido.
- Logs de erro após os smokes: nenhum registro nos dez minutos inspecionados.

## Encerramento

Os critérios de aceite foram atendidos. Não há Change adicional planejada; uma
nova Change só será aberta por feedback real, incidente ou novo escopo aprovado.
