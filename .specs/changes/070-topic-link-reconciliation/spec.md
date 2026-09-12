# Change 070 — Reconciliação de associações de tópicos

**Status:** concluída

## Objetivo

Corrigir contagens infladas e vínculos órfãos quando versões anteriores do workflow ainda referenciam tópicos que foram substituídos ou removidos.

## Escopo

- considerar somente tópicos existentes no capítulo correto ao exibir associações;
- remover IDs duplicados ou inexistentes das linhas metodológicas;
- normalizar detalhes de tópicos antes de salvar metodologia ou montar o mapa final;
- preservar tópicos existentes, referências e demais dados válidos.

## Critérios de aceite

1. Uma linha com um tópico real e um ID órfão exibe “1 tópico associado”.
2. O próximo salvamento remove o ID órfão da persistência.
3. O mapa final ignora links órfãos sem eliminar tópicos válidos.
4. Duplicidades em `associatedTopicIds` são removidas.

## CPD

- **Check:** lint, typecheck, testes, exportação e build.
- **Persist:** o próximo carregamento/salvamento reconcilia associações antigas.
- **Deploy/document:** produção, health check e evidência de fechamento.
