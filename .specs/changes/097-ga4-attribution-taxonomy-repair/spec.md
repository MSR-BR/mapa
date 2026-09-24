# Change 097 — Integridade de atribuição e taxonomia GA4

Status: planejada; não executada

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
