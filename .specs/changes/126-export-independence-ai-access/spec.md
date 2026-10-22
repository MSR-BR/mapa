# C126 — Ordem 5: exportação independente da IA e acesso às sugestões

- Autorização: “segue” e decisões humanas de 22/10/2026: login **no app**
  autorizado; login/credencial de API pelo aluno rejeitado; “melhor não colocar
  limite” em resposta à proposta de cota diária. Não foi criada cota diária.
- Estado: `IMPLEMENTED_LOCAL`, `NEEDS_REVIEW`, `PUBLICATION_STATE: NOT_REQUESTED`.
- Base: HEAD `7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`, árvore já contendo
  C123/C124/C125. Snapshot incremental anterior à C126; nenhuma dessas Changes
  foi descartada. Sem commit/push/deploy, serviços remotos, chamadas pagas,
  alteração de modelos, provedores, valores de chaves ou ambientes.

## Exportações EX-01/02

- GET PDF/Word não exige reformulação do briefing nem faz chamadas de IA/escritas.
  O relatório mantém os originais e usa o texto substituto já existente quando
  não há reformulação. A informação aparece também na interface.
- Revisão pendente do orientador continua protegida: as duas ações de escrita
  `prepare_export` e `save_export_review` retornam 409 `advisor_pending` antes
  de gerar ou salvar. O download como rascunho identificado continua permitido;
  a aprovação obrigatória e o gate de versão concluída não foram removidos.
- Primeiro salvamento manual dos cinco campos não exige geração anterior.
  Botões explícitos separam salvar reformulação e sugerir com IA (opcional).
  Download usa somente conteúdo salvo; edições não salvas geram confirmação e
  permanecem na página. Falha de salvar/IA não apaga o rascunho em memória.
- Não altera o briefing original, referências, unidades acadêmicas ou pareceres.

## Unicode EX-03

DejaVu Sans regular/negrito/oblíquo incorporada em ambos os renderizadores PDF.
Arquivos originais do runtime LibreOffice, licença Bitstream/Arev redistribuível
preservada e origem/hashes em `assets/fonts/dejavu/README.md`.
`outputFileTracingIncludes` inclui fontes e licença na rota de exportação;
trace do build conferido. Cores, margens, hierarquia, conteúdo e registro CBL
preservados; métricas da fonte podem alterar quebras de linha/página.
Teste exato: `α≥β → Ω ✓ łódź ğ ş ≠ ∑`, incluindo capa negrita/oblíqua e corpo.
Não se promete cobertura de todos os sistemas de escrita/emoji.

## Custo SEC-02/06, AI-04/05 — decisão aplicada

- `/api/prompt-suggestions` verifica claims assinadas da sessão do Mapa. Rejeita
  visitante, erro de autenticação e sessão anônima Supabase antes do provedor.
  Aluno não precisa de chave ou login no Google AI/OpenAI.
- Tela pública usa sugestões locais sem chamar a rota; tela autenticada pode
  refinar por IA. Erro de sessão, orçamento ou provedor mantém o texto e as
  sugestões locais, com mensagem clara.
- Toda tentativa em `generateStructured`, inclusive Gemini primário, passa pelo
  contador durável `reserve_ai_budget` já existente, antes do transporte.
  Não modifica o valor autorizado de US$ 5/mês nem lê sua configuração remota.
  Reservas conservadoras não são reembolsadas após timeout e podem suspender
  IA antes de a fatura atingir US$ 5. Não contabiliza retroativamente chamadas
  primárias antigas que não passavam pelo contador.
- Sem migration nova, cota diária ou mudança de limite/ambiente. Proteção curta
  preexistente de 15 requisições/minuto por chave de cliente permanece; não é
  cota diária durável. Um usuário ainda pode consumir o saldo mensal global:
  SEC-06/AI-04 fica como risco residual aceito na decisão de produto, não corrigido
  por uma cota que o responsável rejeitou.
- Esgotamento do saldo impede novas gerações pagas; não constitui acesso ilimitado
  à IA. Editar/salvar conteúdo existente e baixar o relatório não dependem dessas
  gerações. Gerar um mapa novo ainda depende de IA disponível.

## Método e fontes

APP / AI SYSTEM / DATA / REPORT, perfil S3. Pó Mágico v20261020.002, local/remoto
`81e3cbef9fc2b5b29074297490351f681ed16b47` conferidos nesta sessão em 22/10.
Checkpoints start/classification/phase/Change/delivery; delta: distinguir geração
opcional de download e custo global de cota diária. Codex/GPT-6; variante/esforço
não expostos. Sem subagentes ou alterações no archive central.
Skills: Pó Mágico, PDF, Supabase, revisão React e auditoria de segurança local.
Guias instalados Next 16.3.8 de Route Handlers/output tracing lidos.
Docs públicas Supabase SSR/getClaims e changelog consultados, sem acesso a conta;
nenhum ajuste TLS/SDK necessário para reutilizar o método existente.
Licença oficial: https://dejavu-fonts.github.io/License.html

[Validação](validation-2026-10-22.md) · [Plano de revisão](review-plan.md) ·
[Diff incremental](local-changes.patch) · [Manifesto de arquivos](files.json).
