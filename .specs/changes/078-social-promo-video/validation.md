# Validação

- Inspeção visual da cena gerada, de quadros-chave e da capa final.
- Leitura automatizada do QR Code e comparação exata da URL.
- Inspeção AVFoundation de duração, resolução, frame rate, codec e áudio.
- Verificação de que os textos exatos estão definidos na fonte de composição.
- Hash SHA-256 e manifesto dos artefatos finais.
- `swiftc -typecheck` ou execução validada do gerador.
- `npm run check`, `npm audit --audit-level=moderate`,
  `npm run security:audit` e `git diff --check`.
