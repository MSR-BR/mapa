# Change 037 — Revisão legal e autorização do responsável

**Estado:** Concluída em 21/08/2026.

## Objetivo

Obter a revisão humana e registrar a autorização do professor responsável antes
de considerar os textos legais, créditos, logo e dados biográficos definitivos.

## Submudanças

1. Revisar Termos de Uso, incluindo responsabilidade do usuário, apoio do
   orientador, IA, Research Starter, referências e recebimento de e-mails.
2. Revisar Política de Privacidade, incluindo dados coletados, finalidades,
   retenção, provedores, direitos do titular e suporte.
3. Confirmar que o aceite é registrado por versão, usuário e data para aluno e
   orientador.
4. Confirmar autorização formal para o uso do logo da UFF e definir o arquivo
   institucional aprovado e seu texto alternativo.
5. Confirmar autorização dos nomes, e-mails, departamentos, links pessoais e
   demais dados apresentados em Créditos.
6. Registrar responsável pela aprovação, data e versão final dos documentos.

## Critérios de aceite

- A versão publicada dos documentos tem revisão de produto registrada; esta
  revisão não constitui parecer jurídico.
- Os termos exibidos para aluno e orientador são coerentes com suas ações.
- O professor responsável pelo projeto confirmou a autorização de uso da
  identificação institucional da UFF, dos créditos e dos dados biográficos
  nesta Change. Não há documento institucional adicional pendente para o piloto
  ou para a publicação atual.
- Links e e-mails de contato são clicáveis, corretos e acessíveis.

## Registro de implementação

- `LEGAL_TERMS_VERSION` foi atualizado para `1.1.0`.
- Termos e privacidade agora descrevem responsabilidade humana, apoio do
  orientador, Research Starter, provedores técnicos, analytics, notificações,
  retenção, exclusão e direitos do titular.
- O aceite diferencia o contexto de estudante e orientador e continua sendo
  salvo por `user_id`, `profile_role`, versão e data; uma nova versão exige
  novo aceite para o papel ativo.
- Créditos foram reduzidos a “Créditos”, com links rotulados para e-mail e
  páginas pessoais. O contato `suporte@mapadapesquisa.com.br` permanece
  clicável.
- O modal fecha por clique fora ou `Escape`, possui título associado e mostra
  o logotipo horizontal oficial da UFF, obtido da página institucional de
  identidade visual, com texto alternativo acessível.
- O rodapé foi atualizado para `v20082026.4`.

Fonte do ativo institucional: [Identidade visual da UFF](https://www.uff.br/scs/identidade-visual/), arquivo PNG horizontal azul com fundo transparente.

## Registro de autorização

- Responsável: Mario Reis, professor da Universidade Federal Fluminense (UFF).
- Confirmação: 21/08/2026.
- Escopo: Termos de Uso, Política de Privacidade, créditos, dados biográficos,
  identificação visual da UFF e publicação do aplicativo/landing page.
