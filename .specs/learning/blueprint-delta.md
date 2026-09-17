# Delta proposto para o blueprint

## Operação de segredos

Adicionar ao gate de release a reconciliação de variáveis por nome, alvo e ID,
com proibição explícita de exportar segredos ocultos para produzir evidência.

## Runtime e dependências

Exigir que a versão efetiva do runtime seja confirmada no log de um build limpo,
além da declaração no manifesto. Registrar também auditoria de dependências e
decisão explícita sobre scripts de instalação antes do deploy final.

## Integrações externas

Diferenciar três níveis de prova: configurado, autenticado e funcional. Para o
encerramento, integrações críticas precisam de smoke funcional pelo caminho real
do produto.

## Identidade e capacidades por perfil

Separar no blueprint o nome persistente do perfil, a área de trabalho e as
capacidades visuais. A interface deve identificar explicitamente Aluno ou
Orientador, derivar controles de um contrato por papel e manter autorização
independente no servidor e no banco.

## Produção criativa promocional

Adicionar um contrato próprio para peças audiovisuais: brief e storyboard antes
da geração; conteúdo aberto separado de marca e texto exatos; QR Code validado
dentro do quadro final; trilha com proveniência; inspeção visual de quadros-chave;
metadados, hashes e arquivos de publicação registrados no encerramento.

Para revisões, exigir também preservação verificável da versão anterior e uma
auditoria de eficácia publicitária: interrupção no primeiro segundo, papel do
produto na transformação, hierarquia da promessa, progressão sonora e força do
CTA. Música deve ser avaliada como parte da narrativa, com fonte identificada.

## Plataformas audiovisuais fundamentadas em fontes

Quando a entrega for preparada para NotebookLM ou ferramenta equivalente,
registrar separadamente: seleção de fontes, prompt de personalização, roteiro
canônico, conteúdo exato e etapa de pós-produção. A saída generativa não deve ser
aceita como reprodução confiável de marca, textos, domínio ou QR Code.

Ao incorporar a peça em uma landing page, exigir dimensões reservadas, poster
derivado de conteúdo aprovado, controles acessíveis, reprodução sem autoplay de
áudio, carregamento compatível com a posição da mídia na página e verificação
responsiva. Arquivos grandes podem começar em hospedagem própria, mas devem ter
um gatilho documentado de migração para CDN ou streaming adaptativo.

## Modos alternáveis, formatos e gates de infraestrutura

Em apps com uma conta que pode operar em mais de um modo, modelar e testar
separadamente:

- identidade estável da conta;
- modo ativo versionado e persistente;
- autoria imutável de cada recurso;
- relação temporária ou vinculada de colaboração;
- consentimento específico por modo.

O fechamento deve exercitar transições reversíveis com contas sintéticas, duas
sessões ou abas, versão obsoleta, acesso direto à API/RLS e cleanup garantido.
Falhas de automação visual devem ser diagnosticadas em camadas e registradas
como cobertura parcial quando apropriado; não podem ser convertidas em sucesso
nem em defeito de produto sem evidência.

Formatos exportáveis exigem prova completa: controle visível, rota autorizada,
estado permitido, cabeçalhos privados e assinatura binária. Um gerador não
referenciado pela rota é código disponível, não uma feature entregue.

Mudanças de domínio/DNS não devem ser acopladas a migrations, autorização ou
feature flags. Na ausência de autorização explícita, manter a configuração
externa funcional, verificar somente leitura NS/A/CNAME/MX/TXT/SSL e exigir
smoke de e-mail apenas se a zona efetivamente mudar.

A versão exibida pelo health deve corresponder ao commit/deployment final.
Overrides de ambiente públicos fazem parte da reconciliação de release.
