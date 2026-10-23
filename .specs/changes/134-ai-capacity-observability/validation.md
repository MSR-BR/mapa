# Validação — 23/10/2026

Estado: IMPLEMENTED_LOCAL_PARTIAL. A reserva v2 emite aviso sanitizado ao cruzar 80% e 95% do teto mensal, uma transição por limiar/mês; o PostgreSQL local confirmou ambos. Os observadores distinguem custo estimado conhecido e uso desconhecido, sem ler prompts ou textos acadêmicos. A rota informa separadamente orçamento interno, cota do provedor, saturação momentânea e timeout.

`node scripts/report-ai-capacity.mjs log-sanitizado.ndjson` agrega por operação/provedor tentativas, falhas, custo estimado conhecido, uso sem preço e avisos. [Relatório sintético](synthetic-report.json) vem apenas da suíte local: não mede estudantes reais, projetos únicos nem conclusão. `node scripts/evaluate-ai-routing.mjs log-sanitizado.ndjson [avaliacao-academica.json]` acrescenta comparação de rotas sem troca automática.

Nenhum relatório de custo **por mapa completo** foi produzido: os logs atuais não ligam custo à conclusão de um projeto e o acesso a runtime logs recentes pelo conector Vercel retornou 403. Para validar 50 mapas/dia, falta telemetria de jornada com identificador técnico privado/consentimento revisado, cotas reais e amostra de turma; não inferir de eventos agregados. Alertas são logs operacionais, não e-mails. Nenhuma métrica de GA4 ou Ads foi alterada.

Testes: `tests/ai-capacity-report.test.mjs`, PostgreSQL local, suíte geral. Nenhuma chamada paga.
