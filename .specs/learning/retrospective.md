# Retrospectiva — Change 075

## Resultado

A fronteira de segredo do Research Starter foi reduzida a um único nome,
Production ficou como único ambiente com a credencial e o teste funcional passou
a percorrer a rota autenticada publicada. O build fixou Node.js 22 e expôs
dependências desatualizadas que foram corrigidas antes do encerramento.

## O que funcionou

- Inventariar variáveis por nome e ID evitou qualquer leitura do segredo.
- O smoke aluno → backend → Research Starter provou mais que o health de
  configuração.
- O build sem cache confirmou a versão real do Node e revelou avisos ocultos pelo
  cache local.
- A auditoria de dependências foi resolvida sem `--force` e sem troca de major.

## O que evitar

- Tratar uma variável configurada como prova de credencial válida.
- Copiar segredo oculto de produção para facilitar teste local.
- Usar faixa aberta de Node que permita avanço silencioso de major.
- Aprovar scripts de instalação ou correções de dependência em bloco.
