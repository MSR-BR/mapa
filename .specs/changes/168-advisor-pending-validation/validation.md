# Validação C168 — 01/11/2026

- 3 testes novos: limites exatos de 72h/120h, resolução/reenvio, fuso, data inválida/futura.
- Suíte npm test: 285 testes unitários aprovados (218 + 13 + 50 + 4), além dos verificadores sintéticos de rotas Data API, sugestões e lembretes.
- npm run lint: aprovado, um aviso preexistente em tests/foundation.test.mjs.
- npm run typecheck e grants explícitos: aprovados.
- npm run exports:verify: aprovado; 553 campos compartilhados Word/PDF.
- scripts/verify-c168-ui.mjs: componente real com dados sintéticos, dependências de ação/perfil isoladas e rede interceptada. 1280, 390 e 320px; três cores corretas; caixa ausente sem pendência e em card próprio; nomes preservados; sem overflow ou erros de navegador. Capturas desktop e 320px inspecionadas visualmente.
- Revisão React: cálculo no servidor e props serializáveis, sem novos hooks/requisições; uso de cor acompanhado de texto. Exceção localizada de react-hooks/purity documenta o relógio de requisição do componente assíncrono de servidor.
- Auditoria estática: PASS_WITH_ACCEPTED_RISK, ressalvas preexistentes.
- npm run check alcançou build após aprovar etapas anteriores; ocorreu lock porque build avulso estava em execução. Resultado do build avulso será registrado abaixo.

Limites: teste local sintético; não valida login/produção, não usa projetos privados ou gerações pagas. Indicador recalculado ao carregar o dashboard, sem atualização por timer em aba mantida aberta.

Build padrão bloqueado no ambiente: primeira tentativa sem acesso às fontes; segunda com rede autorizada falhou no processo CSS do Turbopack ao tentar abrir porta interna (Operation not permitted). Em verificação alternativa com `next build --webpack`, flag documentada na versão instalada. Nenhuma configuração do bundler alterada.

Resultado final: `npm run build -- --webpack` aprovado (compilação, TypeScript e geração de páginas, saída 0). Build Turbopack permanece não validado neste ambiente. `git diff --check` aprovado.
