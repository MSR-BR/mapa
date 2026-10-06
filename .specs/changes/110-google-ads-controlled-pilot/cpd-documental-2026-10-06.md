# Fechamento documental — C100/C108/C109/C110 — 06/10/2026

## Escopo

Pedido do responsável: **“cpd limpo”**, após confirmação de que C111/C112 já tinham commit, push e publicação concluídos, mas documentos de Analytics/Ads ainda estavam locais. Este fechamento incorpora specs, planos, checklists e evidências existentes, reconcilia o estado do projeto/roadmap e preserva o histórico das decisões anteriores. O pedido histórico de grants do Supabase também fica versionado como referência às C103/C104 já executadas, sem reexecutá-las.

Somente documentação, JSON de planejamento e evidências entram neste commit. Código, dependências, migrations, variáveis e configurações de produção não mudam. Não há novo artefato de aplicação a publicar: o deployment funcional aprovado da C112 continua vigente.

## Produção preservada e reconferida

- Versão **v06102026.4**, candidato funcional **9df1b4f24eb29cbd8f9c43b46412a1bdc649e049**.
- Deployment de produção **dpl_BNzMQH7GPsuYLPERsHL6hDoA7iqh**, conforme [CPD C112](../112-collaborative-ai-provider-progress/cpd-2026-10-06.md).
- Nova leitura pública de `https://mapadapesquisa.com.br/api/health` neste fechamento: `status=ok`, `version=v06102026.4`; OpenAI, Gemini, Supabase, Research Starter e Resend reportam `configured`. Esse endpoint comprova disponibilidade/configuração, não substitui os testes reais já registrados na C112.
- Navegação/contexto preservados e Gemini → GPT em produção documentados nos CPDs C111/C112. Testes pagos não foram repetidos neste fechamento documental.

## Última consulta autenticada de 06/10

A consulta foi realizada nesta conversa, em modo somente leitura, imediatamente antes do pedido de fechamento. Não houve nova criação de projeto nem alteração de Ads/GA4.

| Frente | Evidência observada | Limite |
|---|---|---|
| Ads MSR-BR 383-835-9068 | Campanha Mapa 24325133699 Enabled / Eligible (Limited), €2/dia; RSA 827109934468 Eligible / Approved | Status de força do anúncio ainda Pending é separado da aprovação de política |
| Entrega em 06/10 | Overview, período Today/06 Oct: 1 impressão, 0 cliques, €0,00; busca exibida “projeto de pesquisa” | Primeira exibição comprovada, sem aquisição ou conversão paga comprovada |
| Diagnóstico | “Campaign is limited by bid strategy” e “New bid strategy is learning”; detalhe recomenda Maximize conversions com dados da conta | Recomendação não aplicada; dados globais da MSR-BR não demonstram conversões próprias do Mapa. CPC/orçamento preservados |
| GA4 550650234 | Traffic acquisition, 06/10–06/10: 2 sessões, 7 eventos, 0 eventos-chave. Direct: 1 sessão/2 eventos; Unassigned: 1 sessão/5 eventos | Dados processados existem; não comprovam origem/mídia paga, sessão QA atribuída corretamente ou exclusão de uso interno |
| GA4 Realtime | 0 usuários nos últimos 30 minutos na consulta | Ausência pontual de usuários não invalida a coleta previamente comprovada |

As evidências anteriores à consulta continuam com seus valores e datas originais (por exemplo, zero impressões no lançamento); não foram reescritas como se tivessem mostrado o estado posterior. O registro acima é transcrição resumida da leitura autenticada; não é exportação bruta nem uma nova captura de tela.

## Pendências operacionais preservadas

- Atribuição de sessões/Ads, separação de QA/tráfego interno e baseline longa continuam em acompanhamento na C108. A revisão C097 de 08/10 permanece separada; a janela relevante após a correção de UTMs de 06/10 não está concluída.
- C109 foi entregue à C110 com o RSA aprovado; aprovação do logo próprio continua sem confirmação posterior no registro.
- C110 segue em execução até 12/10, com regra horária >= €14, sem garantia de teto rígido instantâneo e sem aumento automático de orçamento/CPC ou extensão. Monitoramento completo e decisão final não podem ser marcados concluídos antes da avaliação do piloto.
- TERMO conserva seus anúncios, orçamento, lances e conversões; o histórico da C109 explica a mudança de escopo dos sitelinks para manter seus links e isolá-los do Mapa. Não se afirma ausência absoluta de toda mudança de associação histórica.

## Validação deste fechamento

Validação documental aprovada: 107 arquivos no escopo (85 textos/JSON e 22 imagens), JSON legível, 79 referências locais existentes, busca por padrões de credenciais sem ocorrências, revisão visual das 22 capturas e `git diff --cached --check` sem erros. Nenhum arquivo executável integra a alteração. O envio deve ser confirmado pelo SHA da branch no origin e pela ausência de modificações/untracked em `git status --porcelain`; o resultado final desses comandos é o recibo operacional do commit, sem alterar novamente este arquivo apenas para inserir seu próprio SHA.
