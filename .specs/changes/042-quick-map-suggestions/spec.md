# Change 042 — Mapa Rápido com sugestões resilientes

**Estado:** Concluída em 23/08/2026.

## Problema

No Mapa Rápido, as alternativas de tema e formulação dependiam exclusivamente
da resposta da IA. Quando a chamada demorava, sofria limitação ou falhava, o
usuário via apenas o campo de texto e não conseguia usar o recurso que deveria
aprimorar o pedido enquanto ele era escrito.

## Objetivo

Restaurar as sugestões durante a digitação, mantendo o refinamento por IA sem
bloquear a jornada rápida nem apagar o texto do usuário.

## Escopo

- Mostrar três sugestões locais a partir de oito caracteres.
- Classificar as sugestões como Tema, Formulação e Recorte.
- Derivar as sugestões somente do texto informado, sem criar fatos externos.
- Solicitar sugestões do Gemini a partir de 18 caracteres.
- Substituir as sugestões locais pelas sugestões da IA somente após resposta
  válida e não vazia.
- Manter o rascunho e a seleção do modo rápido compatíveis com o fluxo de
  autenticação já existente.
- Atualizar o contrato de saída do Gemini para aceitar a categoria Recorte.
- Atualizar a versão pública e a documentação operacional.

## Fora do escopo

- Alterar a geração dos seis cards de propostas.
- Alterar o Mapa Avançado ou o schema das cinco perguntas.
- Fazer a geração bibliográfica antes do login.
- Persistir sugestões locais no Supabase.

## Gate de saída

- Sugestões visíveis sem depender de uma chamada de rede.
- Refinamento por IA preservado quando o serviço responder.
- Seleção de qualquer sugestão atualiza o campo e permite continuar.
- Lint, typecheck e testes aprovados.
- Versão `v23082026.1` registrada na interface e no Git.
