# Change 010 — Descoberta de seis propostas

Status: concluída e validada de ponta a ponta.

## Objetivo

Transformar o prompt geral do usuário em seis propostas distintas de pesquisa, apresentadas como cards logo abaixo da entrada.

## Jornada

1. O usuário informa um tema, contexto, palavras-chave ou pedido em linguagem natural.
2. O Mapa interpreta idioma, área, recorte, objeto, população/contexto e relação científica pretendida.
3. O backend cria uma consulta bibliográfica otimizada e consulta o Research Starter.
4. IA e evidências retornadas formam seis propostas.
5. A interface mantém o prompt visível e apresenta os seis cards na mesma página.
6. O usuário escolhe um card para iniciar a Etapa 1.

## Composição obrigatória

- Card 1: correspondência mais exata possível ao pedido, sem ampliar ou trocar o objeto central.
- Cards 2 a 6: alternativas relevantes, não duplicadas, produzidas por variações justificáveis de recorte, relação, população, contexto, perspectiva teórica ou aplicação.
- As alternativas não podem apenas parafrasear o mesmo título.
- Nenhum card pode introduzir fato, população, instituição ou resultado sem apoio no prompt ou nas evidências.

## Conteúdo de cada card

- Indicador “Mais próxima do seu pedido” ou “Alternativa sugerida”.
- Título curto e acadêmico, criado pela IA; nunca cópia integral do prompt.
- Problemática da pesquisa em forma de uma única grande pergunta.
- A pergunta começa preferencialmente por “Como” ou “De que forma”.
- Uma ou duas frases curtas de situação-problema/contexto, em linguagem de proposta.
- Área do conhecimento, marcada como “Área proposta” quando não explícita.
- Até cinco palavras-chave.
- Sinalização discreta de literatura encontrada e possibilidade de ver as fontes.

## Contrato da problemática

- Existe exatamente uma problemática por card.
- Representa a razão central da pesquisa e pode orientar as etapas seguintes.
- É investigável, delimitável e não contém resposta antecipada.
- Não combina múltiplas perguntas independentes.
- Não promete causalidade quando a evidência disponível só sustenta descrição ou associação.

## IA e Research Starter

- Uma etapa de interpretação separa o prompt integral da consulta bibliográfica.
- O Research Starter é consultado antes da formação final dos cards.
- A IA recebe somente evidências compactadas, IDs de referências e metadados necessários.
- As referências usadas ficam associadas aos candidatos por ID verificável.
- Ausência de literatura verificável não pode ser apresentada como sucesso. O sistema oferece ajustar o prompt ou tentar uma busca ampliada controlada.
- A busca ampliada segue as regras vigentes de 5 anos, 10 anos e termos centrais limitados.

## Interface e estados

- Entrada responsiva, acessível e preservada durante login, falha e recarregamento.
- Skeletons individuais durante a descoberta.
- Estados: interpretando, buscando literatura, formando propostas, pronto e erro recuperável.
- Cards selecionáveis por teclado, com foco visível e sem clique acidental em ações secundárias.
- Nova busca exige confirmação se já houver etapas validadas no projeto.

## Persistência

- Salvar o prompt original, a interpretação estruturada, a consulta enviada ao Research Starter e os seis candidatos.
- Registrar versão dos prompts de IA, data da busca e IDs das referências.
- Não criar seis projetos: todos os candidatos pertencem ao mesmo fluxo até a escolha.
- Após a escolha, preservar os candidatos não escolhidos para auditoria e eventual retorno, sem tratá-los como conteúdo aprovado.

## Critérios de aceite

- [x] Exatamente seis cards válidos são exibidos.
- [x] O primeiro mantém a maior fidelidade semântica ao prompt.
- [x] Os outros cinco oferecem alternativas materialmente distintas.
- [x] Todo card contém título, uma problemática e contexto curto.
- [x] Títulos não reproduzem integralmente a entrada.
- [x] A problemática segue a regra de uma grande pergunta.
- [x] Referências associadas existem no retorno real do Research Starter.
- [x] Prompt e cards sobrevivem a login e recarregamento.
- [x] Zero referências produz estado de ajuste, não estrutura vazia.
- [x] Mobile, teclado, leitores de tela e redução de movimento são verificados por contrato e build responsivo.

## Testes

- Schemas da interpretação e dos seis candidatos.
- Distinção semântica e limites estruturais dos cards.
- Contrato real opt-in do Research Starter e mocks determinísticos por contrato.
- Falhas, timeout, resposta parcial, resposta inválida e retry.
- Preservação do prompt antes/depois do login.
- E2E de descoberta e escolha em mobile e desktop.
