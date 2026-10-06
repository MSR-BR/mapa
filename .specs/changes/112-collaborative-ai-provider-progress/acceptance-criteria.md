# Critérios de aceite

- AC01: Gemini e GPT entregam o mesmo contrato de domínio em fixtures representativas, com validação de schema, referências, IDs e limites; modelo efetivo é registrado sem segredos.
- AC02: fallback simulado após timeout/429 transitório/5xx muda para o alternativo permitido, dentro do orçamento total, e persiste uma única proposta.
- AC03: credencial inválida, recusa de segurança, autorização negada e teto global têm tratamento explícito; não causam loop, contorno de proteção ou gasto não previsto.
- AC04: falha de ambos, cancelamento e resposta atrasada preservam conteúdo; mudança concorrente de contexto impede overwrite e apresenta resultado como proposta da versão anterior.
- AC05: revisão cruzada identifica função, provedor e achados; divergência não muda a versão vigente sem aceite e não aprova pelo Orientador. Falha/ausência de revisor nunca é exibida como dupla validação.
- AC06: navegação e salvamento puro não chamam IA; revisão extra ocorre apenas nos pontos definidos, respeitando C111.
- AC07: caixa azul mostra “Gerando sugestões com Gemini…” durante chamada Gemini, “Revisando a coerência com GPT…” durante revisão GPT e “Continuando com GPT…” após fallback real. Uso inverso dos provedores também é representado corretamente.
- AC08: Research Starter e salvamento não são rotulados como GPT/Gemini. O frontend não inventa andamento/percentual por temporizador e só apresenta sucesso após confirmação do resultado persistido.
- AC09: eventos fora de ordem, nova operação, reload e desconexão não exibem provedor errado, sucesso falso ou conteúdo de outro projeto; desktop/mobile e leitor de tela recebem estado compreensível.
- AC10: logs de ambas as IAs contêm métricas técnicas sanitizadas, sem prompt, resposta acadêmica, segredo ou PII. Limites consideram retries e revisão, com dados ausentes explicitados.
- AC11: avaliações registram qualidade, preservação de escopo, referências, latência, taxa de recuperação, tokens/custo e ganho da revisão complementar frente ao baseline Gemini. Amostra e critérios são documentados antes dos testes; não escolher modelo só por preferência de marca.
- AC12: existe rollback verificado para Gemini sem revisão extra, mantendo contexto, propostas e histórico. Credenciais/permissões/privacidade e limites de consumo são conferidos antes de testes reais e rollout.
- AC13: testes de unidade, integração, falhas, concorrência, progresso, permissões e E2E passam, com build/segurança/exportações quando afetados. O planejamento não conta como validação funcional ou acesso à API.
