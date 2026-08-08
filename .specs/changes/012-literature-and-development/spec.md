# Change 012 — Etapas 4 e 5: capítulos 2 e 4

Status: concluída em 07/08/2026; depende da Change 011.

## Objetivo

Construir e validar os tópicos dos capítulos de Revisão da Literatura e Desenvolvimento/Estudo de Caso a partir das palavras-chave, problemática e objetivos já aprovados.

## Etapa 4 — Capítulo 2: Revisão da Literatura

### Entradas

- Problemática validada.
- Objetivo geral validado.
- Objetivos específicos validados.
- Palavras-chave e referências verificáveis.

### Saída

De três a seis tópicos de revisão da literatura.

### Regras

- Os tópicos cobrem conceitos, teorias, modelos, contexto normativo ou evidências necessários à pesquisa.
- Cada tópico informa quais objetivos ajuda a fundamentar.
- Objetivos específicos predominantemente teóricos podem ser atendidos total ou parcialmente no Capítulo 2.
- Títulos não podem afirmar resultados da pesquisa.
- O sistema sugere reorganização quando dois tópicos são redundantes ou quando um conceito essencial não está coberto.
- Cada tópico mantém referências verificáveis relacionadas.

## Etapa 5 — Capítulo 4: Desenvolvimento / Estudo de Caso / Análise e Discussão

### Entradas

- Objetivo geral e objetivos específicos validados.
- Cobertura já atribuída ao Capítulo 2.
- Natureza preliminar da pesquisa e evidências disponíveis.

### Saída

De três a seis tópicos que operacionalizam os objetivos não atendidos exclusivamente pela revisão.

### Regras

- Cada objetivo específico deve estar ligado a pelo menos um tópico do Capítulo 2 ou 4.
- Títulos do Capítulo 4 derivam semanticamente da ação do objetivo, sem simples cópia mecânica.
- Exemplo: “analisar o diagnóstico” pode originar “Análise do diagnóstico”.
- O último tópico do Capítulo 4 deve se relacionar diretamente ao objetivo geral quando a natureza da pesquisa permitir.
- Não usar “resultados encontrados” quando a pesquisa ainda é uma proposta.
- O usuário pode reordenar, renomear, adicionar e remover tópicos dentro dos limites, com revalidação de cobertura.

## Biblioteca de conhecimento controlada

- Palavras-chave podem acionar sugestões de conceitos relacionados, como ESG, ODS ou economia circular para sustentabilidade.
- Sugestões são candidatas de vocabulário, não fatos nem referências.
- Um conceito só entra no capítulo após aceitação do usuário e, quando fizer afirmação factual, associação a evidência verificável.
- A base inicia curada e versionada; não aprende automaticamente com conteúdo privado de outros usuários.

## Interface

- Cada etapa mostra tópicos em lista ordenável e um painel de cobertura dos objetivos.
- Estados de cobertura: não atendido, parcialmente atendido, atendido no Capítulo 2, atendido no Capítulo 4 ou atendido em ambos.
- “Validar e avançar” é bloqueado se houver objetivo sem destino.
- Mudanças em palavras-chave podem acionar “Otimizar literatura”, preservando a versão anterior até confirmação.

## Critérios de aceite

- [x] Capítulo 2 contém de três a seis tópicos fundamentados.
- [x] Capítulo 4 contém de três a seis tópicos derivados dos objetivos.
- [x] Todo objetivo específico possui cobertura explícita no Capítulo 2 e/ou 4.
- [x] O tópico final do Capítulo 4 se relaciona ao objetivo geral ou registra justificativa metodológica para exceção.
- [x] Referências exibidas são verificáveis e rastreáveis ao Research Starter.
- [x] Conceitos sugeridos não são aceitos silenciosamente.
- [x] Reordenação e edição atualizam rastreabilidade e coerência.

## Testes

- Cobertura integral dos objetivos e detecção de lacunas.
- Limites, ordem, duplicidade e remoção de tópicos.
- Referências desconhecidas ou inventadas são rejeitadas.
- Otimização de literatura preserva a versão anterior em caso de falha.
- E2E das etapas 4 e 5 com edições humanas.
