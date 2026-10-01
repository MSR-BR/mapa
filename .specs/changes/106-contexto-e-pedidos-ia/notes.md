# Decisões e risco

- Pedidos pontuais ficam apenas no estado do navegador e no corpo da requisição de regeneração. Não entram no schema `ResearchWorkflowContent`.
- Os antigos `studentJustification` continuam sendo o contexto acadêmico, preservando revisão, validação e exportações.
- A justificativa da classificação metodológica não é convertida em chat: ela é conteúdo final do trabalho.
- Os prompts subordinam os pedidos ao recorte validado, formato e fontes verificáveis.
- A ausência de teste E2E autenticado de geração real em produção deverá ser explicitada no CPD; não haverá mutation de projetos reais para smoke.
