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

# Retrospectiva — Change 079

## Resultado

A versão 1 foi preservada e a peça foi reconstruída como anúncio de resposta
direta: gancho em 0,3 segundo, problema reconhecível, transformação pelo app,
benefícios claros e CTA com QR. A trilha simples foi substituída por uma faixa
eletrônica gerada profissionalmente para publicidade.

## O que funcionou

- Tratar o comentário do usuário como mudança de direção, não ajuste cosmético.
- Avaliar a peça por retenção, hierarquia, transformação e conversão.
- Usar quadro específico de 0,3 segundo para validar o gancho.
- Preservar a versão 1 por hash enquanto a versão 2 usa pacote independente.
- Selecionar música sem voz por descrição comercial e registrar o ID da fonte.

## O que evitar

- Confundir apresentação institucional elegante com anúncio que interrompe o
  scroll.
- Repetir pads sintéticos simples quando ritmo e clímax são parte do pedido.
- Sobrescrever uma versão já entregue durante uma revisão criativa.

# Retrospectiva — Change 080

## Resultado

O pedido de roteiro para NotebookLM foi convertido em um documento durável com
configuração, prompt de personalização, narrativa cronometrada, textos exatos,
fontes necessárias e fronteira clara entre geração e pós-produção.

## O que funcionou

- Usar o formato Brief para concentrar a mensagem promocional.
- Basear afirmações somente nas capacidades já validadas do aplicativo.
- Separar roteiro orientativo de elementos que exigem fidelidade literal.
- Registrar explicitamente que gerar o vídeo é uma etapa futura.

## O que evitar

- Tratar uma duração solicitada como garantia da plataforma generativa.
- Permitir que logo, URL ou QR Code sejam redesenhados pelo modelo.
- Confundir roteiro promocional com autorização para gerar ou publicar o vídeo.

# Retrospectiva — Change 081

## Resultado

O vídeo vertical recebido foi incorporado à landing pública em uma seção própria,
com acesso pelo hero, resumo textual, poster real, player nativo e layout
responsivo. O arquivo foi preservado sem recompressão.

## O que funcionou

- Auditar metadados e hash antes da integração.
- Escolher como poster um quadro final que identifica produto e domínio.
- Evitar autoplay e carregar o MP4 somente por decisão do visitante.
- Manter texto de valor ao lado do player, útil mesmo sem reprodução.
- Testar a presença e a assinatura binária dos dois ativos públicos.

## O que evitar

- Colocar um vídeo de 12 MB no caminho crítico da primeira pintura.
- Usar uma capa genérica que não explique o conteúdo da peça.
- Ocultar controles ou iniciar áudio sem interação.
- Tratar hospedagem direta no repositório como solução definitiva para grande
  escala.

# Retrospectiva — Change 088

## Resultado

O ciclo de modos alternáveis foi homologado com duas contas sintéticas,
persistência após login, conflito de versão, bibliotecas separadas por autoria,
supervisão vinculada, projetos autônomos de Orientador, exportações PDF/DOCX,
integrações e produção saudável. DNS externo e MX foram preservados.

## O que funcionou

- Reescrever o E2E para alternar e restaurar os modos, em vez de depender de
  papéis imutáveis.
- Reproduzir acessos pela Data API e `INSERT ... RETURNING` com clientes
  autenticados reais.
- Validar PDF e DOCX em memória para projetos sintéticos dos dois perfis.
- Isolar cada falha do navegador por camadas até distinguir DOM correto de
  incompatibilidade do harness.
- Manter o gate DNS somente leitura e separado do deploy de aplicação/RLS.
- Conferir a versão pública no health; isso revelou a variável de Production
  desatualizada antes do encerramento.

## O que evitar

- Reclassificar projetos quando o usuário troca de modo.
- Deixar contas sintéticas em outro modo ou manter dados temporários.
- Declarar um clique visual aprovado quando o driver não o concluiu.
- Assumir que um módulo DOCX existente significa rota e interface disponíveis.
- Trocar nameservers por recomendação de provedor sem inventário, autorização e
  janela própria.
- Registrar como release final um deployment cujo health ainda apresenta versão
  antiga.
