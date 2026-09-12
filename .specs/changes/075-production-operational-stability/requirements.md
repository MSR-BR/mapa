# Requisitos

- Usar somente `RESEARCH_STARTER_MAPA_API_KEY` no código ativo e na produção.
- Não puxar, imprimir, registrar ou versionar o segredo de produção.
- Remover a credencial local legada inválida sem expor seu valor.
- Validar o Research Starter pelo endpoint autenticado do aplicativo publicado.
- Manter a credencial de produção restrita ao ambiente Production.
- Fixar o runtime da Vercel em Node.js `22.x`.
- Tratar explicitamente os scripts de instalação transitivos após auditoria.
- Corrigir vulnerabilidades de dependências encontradas no gate, sem atualização
  destrutiva de versão principal nem `npm audit fix --force`.
- Não alterar dados acadêmicos, perfis, RLS ou schema do banco.
- Preservar os gates existentes de lint, tipos, testes, exportação e build.
