# Change 097 — Integridade de atribuição e taxonomia GA4

Status: implantada em produção em 24/09/2026; baseline de 14 dias em observação até 08/10/2026

## Objetivo

Restaurar a confiança em aquisição e funis sem apagar histórico.

## Requisitos

- substituir o parâmetro reservado source por app_surface;
- criar parâmetros prefixados para papel, modo, macroetapa, passo e resultado;
- separar macroetapa 1–4 dos passos internos;
- registrar novas dimensões no GA4 e descontinuar as antigas sem reescrever histórico;
- definir key events project_start, project_completed e opcionalmente advisor_approved após validação real;
- reconstruir o funil e corrigir a exploração vazia;
- validar Internal Traffic em Testing antes de ativar a exclusão;
- documentar retenção e quebra de série;
- observar 14 dias de baseline limpo.

## Não objetivos

- não vincular Google Ads;
- não importar conversões;
- não excluir dados históricos;
- não enviar PII, UUID ou conteúdo acadêmico.

## Aceite

- source/medium contém somente aquisição;
- evento controlado aparece uma única vez com dimensões corretas;
- key event aparece após conclusão persistida;
- funil apresenta a jornada de teste;
- dashboard distingue aquisição, ativação e conclusão;
- rollback remove somente as novas emissões/configurações, preservando eventos históricos.

## Modelo recomendado

gpt-5.6-sol com raciocínio xhigh.

## Execução

- Código publicado no commit `bdb7608` e no deployment
  `dpl_9Cbsri68KvXY6t4ppoPsn2WtqNz4`.
- Doze dimensões `app_*` cadastradas no GA4 sem remover as onze dimensões
  históricas.
- `project_start` e `project_completed` definidos como key events.
- Exploração “Mapa — Jornada principal” reconstruída com eventos reais e
  configurada como funil aberto.
- Filtro Internal Traffic mantido em Testing até haver evidência marcada pelo
  próprio filtro; Google Ads não foi alterado.
- O fechamento definitivo depende da leitura comparativa do baseline em
  08/10/2026.
