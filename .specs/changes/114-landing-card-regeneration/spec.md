# C114 — Entrada pública e edição por quadro

Autorização: solicitação de 08/10/2026, itens 1–6 e screenshots fornecidos pelo responsável. Implementar estes requisitos; preservar alterações pendentes C113 e registros Ads. Sem alteração de credenciais, modelos, orçamento ou banco remoto.

Autorização posterior, em 08/10: **“cpd limpo”** aprova commit, push e publicação da C114 no projeto existente `mapadapesquisa` / `mapadapesquisa.com.br`, além do fechamento documental pendente. A restrição de publicação da rodada local abaixo é histórica. Sem smoke pago, migration, alteração de segredo ou de campanha neste CPD.

## Contrato

- Landing editorial indexável, canonical/metadata/dados estruturados preservados e links reais para `/mapa`. Página pública dedicada aos modos Rápido/Avançado; preparar a ideia não exige login. Criar/persistir projeto mantém Google OAuth e regras Aluno/Orientador.
- Regenerar com IA atua somente no quadro selecionado e recebe texto atual, orientação pontual e contexto do projeto. Salvar a página antes de chamar IA; resultado entra em rascunho visível, sem substituir contexto confirmado ou apagar outros quadros. Falhas mantêm edições. Esta ação explícita substitui a proposta global oculta para a regeneração por quadro; histórico e confirmação acadêmica C111 permanecem.
- Trocar contexto/pedido mantém o texto visível. Contexto é guardado com a página; pedido pontual não vira contexto sem escolha do usuário. Não limpar orientação após erro.
- Voltar salva a página e navega somente após confirmação de persistência. Salvar rascunho preserva o estado. Próximo processa/valida e avança, respeitando supervisão. Ajuda acessível junto às ações.
- Otimizar literatura apenas acrescenta referências verificáveis, sem substituir tópicos, referências ou associações existentes. Regeneração de tópicos é individual.
- Literatura vazia oferece recuperação clara. Primeiro avanço dos objetivos prepara os tópicos, preservando os existentes em revisitas. Validação informa quantidade/tópico/campo específico e diferencia recomendações de impedimentos.

## Aceite e verificação

Testes locais com dados sintéticos e provedores simulados: escopo por ID, texto/contexto na requisição, persistência antes de IA, falhas/concorrência, preservação de referências, inicialização de literatura, navegação e erros acionáveis. Lint, tipos, suíte, build e UI responsiva conforme recursos disponíveis. Não usar dados de Sérgio como fixture. Sem publicação nesta execução; registrar resultado e limites para revisão.
