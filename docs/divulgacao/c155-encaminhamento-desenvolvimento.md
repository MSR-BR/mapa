# C155-v1 — Encaminhamento local ao desenvolvimento

**Autorização recebida:** o responsável respondeu “aprovo” em 27/10/2026 à pergunta sobre aprovar a **C155-v1 para encaminhamento ao desenvolvimento, sem publicação**. O aceite cobre a candidata descrita abaixo. Não aprova uma revisão de código ainda inexistente, deploy, experimento, nova instrumentação, consentimento, comunicação externa ou alteração em Ads, GA4 e Search Console.

## Pedido exato

No cartão existente “Continue de onde parou” do dashboard (`app/dashboard/page.tsx`), mostrar para **Aluno com projeto próprio ativo e próxima etapa realmente disponível** a linha de estado:

> Próxima etapa: [etapa disponível] · [progresso]% concluído

Preservar o título privado e o botão **“Abrir etapa”**, que deve continuar levando à rota existente do projeto (`/dashboard/projects/{id}`). A decisão de elegibilidade deve usar o estado operacional persistido e as permissões da conta. Não criar segundo cartão, banner, modal, e-mail ou lembrete.

Não mostrar a mesma chamada de avanço livre quando o projeto aguarda revisão, tem correção solicitada, já foi concluído ou sofre falha de geração não recuperada. Uma mensagem específica para Orientador e uma recuperação de falha são candidatas posteriores, fora da C155-v1. O [briefing](c155-briefing-desenvolvimento.md) e a [prévia local](c155-preview.html) detalham os estados; a prévia é esquemática, não representa a interface implementada.

## Critérios para a revisão implementada

1. Demonstrar com testes de estado que o projeto acionável exibe a etapa realmente disponível e que pendência, correção, conclusão e falha não recebem convite enganoso. Verificar permissões ao trocar papel/conta e ao abrir a rota.
2. Conferir fluxo, layout desktop/celular, teclado, foco, contraste e leitor de tela. Não duplicar o cartão ou as notificações existentes.
3. Se o desenvolvimento sugerir recuperação de geração, devolver como decisão separada após provar persistência do trabalho e retry seguro; a C155-v1 não contém promessa de recuperação.
4. Preparar, em Change própria do projeto de desenvolvimento, diff exato, prévia real, revisão identificada, destino e rollback antes de propor publicação. Seguir a documentação da versão instalada do Next.js exigida pelo `AGENTS.md`.
5. Tratar mensuração como decisão separada: o agregado solicitado pela [C152](c152-contrato-metricas.md) deve contar projetos distintos, exposição e avanço persistido após exposição em janelas 7/30 dias maturadas, sem conteúdo, título, e-mail, IDs ou linhas individuais no relatório. Não criar evento ou alterar GA4/consentimento com este aceite. Um controle sem cartão também precisa de aprovação própria.

**Por que esta candidata:** o cartão já existe, mas usa o primeiro projeto ativo para a continuação. O GA4 histórico consultado em 27/10 para 06–26/10 mostra sinais de uso e falha, porém não permite calcular retorno ou avanço por projeto; `project_resumed` mede retomada de rascunho, não toda volta ao app. A hipótese é que uma próxima etapa correta ajude quem já voltou a avançar. O efeito não está comprovado.

**Estado do encaminhamento:** documento persistido no workspace para retirada pelo projeto de desenvolvimento. Nenhuma mensagem foi enviada a outra pessoa ou tarefa; nenhum arquivo do aplicativo ou plataforma foi modificado nesta etapa. Após implementação local, apresentar a revisão concreta ao responsável. Publicação requer aceite específico dessa revisão e destino. O rollback proposto é restaurar a seleção e o texto anteriores do cartão em uma revisão identificada.
