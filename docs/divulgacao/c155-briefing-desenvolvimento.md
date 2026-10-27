# C155 — Briefing revisável para o desenvolvimento

**Estado:** C155-v1 aprovada pelo responsável em 27/10/2026 para [encaminhamento local ao desenvolvimento](c155-encaminhamento-desenvolvimento.md), sem publicação. Este documento traduz o [plano de retomada](c155-plano-retomada.md) em critérios verificáveis. Não foi enviado a outra tarefa ou pessoa. A [prévia esquemática](c155-preview.html) não representa uma revisão de código.

## Primeira candidata: refinar o cartão existente

No dashboard, o código atual escolhe `activeProjects[0]` como `continuationMeta` e mostra “Continue de onde parou”, título privado, etapa/progresso e botão “Abrir etapa”. Proposta: antes de mostrar o cartão, classificar o **estado operacional persistido** e o papel da conta. Para Aluno com projeto próprio ativo, etapa realmente disponível, sem revisão pendente nem falha não recuperada, trocar **somente a linha de estado** por **“Próxima etapa: [etapa disponível] · [progresso]% concluído”**. Preservar o título privado e o CTA **“Abrir etapa”** para a rota existente do projeto. A primeira intervenção deve ser esta; não adicionar banner, modal, e-mail ou lembrete em paralelo.

Regras de supressão para revisão técnica: revisão pendente não é abandono; correção solicitada pede caminho distinto; projeto concluído não recebe retomada; falha de geração só recebe promessa de trabalho salvo se a C153 confirmar persistência e retry seguro. Para Orientador com revisão pendente, o cartão “Há uma revisão aguardando você” é **candidato posterior**, fora do primeiro teste. Usar rótulos de estado e etapa, nunca título, texto acadêmico, comentário ou e-mail em eventos ou agregados de marketing. A interface privada pode continuar mostrando título segundo as permissões existentes, mas este briefing não pede sua leitura ou exportação.

## Aceite antes de uma proposta de publicação

1. Testes de estado: projeto acionável mostra o próximo passo correto; pendente de orientador, correção solicitada e concluído não mostram convite enganoso; troca de papel/conta não expõe projetos indevidos.
2. Testes de fluxo e interface: CTA abre a etapa permitida, inclusive após mudança de estado; versão desktop/celular, teclado, foco, contraste e leitor de tela revisados. O cartão atual não deve ser duplicado.
3. Testes de falha: se houver candidato de recuperação, provar que entrada e estado permanecem salvos e retry não duplica operação antes de usar a frase de recuperação.
4. Agregado de mensuração: coorte de projetos distintos elegíveis, exposição ao cartão, avanço persistido após exposição em 7/30 dias e maturação, em contagens por braço somente se houver experimento autorizado. Um eventual controle **sem cartão** exige aprovação específica porque a interface atual já mostra um cartão genérico. Separar contas e projetos na análise; não exportar linhas individuais, IDs ou conteúdo.
5. Revisão humana: entregar diff exato e prévia real com revisão, destino e rollback. Nenhum deploy nem nova coleta/alteração GA4 ou consentimento sem autorização específica do responsável.

**Dependências:** o agregado por projeto da [C152](c152-contrato-metricas.md), triagem das falhas da [C153](c153-encaminhamento-desenvolvimento.md) e estabilização da janela da C154 se ela for publicada. O GA4 histórico mostrou 9 eventos `project_resumed` em 5 pessoas, mas esse evento marca retomada de rascunho, não retorno geral. `advisor_link_pending` tem duas semânticas no código. Não usar esses eventos para selecionar a audiência do cartão.

**Rollback proposto:** restaurar a seleção e o texto atuais do cartão em uma revisão identificada; manter o restante do dashboard e as notificações existentes. Sem publicação, o rollback é apenas descartar a candidata local.
