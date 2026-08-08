# Change 011 — Etapas 1, 2 e 3: problemática e objetivos

Status: concluída e validada.

## Objetivo

Converter a proposta escolhida em uma sequência validada de problemática, objetivo geral e objetivos específicos, sempre permitindo revisão humana.

## Padrão comum das etapas

- Exibir origem, sugestão preenchida, explicação curta da relação e referências pertinentes.
- Oferecer “Voltar”, “Regenerar sugestão”, “Salvar rascunho” e “Validar e avançar”.
- Permitir edição direta antes da validação.
- Identificar visualmente conteúdo sugerido pela IA e conteúdo alterado pelo usuário.
- Regenerar somente mediante confirmação quando houver edição humana.
- Salvar cada validação como nova versão lógica, sem perder a versão anterior necessária à auditoria.

## Etapa 1 — Problemática da pesquisa

### Entrada

Card selecionado, prompt original, interpretação e evidências vinculadas.

### Saída

Uma única grande pergunta, definitiva após validação.

### Regras

- Iniciar preferencialmente com “Como” ou “De que forma”.
- Representar a razão da pesquisa e orientar todas as etapas posteriores.
- Conter um foco principal; evitar perguntas compostas independentes.
- Manter objeto, relação e recorte aceitos no card.
- Permitir ajustes do usuário antes do aceite.

## Etapa 2 — Objetivo geral

### Entrada

Problemática validada.

### Saída

Exatamente um objetivo geral.

### Regras

- Responder diretamente à problemática.
- Iniciar com verbo no infinitivo.
- Expressar o principal resultado intelectual pretendido sem inventar resultado empírico.
- Manter escopo compatível com a pergunta; não ser mais amplo nem tratar tema diferente.
- A interface exibe problemática e objetivo lado a lado ou em sequência visual clara.

## Etapa 3 — Objetivos específicos

### Entrada

Objetivo geral validado.

### Saída

Quatro objetivos específicos por padrão, com possibilidade controlada de três a seis.

### Regras

- Cada objetivo inicia com verbo no infinitivo.
- Cada objetivo representa uma etapa necessária para atender o objetivo geral.
- Não pode haver objetivo independente, redundante ou mais amplo que o geral.
- A ordem deve formar progressão lógica, por exemplo: fundamentar/caracterizar, diagnosticar/identificar, analisar/avaliar e propor/desenvolver.
- Verbos não são impostos mecanicamente; devem ser adequados à natureza da pesquisa.
- Cada objetivo recebe um ID estável usado nas etapas posteriores.

## Edição e invalidação

- Alterar a problemática validada marca objetivo geral e descendentes como desatualizados.
- Alterar o objetivo geral marca objetivos específicos e descendentes como desatualizados.
- Alterar um objetivo específico invalida apenas tópicos e mapeamentos ligados a ele, além dos diagnósticos globais de coerência.
- O usuário escolhe entre regenerar dependentes, revisá-los manualmente ou cancelar a alteração.

## Critérios de aceite

- [x] Não é possível validar mais de uma problemática ou mais de um objetivo geral.
- [x] A relação problemática -> objetivo geral é explícita e validada.
- [x] Existem de três a seis objetivos específicos; o padrão gerado é quatro.
- [x] Todos os objetivos usam verbos no infinitivo e possuem IDs estáveis.
- [x] O sistema detecta objetivos redundantes ou sem relação com o objetivo geral.
- [x] Edições preservam rascunho e invalidam apenas os descendentes corretos.
- [x] Recarregar ou trocar de dispositivo restaura a etapa atual.

## Testes

- Regras linguísticas e estruturais, sem depender apenas da IA.
- Transições válidas e inválidas da máquina de estados.
- Versionamento e propagação de invalidação.
- Concorrência entre duas abas sem sobrescrita silenciosa.
- E2E: escolher card, editar problemática, validar objetivo geral e validar objetivos específicos.
