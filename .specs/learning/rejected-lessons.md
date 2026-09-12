# Alternativas rejeitadas

- Copiar a chave oculta de Production para `.env.local`.
- Reutilizar a credencial de Production em Preview.
- Manter aliases legados de variável no código ativo.
- Autorizar todos os postinstalls transitivos sem examinar origem e finalidade.
- Executar `npm audit fix --force` sem avaliar compatibilidade.
- Aceitar `status=ok` no health como substituto do smoke funcional autenticado.
