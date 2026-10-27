# C152 — Contrato de métricas de ativação e avanço

**Decisão que este contrato apoia:** escolher iniciativas de divulgação que tragam pessoas capazes de iniciar um projeto e avançar, sem otimizar apenas cliques ou eventos repetidos. **Revisão sugerida:** semanal, com coortes maturadas. Nenhuma meta numérica nova é fixada com a amostra atual.

## Indicadores prioritários

| Indicador | População e unidade | Numerador / denominador | Janela e fonte | Estado e cuidado |
|---|---|---|---|---|
| **Ativação observada de novos visitantes** | Pessoas identificadas pelo GA4 com `first_visit` no período, após excluir origens etiquetadas de QA/equipe; `first_visit` depende de consentimento | Pessoas que tiveram, nessa ordem, `first_visit` → `login_success` → `project_start` dentro da janela / pessoas com `first_visit` na mesma janela | GA4 `runFunnelReport`, dias completos no fuso `America/Rio_Branco`; mostrar também os passos 1→2 e 2→3 | **Disponível como proxy:** 45/225 = 20,0% em 06–26/10. Não representa todos os visitantes, pode incluir interno direto e não tem prazo fixo de acompanhamento. Não comparar períodos sem maturação equivalente. |
| **Primeiro avanço por projeto em 7 dias** | Projetos distintos criados por pessoas elegíveis na coorte de criação; unidade é projeto, não pessoa ou evento | Projetos distintos com ao menos uma etapa efetivamente concluída após a criação e até 7×24 h depois / projetos distintos criados na mesma coorte | Agregado operacional restrito do desenvolvimento; coorte em data de criação no fuso `America/Rio_Branco`; só incluir dias cuja janela de 7 dias já fechou | **Indisponível.** Não substituir por `stage_completed` / `project_start` do GA4. |
| **Avanço ou conclusão por projeto em 30 dias** | Mesma coorte de projetos distintos, maturada por 30 dias | Projetos distintos com ao menos uma etapa concluída (ou conclusão final, em coluna separada) até 30×24 h / projetos distintos criados na mesma coorte | Mesmo agregado operacional, janela fechada de 30 dias | **Indisponível.** Manter primeiro avanço e conclusão final separados. |

**Drivers para diagnóstico:** participação que alcança `login_success` depois de `first_visit` e participação que alcança `project_start` depois do login; ambos têm numerador e denominador de pessoas da mesma sequência. Mostrar contagens por origem só quando o tamanho amostral permitir; não somar pessoas entre origens. Papel e modo são dimensões de **eventos de início**, não coortes elegíveis, enquanto não houver denominadores compatíveis.

**Guardrails:** monitorar contagem de pessoas com `generation_failed`, `export_pdf_failed` e bloqueios classificados, além de atraso de atribuição e proporção desconhecida de visitas sem consentimento. Não chamar `stage_blocked` de falha sem classificar o motivo. Não usar taxa de falha por tentativa até haver identificador operacional de tentativa e denominador deduplicado; manter contagens observadas. Para mídia paga, Ads é a fonte de custo e conversões atribuídas; só vincular um resultado do GA4 ao piloto quando o ID da campanha estiver presente e a reconciliação for consistente.

## Especificação de agregado para o projeto de desenvolvimento

Solicitar **apenas uma tabela agregada**, sem ID de projeto, usuário, e-mail, texto de mapa, prompt, token ou linha individual. Esta é uma especificação para encaminhamento; nenhuma consulta a dados do aplicativo foi feita nesta Change.

1. **Grão de saída:** semana de criação do projeto no fuso `America/Rio_Branco`; se houver volume suficiente, acrescentar canal de aquisição somente quando sua atribuição for confiável e não expuser grupos pequenos. Não desdobrar por pessoa nem fornecer exemplos de projetos.
2. **População:** contar projetos distintos confirmados no banco, usando o instante de criação. Informar, em colunas agregadas, total, excluídos por regra de teste/equipe, elegíveis e projetos de origem desconhecida. Documentar a regra de exclusão; se não houver regra segura, rotular a série como “todos os projetos, internos desconhecidos” e não chamá-la externa.
3. **Primeiro avanço:** para cada projeto da coorte, marcar se houve a primeira conclusão persistida de etapa **após a criação** e até 7×24 h; contar o projeto uma vez. Repetir para 30×24 h. Publicar também a contagem de projetos sem avanço apenas para coortes com a janela inteira observável.
4. **Conclusão final e exportação:** em colunas separadas, projetos distintos com conclusão final persistida e com primeira exportação PDF bem-sucedida até 7 e 30 dias; não inferir conclusão pela exportação, nem somar esses grupos como se fossem disjuntos.
5. **Maturação:** fornecer `cohort_start`, `cohort_end`, `as_of`, fuso, número de projetos cujo prazo de 7 dias fechou e número cujo prazo de 30 dias fechou. Coortes recentes ficam “a maturar”, fora dos denominadores respectivos. Aplicar o mesmo corte aos numeradores.
6. **Privacidade e qualidade:** suprimir ou juntar grupos muito pequenos conforme regra do projeto; não enviar dados pessoais ao relatório. Informar se exclusões, timestamps, projetos duplicados/migrados e conclusão de etapa foram auditados. Se o banco não registrar algum marco de forma inequívoca, marcar a coluna como indisponível em vez de estimar.

**Reconciliação:** comparar o agregado operacional e o GA4 apenas após alinhar período, fuso, população elegível, definição de “criado” e consentimento. O agregado poderá incluir projetos de pessoas sem consentimento; o GA4 não. Diferenças não são automaticamente perda de dados ou erro. Uma coluna agregada de consentimento na criação só deve ser fornecida **se já existir de forma legítima**; não criar nova coleta nesta Change.

## Regras permanentes de leitura

- GA4: propriedade `550650234`, fuso `America/Rio_Branco`, BRL; excluir `codex_validation / qa` e `mapa_team / internal`. Direct pode incluir equipe sem etiqueta. Usuários de dias ou origens diferentes não são aditivos.
- Search Console: `sc-domain:mapadapesquisa.com.br`, busca Web, dias finais no calendário do Pacífico; consultas e páginas não substituem visitas ou pessoas.
- Ads: conta `383-835-9068`, fuso `America/Sao_Paulo`, EUR; campanha `24325133699`, conversão pretendida `7825220596`. Não igualar clique a sessão ou evento a conversão atribuída.
- Toda tabela publicada deve registrar fonte, consulta/data e hora, período, fuso, filtros, unidade, tamanho da amostra e dados parciais separados. Evitar porcentagens quando não houver denominador da mesma população e janela.
