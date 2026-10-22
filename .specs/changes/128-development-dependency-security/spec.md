# C128 — Remoção da cadeia vulnerável de desenvolvimento

Implementada e validada localmente em 22/10/2026. NEEDS_REVIEW.
PUBLICATION_STATE: NOT_REQUESTED. Sem commit/push/deploy, serviços remotos, chaves,
chamadas pagas ou envio de e-mail. Preserva C123–C127 sem commit.

## Correção

Os cinco avisos da C127 propagavam uma única vulnerabilidade:
Next lint → fast-glob → micromatch → braces <=3.0.3.
A consulta pública confirmou Next lint 16.4.2 e braces 3.0.3 ainda como versões
atuais, sem patch publicado para este aviso. Não aplicamos downgrade, supressão
de audit ou aceitação adicional de risco.

Removida a cadeia com um adaptador local e privado, exclusivamente de
desenvolvimento, baseado em glob 13.0.6. O override se restringe ao plugin
16.4.2. Next e eslint-config-next permanecem 16.4.2, e todas as regras Next/React
continuam ativas. Nenhuma outra versão de pacote existente foi alterada; o delta
reproduzível está em evidence/dependency-delta.json. A chave npm fast-glob resolve
para @mapa/next-root-glob (nome verdadeiro, conteúdo novo, nenhuma cópia de braces).

Não é substituto geral de fast-glob. Mudança futura do plugin exige rever o
contrato; há teste de versão e recusa explícita de opções desconhecidas. A pasta
tools/next-root-glob precisa integrar qualquer pacote de publicação futuro.
Padrões profundamente aninhados são rejeitados antes do parser.

## Verificações

| Verificação | Resultado |
|---|---|
| npm audit completo | 0 vulnerabilidades; antes 5 altas |
| npm audit --omit=dev | 0 vulnerabilidades |
| npm test | PASS: 265 testes anteriores + 4 novos; harnesses Data API/sugestões/lembretes PASS |
| Compatibilidade | 8 padrões comparados com fast-glob anterior; relativos, arrays e configuração padrão adicionais PASS |
| Regra real do Next | Detecta link interno incorreto com rootDir glob; link externo válido aceito |
| Configuração hostil | Padrões profundos/longos e API desconhecida recusados |
| Instalação limpa | npm ci --ignore-scripts em /tmp, sem .env; quatro testes PASS usando dependências dessa instalação |
| Lint/tipos | PASS; somente warning preexistente foundation.test.mjs:887 |
| security:gate | PASS local; inclui auditoria estática, grants estáticos, npm audit e whitespace |
| Security fast check | PASS; sem leitura de valores de chaves |

O gate não executa migrations remotas nem substitui revisão para publicação.
Não houve mudança de runtime do app; build/browser/SQL da C127 não foram
repetidos porque esta Change é restrita à ferramenta de lint. Não declarar
build novo nem aprovação de produção. As demais pendências operacionais e
UX-06 continuam fora deste escopo.

## Diagnóstico e limites

A tentativa inicial de alias direto para tinyglobby falhou nos testes de caminhos
e links simbólicos e foi descartada. O adaptador final usa glob e passou os
mesmos casos. O npm precisou do devDependency local direto com override por
referência para resolver corretamente; instalação limpa comprovou o resultado.
Uma correção no normalizador preservou caminhos relativos. O CommonJS exigido
pelo consumidor tem exceção documentada apenas para no-require-imports.

A C127 e o pacote de revisão anterior ficam preservados como evidências históricas;
seus hashes descrevem candidatos anteriores. Esta Change supera somente o risco
residual de dependências dev, sem reescrever os resultados passados. Para desfazer,
reverter o diff incremental desta Change restaura os alertas conhecidos; não é
recomendação de rollback para produção.

## Método e fontes

Pó Mágico v20261020.002, core/APP/security reutilizados desta sessão;
checkpoints resume/change/delivery. Modelo Codex/GPT-6, variante não exposta;
sem subagentes. Skills de segurança e Pó Mágico já aplicadas na sessão; nenhum
arquivo do arquivo metodológico alterado. Escopo S3, auditoria restrita a tooling.

- [Advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [API glob](https://github.com/isaacs/node-glob)
- Guia local Next 16.4.2: node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md.
