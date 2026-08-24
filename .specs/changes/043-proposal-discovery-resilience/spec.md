# Change 043 — Descoberta de propostas resiliente

Status: concluída

## Objetivo

Eliminar a falha genérica “Não foi possível formar as propostas” quando uma
resposta transitória do Research Starter, um campo bibliográfico inconsistente
ou um desvio formal da resposta estruturada do Gemini impedir a montagem dos
seis cards.

## Escopo

- Research Starter com timeout limitado, uma repetição apenas para falhas
  transitórias e erro tipado sem exposição de chave ou conteúdo do usuário.
- Normalização das referências antes da validação do workflow, preservando
  abstracts dos artigos de topo e descartando somente campos bibliográficos
  inválidos de forma segura.
- Limite de tempo para a descoberta e fallback de intervalo/consulta mais ampla.
- Segunda tentativa de formação dos cards com instruções explícitas de reparo,
  mantendo a regra de uma proposta exata e cinco alternativas distintas.
- Classificação explícita de quota esgotada e indisponibilidade temporária do
  Gemini, sem atribuir uma falha de cobrança a um problema do briefing.
- API e interface com etapa do erro, retry acionável e confirmação de que o
  briefing permanece salvo.

## Critérios de aceite

1. A descoberta não inicia uma segunda execução concorrente para o mesmo workflow.
2. Uma falha de rede/5xx do Research Starter pode ser repetida automaticamente
   dentro do limite de tentativas e tempo.
3. URLs bibliográficas malformadas não derrubam o workflow inteiro.
4. O Gemini recebe uma segunda chance quando a resposta não satisfaz o contrato
   dos seis cards; IDs de referências fora do relatório continuam bloqueados.
5. O retry manual reutiliza o briefing persistido e não mostra um formulário vazio.
6. A API retorna código, etapa, retryability e `preservedBriefing` sem vazar
   detalhes sensíveis.
7. Quota esgotada do Gemini aparece como bloqueio operacional claro e não como
   erro de formato dos seis cards.

## Verificação

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
