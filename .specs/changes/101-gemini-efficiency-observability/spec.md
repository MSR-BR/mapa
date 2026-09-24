# C101 — Eficiência, custo e observabilidade do Gemini

## Status

Concluída e publicada em produção em 24/09/2026.

## Contexto

O painel do Google AI Studio mostra um pico de uso do projeto `mapa`, com taxa de sucesso próxima de 100% e sem evidência visível de esgotamento de cota. Antes de trocar o plano ou reduzir a qualidade das respostas, o sistema precisa medir o consumo real de cada operação Gemini, sem registrar conteúdo acadêmico, dados pessoais ou segredos.

## Objetivo

Tornar o uso do Gemini mensurável e mais sustentável, preservando a qualidade e o comportamento funcional existente.

## Escopo

1. Inventariar e identificar nominalmente as 13 operações Gemini do fluxo de pesquisa.
2. Registrar, por operação, modelo efetivo, duração, tokens de entrada, saída, raciocínio e total, limite de saída, motivo de término, avisos e tentativa.
3. Registrar falhas por classe e status HTTP, sem incluir mensagens brutas do provedor.
4. Centralizar os limites de saída atualmente usados, sem reduzi-los nesta mudança.
5. Remover parâmetros de amostragem descontinuados para os modelos Gemini atuais.
6. Manter `gemini-3.6-flash` como padrão e `thinkingLevel: "minimal"`.
7. Cobrir o observador com testes de sucesso, falha e ausência de vazamento de conteúdo.

## Fora do escopo

- Alterar plano, faturamento, cota ou chave no Google AI Studio.
- Trocar o modelo de produção.
- Reduzir limites de tokens sem uma linha de base observada.
- Alterar prompts, contratos de resposta ou regras acadêmicas.
- Implantar limitação distribuída ou cache sem evidência de necessidade.

## Critérios de aceite

- Cada chamada a `generateText` do módulo de geração passa pelo observador Gemini.
- Logs de sucesso não contêm prompt, resposta gerada, e-mail, chave, nome ou identificador de usuário.
- Logs de falha não contêm a mensagem bruta da exceção.
- Os 13 limites de saída ficam definidos em um único mapa tipado.
- Não existem opções `temperature`, `topP` ou `topK` nas chamadas Gemini do módulo.
- O modelo padrão e o nível de raciocínio permanecem inalterados.
- Lint, tipos, testes e build passam.

## Decisão de produto

Não há justificativa, com a evidência disponível, para mudar o plano Gemini agora. A decisão sobre otimização adicional ou upgrade será tomada após uma janela de dados por operação.

## Plano de reversão

Remover o invólucro de observabilidade e restaurar as chamadas diretas a `generateText`. Os limites centralizados podem permanecer porque não alteram os valores funcionais.

## Validação local

- `npm run check`: lint, tipos, 133 testes, PDF/DOCX e build aprovados.
- `npm run security:audit`: aprovado, com a limitação remota já conhecida.
- `security_fast_check.py --mode worktree`: aprovado, sem gatilhos sensíveis.
- `git diff --check`: aprovado.
- Deployment `dpl_FhQ6hF6zvk2zWhHcN9HDcw1km13B`: READY e promovido para o domínio canônico.
- Health canônico: `status=ok`, versão `v24092026.2` e quatro provedores configurados.
- Smokes Gemini isolado e canônico: respostas estruturadas válidas e eventos `gemini_generation_completed` sanitizados.
- Logs pós-release: nenhum erro encontrado.
