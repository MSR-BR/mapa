# Links de divulgação e uso interno — 15/10/2026

Prontos para uso. Abrem diretamente `/mapa`, sem alterar a campanha paga. O consentimento continua sendo exigido para coleta.

| Uso | Link | Identificação esperada no GA4 |
|---|---|---|
| UFF | [Abrir](https://mapadapesquisa.com.br/mapa?utm_source=uff&utm_medium=referral&utm_campaign=divulgacao_202610&utm_content=institucional) | `uff / referral` |
| WhatsApp | [Abrir](https://mapadapesquisa.com.br/mapa?utm_source=whatsapp&utm_medium=social&utm_campaign=divulgacao_202610&utm_content=mensagem) | `whatsapp / social` |
| QR do marcador | [Abrir](https://mapadapesquisa.com.br/mapa?utm_source=marcador&utm_medium=qr&utm_campaign=divulgacao_202610&utm_content=frente) | `marcador / qr` |
| Equipe — uso interno | [Abrir](https://mapadapesquisa.com.br/mapa?utm_source=mapa_team&utm_medium=internal&utm_campaign=divulgacao_202610&utm_content=equipe) | `mapa_team / internal` |

## Como usar

- UFF: usar no texto/link institucional; não foi enviada nenhuma comunicação.
- WhatsApp: usar este link nas mensagens de divulgação.
- QR: usar a URL indicada ao gerar um novo QR ou alterar um redirecionamento editável. Os marcadores já impressos não mudam; o acesso antigo pode continuar em `scanned.page / referral`.
- Equipe: iniciar a navegação de teste por esse link, preferencialmente em sessão/perfil separado de uso pessoal. Não divulgar o link interno. O histórico direto não pode ser reclassificado com certeza.

## Avaliação

Consultar GA4 550650234 por `sessionSourceMedium` e `sessionCampaignName`, com sessões, usuários distintos do período e `keyEvents:project_start`. Excluir `codex_validation / qa` e `mapa_team / internal` da avaliação externa. Auditar resultados após processamento; ausência de tráfego agora é esperada porque os links ainda não foram distribuídos.

As URLs usam apenas parâmetros permitidos e valores sem nomes, emails ou conteúdo de pesquisa. A captura depende do consentimento e do processamento do Google. Identificação por link melhora a separação futura, mas não exclui todo acesso interno automaticamente. Links externos nunca devem receber a etiqueta interna.

