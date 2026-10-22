# C127 — Next.js, proteção de lembretes e orientação de bloqueios

Status: implementada e validada localmente; pronta para revisão.
PUBLICATION_STATE: NOT_REQUESTED. Sem commit/push/deploy ou banco remoto.

## Escopo autorizado

Corrigir R3/R4/R5 da revisão integrada de 22/10. Preservar C123–C126, Ads, GA4,
Supabase remoto, configurações/chaves e o uso de IA sem cota diária por usuário.
Não enviar e-mails nem fazer chamadas pagas em testes.

## Contrato

- Next.js e eslint-config-next fixados em 16.4.2; lockfile coerente. Não fazer
  downgrade para remover alertas nem instalar scripts de terceiros automaticamente.
- Lembretes: uma tentativa por revisão/remetente a cada 24h e cinco por remetente
  em janela móvel de 24h, incluindo todos os projetos. Apenas reenvios de e-mail,
  não mapas, sugestões de IA ou notificações de submissão/aprovação.
- Reserva durável e atômica antes do transporte; concorrência entre instâncias;
  ator/tempo/destinatário/idempotência não escolhidos pelo cliente. Exclusão de
  projeto não devolve cota; timestamps privados limitados a cinco por ator.
- Destinatário canônico: e-mail do orientador no projeto ou e-mail confirmado do
  proprietário; não usar campos de e-mail editáveis no JSON da revisão.
- Falha de configuração/armazenamento: não enviar. Timeout/falha de transporte:
  não devolver reserva, pois entrega pode ter ocorrido; mostrar prazo de 24h.
  Nenhum retry automático da RPC ou do envio. Limites de 5s (RPC) e 10s (transporte).
- Lembrete sem título livre no assunto nem comentário livre no corpo; chave
  de idempotência derivada da reserva. Autorização existente continua obrigatória.
- Bloqueios: códigos estáveis e mensagens locais permitidas para orientador
  ausente, pendente, etapa anterior/ativa, conflito de revisão, perfil, sessão,
  frequência e indisponibilidade. Não expor texto bruto nem apagar campos.

## Migration local

`20261022213449_c127_advisor_reminder_guard.sql`, criada pelo Supabase CLI.
Duas tabelas privadas com RLS, sem grants diretos; uma RPC com EXECUTE somente
para authenticated e autorização interna por auth.uid/mode/vínculo. Nenhum segredo
novo. Dados: IDs, UUID da reserva e horários; nenhum texto acadêmico/e-mail salvo
nos contadores. Histórico de reservas >7 dias é removido no próximo envio aceito
pelo mesmo ator; usuário/projeto têm cascatas apropriadas. Inatividade não garante
purga em data fixa; a próxima tentativa aceita faz a limpeza.

## Método

Pó Mágico v20261020.002, core e blueprints APP/AI/security já lidos nesta sessão;
HEAD local/remoto confirmado em 22/10 na revisão precedente. Checkpoints
resume/classification/Change: implementação S3; delta reserva transacional,
janela móvel testada e mensagens claras sem remover autorização.
Codex/GPT-6; variante/esforço do runtime não expostos; sem subagentes.
Skills de segurança e Supabase aplicadas. Changelog público Supabase consultado:
TLS CBC e minor PostgreSQL 17.11 não exigem alteração nesta implementação (sem
cifras legadas, ltree, btree_gist/custom operators); ambiente remoto não inspecionado.
Guias locais Next 16.4.2 sobre upgrade/route handlers/server functions lidos.

## Fora desta Change

Legenda sincronizada UX-06; ações administrativas GA4/Auth; validação dos US$5
no destino; deploy e aplicação de todas as migrations locais. Cinco avisos altos
na cadeia dev ESLint/braces precisam avaliação de risco/patch upstream separado.
