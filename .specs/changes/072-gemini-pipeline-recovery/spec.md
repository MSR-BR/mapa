# Change 072 — Recuperação do pipeline Gemini

**Status:** concluída

## Objetivo

Restaurar as gerações assistidas por IA, inclusive o título final, após a indisponibilidade do modelo Gemini 2.5 Flash para a chave atual.

## Escopo

- substituir o modelo padrão descontinuado por Gemini 3.6 Flash, confirmado na API da conta;
- permitir override server-side por `GEMINI_MODEL`, sem expor configuração no navegador;
- migrar `thinkingBudget`, próprio do Gemini 2.5, para `thinkingLevel` compatível com Gemini 3;
- atualizar o smoke de saída estruturada;
- verificar separadamente a integração de produção do Research Starter.

## Fora de escopo

- não alterar prompts, schemas acadêmicos ou critérios de validação;
- não alterar a navegação, a barra de progresso ou a lógica de avanço das etapas;
- não trocar credenciais nem modificar o projeto externo do Research Starter;
- não mudar automaticamente para modelos posteriores ao Gemini 3.6 Flash.

## Critérios de aceite

1. Nenhuma chamada usa `gemini-2.5-flash` ou `thinkingBudget: 0`.
2. O smoke real retorna o contrato JSON esperado com Gemini 3.6 Flash.
3. O método que gera a matriz metodológica continua solicitando e aceitando o título final produzido pela IA.
4. Lint, typecheck, testes, exportações e build passam sem regressão.
5. A rota autenticada de produção do Research Starter responde com relatório válido sem expor a credencial.

## CPD

- **Check:** smoke real do Gemini, suíte local completa e chamada autenticada do Research Starter em produção.
- **Persist:** manter chaves apenas no servidor e preservar a geração/editabilidade do título final.
- **Deploy/document:** publicar somente após todos os gates e registrar modelo, deployment e evidências sem segredos.
