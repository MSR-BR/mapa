# C154-v1 — Encaminhamento local ao desenvolvimento

**Autorização recebida:** o responsável respondeu “de acordo” em 27/10/2026 à pergunta sobre aprovar a C154-v1 **para encaminhar a implementação ao projeto de desenvolvimento e revisar o código antes de publicar**. Isso aprova o encaminhamento desta candidata, não autoriza deploy nem qualquer alteração em Ads, GA4, Search Console, consentimento, orçamento ou peça UFF.

## Pedido exato

Na home `https://mapadapesquisa.com.br/`, adicionar **um texto de apoio sob os dois botões do primeiro bloco** (`landing-hero` em `app/page.tsx`, após `landing-actions` e antes de `landing-proof-points`):

> Prepare sua ideia sem login. Para gerar e guardar o mapa, entre com sua conta Google.

Manter o título, a descrição principal, os rótulos e destinos dos botões, os cartões dos modos, os metadados e o restante da página. O CTA principal continua em `/mapa`, **sem UTM interno**. Não criar eventos, conversões ou vínculos novos. A [prévia local](c154-preview.html) é esquemática; usar a interface real do aplicativo para decidir espaçamento, contraste e quebra de linha.

## Contrato de comportamento e revisão

O texto só é verdadeiro se o fluxo público continuar permitindo preparar a ideia sem login e exigindo Google para gerar/guardar. O desenvolvimento deve conferir esse fluxo anônimo antes de propor publicação. Se o comportamento mudou, devolver a cópia para nova decisão, sem ajustar silenciosamente a promessa.

Antes de publicar, o projeto de desenvolvimento deve registrar uma Change própria, ler a documentação da versão instalada do Next.js conforme `AGENTS.md`, produzir o diff exato e uma prévia real em desktop e celular, validar a acessibilidade e o fluxo `/` → `/mapa` anônimo → Google, e apresentar a revisão implementada ao responsável. Esta aprovação textual **não aprova uma revisão de código ainda inexistente**. Publicação exige aceite específico dessa revisão e destino; a revisão visual local da C154 não substitui esse gate. Se houver desvio de promessa ou layout após eventual publicação, o rollback é remover a frase e restaurar a revisão anterior da home.

## Como avaliar depois, se publicada

O [protocolo C154](c154-experimento-entrada.md) define a leitura por pessoas em sequência `first_visit` → `login_success` → `project_start`, com foco inicial em UFF e separação das demais origens. A baseline de 06–26/10 foi 84 → 15 → 6 pessoas UFF; é pequena, concentrada em poucos dias e não demonstra efeito causal. Ler 14 dias completos depois de uma publicação autorizada, excluir dias parciais e fontes QA/equipe etiquetadas, registrar fuso e comparar apenas descritivamente. Guardar falhas e avanço por projeto distinto como verificações separadas; o agregado de avanço continua pendente do desenvolvimento.

**Estado do encaminhamento:** documento persistido no workspace do Mapa para retirada pelo projeto de desenvolvimento. Nenhuma mensagem foi enviada a outra pessoa ou tarefa, e nenhum arquivo do aplicativo foi modificado nesta etapa.
