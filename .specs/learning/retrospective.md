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

# Retrospectiva — Change 076

## Resultado

Aluno e Orientador voltaram a aparecer explicitamente no menu e no dashboard,
sem reintroduzir troca de papel. A área de trabalho continua contextual e o campo
de orientador permanece exclusivo do Aluno.

## O que funcionou

- Separar identidade, área de trabalho e capacidade visual em um contrato único.
- Usar o E2E de duas contas para provar persistência, isolamento e intercâmbio.
- Preservar menções a estudante quando elas descrevem corretamente o autor do
  projeto revisado.

## O que evitar

- Interpretar a remoção de textos indevidos como remoção do nome do próprio
  perfil.
- Tratar ocultação de controles como substituta de autorização no backend.

# Retrospectiva — Change 078

## Resultado

Foi produzido um pacote promocional vertical de 15 segundos, com narrativa de
impacto, síntese do fluxo, relação Aluno–Orientador, identidade oficial, CTA,
link, QR Code funcional e trilha original.

## O que funcionou

- Limitar a geração de imagem à cena humana e montar conteúdo exato localmente.
- Validar o QR isolado e no quadro final antes de aceitar o MP4.
- Exportar quadros-chave para revisão visual em resolução original.
- Manter o gerador e os hashes junto dos arquivos finais.

## O que evitar

- Aprovar o vídeo somente porque os metadados técnicos estão corretos.
- Pedir a um gerador visual que reproduza logo, texto ou QR Code.
- Usar áudio de origem incerta quando uma trilha simples pode ser sintetizada.
