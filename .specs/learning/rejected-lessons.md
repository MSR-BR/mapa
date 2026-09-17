# Alternativas rejeitadas

- Copiar a chave oculta de Production para `.env.local`.
- Reutilizar a credencial de Production em Preview.
- Manter aliases legados de variável no código ativo.
- Autorizar todos os postinstalls transitivos sem examinar origem e finalidade.
- Executar `npm audit fix --force` sem avaliar compatibilidade.
- Aceitar `status=ok` no health como substituto do smoke funcional autenticado.

- Tratar timeout de driver headless como bug do aplicativo sem isolar DOM, sessão,
  API e banco.
- Declarar sincronização visual aprovada quando apenas o contrato foi testado.
- Expor DOCX porque o gerador existe, sem rota, UI e validação binária.
- Alterar nameservers para “completar” uma configuração já funcional sem
  autorização e inventário da zona.
- Encerrar um release com versão de health sobrescrita por ambiente antigo.
