# Requisitos

- Separar landing, origem, papel, modo e primeira visita; não somar usuários entre cortes.
- Classificar generation_failed por app_reason_code, data e usuários afetados; distinguir falha de cancelamento e stage_blocked de validação normal.
- Analisar UFF, orgânico, QR possível e direto separadamente; não tratar scanned.page como QR confirmado ou acesso direto como externo comprovado.
- Preparar encaminhamento técnico sem implementar app, consultar mapas ou enviar mensagens a terceiros.
