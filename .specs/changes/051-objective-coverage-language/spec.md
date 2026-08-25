# Change 051 — Linguagem de cobertura dos objetivos nos capítulos 2 e 4

Status: planejada

## Origem

Relatório `MAPA DA PESQUISA (1).docx`, registros de 25/08/2026 sobre a relação
dos tópicos da revisão da literatura e do desenvolvimento/estudo de caso com
os objetivos.

## Objetivo

Substituir a linguagem ambígua da interface por critérios acadêmicos mais
claros e consistentes nos capítulos 2 e 4.

## Escopo

- Substituir “Ajuda em parte” por “Atende parcialmente”.
- Substituir “Atende bem” por “Atende completamente”.
- Disponibilizar o seletor de cobertura tanto no Capítulo 2 quanto no
  Capítulo 4, para cada OE e, quando aplicável, para o OEG.
- Explicar, junto ao controle, que “parcialmente” indica contribuição que
  precisa ser complementada e “completamente” indica cobertura central.
- Manter os valores persistidos `partial` e `full` para compatibilidade com
  projetos existentes, alterando apenas os rótulos e a apresentação.
- Atualizar avisos de coerência, validações, mapa final, PDF e testes para os
  novos termos.

## Decisão de escopo

O relatório menciona “3 opções”, mas lista somente duas. Esta Change registra
duas opções — “Atende parcialmente” e “Atende completamente” — sem inventar uma
terceira opção. Uma terceira categoria só deve ser adicionada mediante nova
decisão explícita.

## Critérios de aceite

1. Os dois capítulos exibem exatamente os rótulos aprovados.
2. Projetos antigos continuam carregando e salvando sem migração destrutiva.
3. A cobertura do OE/OEG aparece corretamente na coerência e no PDF.
4. A validação impede tópicos sem objetivo quando a regra da etapa exigir
   vínculo e mantém a exceção documentada para o tópico 4.1.

