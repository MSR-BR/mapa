# Riscos e controles

- **Remoção prematura da variável:** manter a chave canônica e validar o caminho
  publicado antes e depois do novo deployment.
- **Exposição de segredo:** não usar `env pull`, não imprimir valores e manter
  toda evidência sanitizada.
- **Preview sem Research Starter:** decisão intencional; uma futura credencial
  exclusiva de Preview poderá ser adicionada sem reutilizar a de produção.
- **Script de instalação necessário em outra plataforma:** validar instalação,
  lint e build; reavaliar a negação apenas com falha reproduzível.
- **Atualização de major do Node:** impedir por `22.x`.
- **Correção de dependências:** manter Next.js e ESLint Config alinhados, testar
  lint, tipos, suíte completa, exportação, build e produção após a atualização.
