# Change 112 — Gemini e GPT colaborativos, recuperação e progresso real

Status: **concluída e publicada em 06/10/2026 — v06102026.4, teto adicional de US$5/mês**.

## Objetivo e autorização

Adicionar OpenAI/GPT ao Mapa como provedor complementar ao Gemini: recuperação de falhas elegíveis, revisão de conteúdos importantes e análise do impacto de alterações anteriores. A caixa azul deve mostrar qual IA está efetivamente trabalhando e em qual função.

O responsável pediu a criação desta Change, incluindo identificação de GPT/Gemini na caixa azul. Depois da especificação, autorizou executar a próxima Change e forneceu a chave OpenAI. Autorizou depois o teto de US$5/mês. Avaliação real, migration, configuração e rollout foram concluídos; evidências em cpd-2026-10-06.md.

## Base verificada antes da implementação

- `modules/generation/gemini.ts` centraliza a geração atual com `ai`, `@ai-sdk/google`, schemas e validações de referências; as rotas chamam funções vinculadas ao Gemini.
- C101 já mede operações Gemini com dados sanitizados; essa observabilidade deve ser preservada e ampliada aos dois provedores.
- Parte das mensagens de progresso é fixa no frontend. Identificar corretamente o provedor exige eventos da execução no servidor, inclusive após fallback.
- O registro da infraestrutura de 05/10 confirma a organização OpenAI central existente, com previsão de projeto e chave exclusivos por aplicativo; não confirma uma chave do Mapa nem acesso funcional a um modelo específico.

## Política inicial de colaboração

| Situação | Comportamento |
|---|---|
| Geração comum | Manter Gemini como provedor inicial, sujeito à avaliação por operação. |
| Mudança confirmada em parte anterior | GPT pode revisar impacto e propor ajustes locais quando o autor solicitar atualização. |
| Metodologia e revisão final | Revisão complementar por outro provedor, em pontos configurados e limitados. |
| Falha técnica elegível | Tentar o provedor alternativo dentro do limite global de tentativas, tempo e custo. |
| Divergência acadêmica | Expor achados e sugestões fundamentadas; preservar decisão humana e conteúdo vigente. |
| Navegar ou salvar | Nenhuma chamada a modelo. |

Ambos recebem o mesmo contexto versionado e evidências pertinentes, conforme C111. Respostas são propostas; a segunda IA não concede aprovação do Orientador nem garante verdade científica. Não criar debate infinito nem duplicar toda chamada.

## Caixa azul

Exemplos: **“Gerando sugestões com Gemini…”**, **“Revisando a coerência com GPT…”**, **“Continuando com GPT…”** e **“Salvando suas alterações…”**. O rótulo é derivado do provedor/fase efetivos no servidor, sem temporizador fingindo etapas. Research Starter e verificações locais mantêm identificação própria. Conclusão só aparece após a persistência correspondente.

## Dependências e sequência

Implementar após C111 estabilizar versões, propostas, aceite e contexto. Evolui C101 e a integração C072, preservando C068/C089/C106. Seleção exata de modelos, credenciais e limites financeiros deve ocorrer na execução com avaliações e autorização aplicáveis; criar esta spec não autoriza consumo.

## Fora de escopo

Migração obrigatória do Gemini para OpenAI, treinamento/fine-tuning, memória compartilhada entre usuários, troca automática para modelos mais caros, alterações no Research Starter, TERMO, Ads, faturamento ou planos de serviços.

## Documentos de execução

[Requisitos](requirements.md), [aceite](acceptance-criteria.md), [tarefas](tasks.md), [superfícies](files-to-create-or-modify.md), [validação](validation.md), [checklist](checklist.md), [decisões](notes.md), [rota de execução](model-route.md).
