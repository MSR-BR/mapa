# C120 — Primeira busca bibliográfica resiliente

Autorização: “na primeira consulta do reserach starter, esta dando insidponivel. verificar o api e deixar redundante de forma a que nao aconteca novamente. cpd limpo em seguida”. Inclui correção, testes, commit, push e deploy.

## Diagnóstico e escopo

Em 16/10/2026 os logs do Mapa mostram respostas HTTP 400 / invalid-request do Research Starter, rotuladas genericamente como indisponibilidade. O gerador aceita até 240 caracteres; o contrato v1 do Research Starter limita topic a 180. Uma busca sintética curta em produção retornou seis propostas e 20 referências: a integração não está globalmente fora do ar. Não foram lidos textos dos mapas com erro; a relação de cada ocorrência com excesso de comprimento não é afirmada individualmente.

- Alinhar prompt/schema de geração e normalizar a consulta na fronteira externa a 180 caracteres, sem modificar o briefing original. Compatibilidade com consultas antigas salvas até 240.
- Repetição limitada para erros transitórios de rede, 408/429/5xx, respeitando Retry-After, cancelamento e um prazo total; reservar tempo para propostas/persistência.
- Quando o serviço principal falhar transitoriamente ou devolver conteúdo inválido, consultar metadados públicos do Crossref como alternativa independente, sem chave, IA paga adicional, PDF ou texto integral. Enviar somente a consulta bibliográfica resumida, nunca identidade/briefing integral. Exigir DOI/título e aderência lexical mínima; deduplicar; não inventar referências nem transformar metadados em resultados científicos.
- Mostrar origem alternativa e cobertura reduzida; preservar proveniência e referências anteriores. Falha de autenticação/entrada inválida não deve provocar repetição inútil ou ser mascarada como indisponibilidade.
- Testes de contrato, limite, rede, rate limit, timeout/cancelamento, fallback/proveniência/segurança, orçamento de tempo e preservação do briefing. Verificação sintética real antes e depois, checks locais e publicação conferida.

Sem troca de modelo, chave, permissões, schema SQL, limites de IA ou Ads. Sem alterações no repositório/banco do Research Starter. Não há promessa de disponibilidade absoluta: se ambas as fontes falharem ou não houver referências adequadas, preservar a entrada e permitir nova tentativa.

Contrato consultado (somente leitura): research-starter-codex/lib/api/external-research-report.ts, versão 2026-10-02.c96. Crossref: https://www.crossref.org/documentation/retrieve-metadata/rest-api/ e https://api.crossref.org/swagger-ui/index.html.
