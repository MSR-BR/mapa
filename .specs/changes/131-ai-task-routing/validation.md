# Validação — 23/10/2026

Estado: EVALUATION_READY. Nenhum modelo do aplicativo foi alterado.

Criado `scripts/evaluate-ai-routing.mjs`: compara por operação/provedor tentativas, sucesso, duração, custo estimado conhecido e avaliações acadêmicas fornecidas separadamente. O resultado não altera a rota por conta própria. O teste sintético confirma que custo menor e sucesso aparente não levam a troca sem evidência de qualidade. [Comparação sintética](synthetic-comparison.json) é de testes locais, não de usuários reais.

A amostra operacional anterior tinha 52 chamadas Gemini e 10 GPT em 30 minutos, mas mistura operações e jornadas incompletas. Não comprova qualidade equivalente ou custo por mapa. A consulta de runtime logs da Vercel em 23/10 retornou 403; CLI Vercel não está disponível. Faltam amostras comparáveis com avaliação acadêmica por tarefa antes de mudar gerador, revisor ou fallback. O teto interno compartilhado e as regras de recusa permanecem preservados.

Teste: `tests/ai-capacity-report.test.mjs` e `npm run test:ai` PASS. Zero chamadas pagas.
