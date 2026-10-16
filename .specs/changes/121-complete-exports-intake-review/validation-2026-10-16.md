# C121 — Validação — 16/10/2026

## Resultado local

- 241 testes aprovados: 190 gerais, 13 DOI e 38 IA. Os novos testes cobrem 400/401 caracteres, respostas legadas de até 2.000, preservação literal e reformulação sem fatos novos, invalidação do cache e seções compartilhadas.
- `npm run test:exports`: rotas reais com serviços sintéticos. Preparação única, salvamento da edição, downloads PDF/DOCX sem nova IA, cabeçalhos privados, validação de limite, falha segura do provedor, conflito concorrente, autorização, estado, aprovação/rascunho e modo Rápido aprovados.
- `npm run test:methodology`: regressões C117/C119 aprovadas.
- Tipos, lint, auditoria de segurança, grants explícitos e `git diff --check` aprovados. Lint mantém um aviso preexistente de variável sem uso em `tests/foundation.test.mjs`; zero erros. Segurança: PASS_WITH_ACCEPTED_RISK, com limitações já registradas de rate limiting distribuído/antivírus/checagens remotas. Dependências de produção: zero vulnerabilidades; nenhuma dependência adicionada. O audit completo mantém cinco alertas high dev-only na cadeia braces/micromatch/ESLint, já aceitos nas C118/C119. O ajuste automático sugerido rebaixaria eslint-config-next e fica fora desta change; risco residual preexistente mantido pelo responsável do projeto.
- Build local Webpack aprovado. O build padrão Turbopack local encontrou restrição de listener/EPERM e acesso à fonte externa; sem alteração de configuração para contornar a sandbox. O build remoto padrão será verificado na publicação.

## Conteúdo e renderização dos relatórios

O corpo acadêmico de cada PDF anterior, antes do apêndice, foi comparado após normalizar espaços e rodapés: idêntico nos três cenários. Todos os blocos do conteúdo compartilhado foram encontrados tanto no texto do PDF quanto no XML do Word.

| Cenário sintético | Blocos presentes nos dois formatos | Páginas PDF |
|---|---:|---:|
| Avançado | 108/108 | 13 |
| Avançado rascunho | 120/120 | 14 |
| Rápido | 79/79 | 9 |

O Word Avançado foi renderizado no LibreOffice: 13 páginas. PDF e Word foram inspecionados visualmente em todas as páginas; capa, capítulos, referências, apêndice e rodapé preservados. Rótulos do apêndice no PDF permanecem junto do conteúdo. Cada original legado de 1.800 caracteres e suas quebras permanece integral; a reformulação é separada e limitada a 400. Não se exige paginação idêntica em outros editores.

Evidências: [paridade](evidence/parity.json), [apêndice PDF](evidence/pdf-appendix.png), [apêndice Word](evidence/word-appendix.png).

## Interface real com fixture sintética

- Cinco campos com `maxLength=400`, contador e validação. Digitação nativa não ultrapassa 400; preenchimento programático de 401 é rejeitado pela validação, sem corte silencioso de legado.
- Otimizar literatura ausente; referências e regeneração individual presentes.
- Literatura, desenvolvimento e metodologia Aluno: “Enviar para validação do orientador”; autônomo: “Próximo”. Regras de aprovação preservadas.
- Primeiro clique prepara o comparativo e pede revisão, sem baixar arquivo automaticamente. Edição manual da reformulação seguida de Exportar Word salvou a edição, preservou o original e retornou o arquivo pela rota real. Uma chamada de IA simulada, duas gravações (preparação e edição), sem nova IA para o segundo formato.
- Desktop e celular de 390 px: caixas e textos cabem no viewport. Override do navegador removido após o teste.
- A espera da ferramenta de navegador pelo evento de download travou e foi interrompida. Retomada sem esse mecanismo; entrega binária comprovada pelas rotas reais e retorno da interface ao estado disponível, sem erro. Não foi uma falha demonstrada do aplicativo.

Evidências: [desktop](evidence/comparativo-desktop.png), [celular](evidence/comparativo-mobile.png), [estado sintético](evidence/local-ui.json).

## Limites

Sem nova chamada paga a Gemini/GPT, alteração de conteúdo privado, chave, modelo, banco, Ads ou TERMO. A qualidade semântica de uma resposta futura depende da revisão do autor; a implementação valida formato e tamanho, mantém original e permite edição. Exportações antigas em disco não mudam: baixar novamente para obter o Word completo e o comparativo.
