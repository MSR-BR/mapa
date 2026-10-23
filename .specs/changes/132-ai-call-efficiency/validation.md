# Validação — 23/10/2026

Estado: IMPLEMENTED_LOCAL. Em `ResearchPromptInput`, digitar e pausar já não chama `/api/prompt-suggestions`; sugestões locais continuam instantâneas. O aluno escolhe **Aprimorar ideia com IA**. O mesmo texto no mesmo componente reutiliza a resposta recebida; mudança de texto cancela a tentativa anterior. Continua possível criar o mapa sem solicitar esse auxílio opcional. Não há cota diária por aluno.

Contrato testado pela suíte de fundação e `test:suggestions`; o roteiro sintético que antes disparava uma chamada após cada pausa agora faz **zero** chamadas até o clique. Testes de limites e regeneração localizada preservam rascunho e demais quadros. Build Webpack do Next 16.4.2 aprovado. Não foram reduzidos arbitrariamente os budgets de saída de campos acadêmicos; essa calibração depende de amostra de qualidade.

A resposta de IA é guardada somente no estado do componente para o texto exato, não em cache compartilhado ou persistente. Após recarregar a página, um novo clique pode gerar nova chamada. Nenhuma chamada paga foi feita nesta verificação.
