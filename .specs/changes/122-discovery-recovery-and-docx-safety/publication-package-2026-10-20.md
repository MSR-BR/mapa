# C122 — pacote de publicação para revisão

Preparado em 20/10/2026 após o commit local. **Nenhuma publicação foi executada.**

```text
PUBLICATION_STATE: APPROVAL_PENDING
RELEASE_GATE: BLOCKED
REVIEW_CANDIDATE: 7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c
BRANCH: codex/change-003-004
BASE_COMMIT: f096d9f027e1bbe3fc62fe4fcecf87c76cb1d6de
PROPOSED_DESTINATION: Produção — projeto Vercel mapadapesquisa — https://mapadapesquisa.com.br
PROPOSED_VERSION: v20102026.1 (não aplicada)
APPROVED_REVISION: nenhuma
APPROVED_DESTINATION: nenhuma para este candidato
APPROVAL_EVIDENCE: placeholder não preenchido na Ordem 1
PUBLICATION_EVIDENCE: nenhuma
```

## Resultado local

Commit **`7fbd8e4`**, `fix(c122): recover expired discovery claims and sanitize Word exports`, somente local, um commit à frente do tracking remoto observado. Quinze arquivos: nove de implementação/testes e seis documentais. Nenhuma dependência, migration ou lógica adicional das Ordens 2–5 foi incorporada.

- Reserva expirada de descoberta pode ser retomada, mantendo controle de concorrência.
- Falhas da descoberta ganham classificação mais precisa; escolha de proposta não redispara visualização apenas pela substituição do objeto.
- Controles inválidos abaixo de U+0020 são removidos da cópia exportada em DOCX; original armazenado e PDF preservados.

Veja [revisão e validação Codex](review-codex-2026-10-20.md) e [spec](spec.md). O commit foi criado sem hooks, para evitar ações externas automáticas; as verificações executadas estão explicitamente registradas. Não houve push nem tag de release.

Os diretórios `.specs/audits/` e `.specs/handoffs/` anteriores permanecem locais, preservados e fora do commit. Este pacote também é posterior ao commit e não faz parte do candidato. A árvore não foi declarada limpa; não apagar esses materiais para obter uma aparência de limpeza.

## Validação do candidato

247 testes aprovados; `test:research-starter`, `test:cards`, `test:limits`, `test:methodology`, `test:exports`, auditoria estática, grants estáticos e exportações aprovados. Reprodução independente confirmou HEAD=409 e C122=200 para reserva expirada, além de proteção de reserva recente/concorrência e erro de gravação classificado como `saving`.

`npm run check` não ficou integralmente verde: o build padrão Turbopack falhou por restrição de porta do sandbox, inclusive na tentativa com escalonamento. `npm run build -- --webpack` passou; o script padrão não foi modificado.

`security:gate` não passou integralmente. Após falha inicial de DNS, a consulta npm isolada confirmou cinco alertas high dev-only preexistentes da cadeia ESLint; `--omit=dev` retornou zero. Não foram feitos upgrades/downgrades nem `audit fix`.

## Bloqueios antes de publicar

1. **Confirmar o build efetivo de release.** A aprovação anterior do Claude para Turbopack é histórica; a revisão Codex aprovou Webpack, não conseguiu completar Turbopack neste ambiente.
2. **Resolver a pendência de autorização SEC-03.** Achado alto de possibilidade de forjar avanço/revisões do Aluno, estático e ainda não reproduzido em PostgreSQL local nesta rodada. A Ordem 4 deve provar o comportamento; não há aceite novo desse risco. C122 não é sua correção.
3. **Definir o identificador público da versão.** O código mantém fallback `v16102026.2`, e `NEXT_PUBLIC_APP_VERSION` tem precedência. A Ordem 1 proíbe alterar ambiente. `v20102026.1` é apenas proposta: obter decisão específica sobre o mecanismo de versão; se houver mudança de fonte, novo commit e nova autorização serão necessários. Não publicar com identificação enganosa.
4. **Autorizar candidato exato e destino.** A frase no arquivo de ordens não está preenchida. Mesmo após a autorização humana, os bloqueios técnicos precisam estar resolvidos; este pacote não é uma recomendação de publicar imediatamente.

## Procedimento futuro proposto — não executado

Após resolver os bloqueios, gerar o artefato a partir do commit aprovado, sem arquivos não versionados, `.env` local ou outras Changes. Fazer push apenas do escopo autorizado. Não promover um deployment preexistente que não corresponda ao candidato.

Preparar deployment identificado na Vercel, verificar `releaseCommit`/revisão imutável, versão pública, domínio e ausência de migration. Promover o mesmo artefato validado, sem recompilar com fonte diferente. Se qualquer ajuste mudar o candidato, reapresentar SHA e diff antes da publicação.

## Smokes propostos

| Verificação | Aceite e limite |
|---|---|
| Health | HTTP200, status saudável e versão aprovada; não comprova funcionamento da IA. |
| Landing e `/mapa` | CTA abre a entrada correta; Rápido/Avançado preservados; desktop/celular; sem clicar em anúncio. |
| Autorização | Exportação anônima negada e mutação cross-site negada; não enfraquecer controles para testar. |
| Descoberta sintética | Harness local já aprovado, sem serviço real. Uma tentativa autenticada real pode gerar custo e escrever dados: exige autorização específica, não incluída neste pacote. Não semear estado expirado no Supabase remoto. |
| Exportação Word | Gerar fixture sintética com controles, validar XML e abrir em editor local; os testes binários passaram, abertura real no Word não foi feita nesta rodada. Não exigir geração paga do comparativo para o smoke. |
| Logs | Consultar somente diagnóstico sanitizado do deployment exato, dentro da retenção; nenhum conteúdo de pesquisa, token ou chave. Ausência de erro na janela não prova ausência de falhas históricas. |

## Rollback

Destino anterior documentado: **`dpl_J4ZA34BQ1JQeBqatrrJu7PJzFcfY`**, C121, `v16102026.2`, revisão funcional `ac44539588a72f73bbe16311a1ebd9884d3d91da`. Reconfirmar identidade/disponibilidade antes de publicar; nesta rodada não houve nova consulta ao painel Vercel.

Se necessário e autorizado no release, promover esse deployment anterior. Sem migration a desfazer. Preservar dados criados durante o período e registrar que o código antigo volta a não recuperar automaticamente claims expirados. Eventual configuração pública de versão deve ser coerente com o artefato promovido; não alterar segredos.

## Recursos preservados e fechamento

Ads permanece encerrado, sem alterações de CPC/orçamento/palavras/conversões; GA4 administrativo, TERMO, Supabase remoto, ambiente, chaves e automações não foram alterados. Nenhuma chamada paga.

**Ordem 1 encerrada no limite autorizado: revisão, validação com limitações, commit local e pacote. Não há CPD nem produção nova.** Ordens 2–5 aguardam sua vez. O próximo agente deve começar por este pacote e pelo estado Git real, sem interpretar o placeholder de autorização como aprovação.
