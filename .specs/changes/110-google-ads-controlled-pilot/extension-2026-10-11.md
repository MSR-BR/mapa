# Prorrogação autorizada — 11/10/2026

Este registro substitui o prazo de 12/10 e o limiar de €14 nos documentos originais do piloto. A campanha segue ativa, com acompanhamento diário. O histórico de lançamento e os relatórios anteriores permanecem como observações das respectivas datas.

## Autorização e escopo

O responsável pediu continuidade e escolheu explicitamente: **“Mais 7 dias a €2/dia, até €28 acumulados”**. São sete dias adicionais, **13 a 19/10/2026**, inclusive, para a campanha **24325133699**, Mapa | Search | BR | Ativacao | Piloto, na conta **MSR-BR 383-835-9068**, `mario.reis.junior@gmail.com`.

## Alterações realizadas e verificadas

- **Término:** de 12/10 para **19/10/2026**, salvo no Google Ads. Resumo após salvar: “Start date: October 6, 2026 End date: October 19, 2026”. A campanha estava Enabled / Eligible (Learning), com €2/dia.
- **Regra de pausa:** a edição da regra anterior **61994210** gerou a nova versão **62128225**, nome **Mapa | Pausa por custo EUR28 | C110**. Habilitada, Hourly, usando All time, condição **Cost >= €28**, ação Pause campaigns, selecionando somente Mapa. A tabela final mostrou uma regra, sem duplicação. A simulação indicou zero campanhas afetadas no momento; custo acumulado observado era €0.
- **Automação:** `mapa-concluir-ads-e-acompanhar-piloto` atualizada e confirmada ACTIVE, frequência diária preservada. Passa a usar 19/10, €28 e o novo identificador da regra. No primeiro acompanhamento após o término, deverá confirmar encerramento, avaliar resultados e pausar a automação, sem arquivar o chat.
- **Registro:** manifesto C109 atualizado com autorização, novo prazo, limite e versão da regra. Leitura da configuração da automação salva como evidência.

Orçamento médio diário **€2**, CPC máximo **€0,30**, objetivo exclusivo `project_start`, GA4, redes, consentimento e permissões preservados. Nenhuma alteração no TERMO, financiamento da conta separada, adição de fundos, mudança de anúncio, código ou deploy. C097 preservada.

## Limites e próxima conferência

A regra é horária e os custos não são informados instantaneamente; **€28 é o limiar de pausa, não garantia de teto rígido em tempo real**. A execução agendada da nova versão ainda não foi observada; o histórico de sucesso às 07:53:37 BRT pertence à versão anterior de €14. O ramo de pausa ao atingir o limiar nunca foi exercitado. Conferir a nova versão no próximo acompanhamento.

O período autorizado termina ao final de 19/10 no fuso da conta, São Paulo. Sem nova autorização, não estender além disso nem reativar automaticamente. Permanecem os gatilhos de pausa por falha comprovada de medição, privacidade/qualidade ou custo acumulado >= €28. Baixo índice de qualidade de palavra-chave, por si só, não comprova violação do produto.

A baixa entrega continua aberta: a conferência anterior registrou três impressões e zero cliques/custo/conversões. Prorrogar a duração não garante entrega. Continuar diagnóstico sem aumentar orçamento ou CPC automaticamente.

## Evidências

- [Prazo salvo — texto](evidence-extension-2026-10-11/dates-saved.txt) e [captura](evidence-extension-2026-10-11/dates-saved.png).
- [Simulação da regra](evidence-extension-2026-10-11/rule-preview.txt).
- [Nova regra habilitada — texto](evidence-extension-2026-10-11/rule-saved.txt) e [captura](evidence-extension-2026-10-11/rule-saved.png).
- [Automação após atualização](evidence-extension-2026-10-11/automation-readback.toml).

Verificação local: JSON do manifesto válido, correspondência dos limites/prazos com as evidências e `git diff --check`. Nenhum teste de aplicação repetido, pois não houve alteração de código.
