# Lições reutilizáveis

1. Um health de configuração deve ser acompanhado por smoke autenticado que
   percorra o mesmo backend usado pelo produto.
2. Segredos de produção devem ser reconciliados por metadados e identificadores,
   nunca por exportação ou impressão de valores.
3. Entradas de ambiente sobrepostas podem exigir remoção por ID na API do
   provedor, porque a CLI pode não distinguir alvos duplicados.
4. Em Vercel, uma faixa ampla como `>=22` pode selecionar uma versão principal
   mais nova; `22.x` fixa a linha de runtime esperada.
5. Builds limpos e auditoria de dependências fazem parte da evidência de release,
   mesmo quando o deploy anterior parecia saudável.
