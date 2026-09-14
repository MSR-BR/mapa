# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma.
- Changes concluídas: 001–082 conforme `.specs/roadmap.md`.
- Changes pendentes: 083–088, aguardando aprovação e execução sequencial.

## Decisões-chave

- Aplicação Next.js publicada na Vercel em `https://mapadapesquisa.com.br`.
- Supabase é responsável por banco e autenticação; RLS protege os dados.
- Gemini e Research Starter são acessados somente pelo backend.
- `RESEARCH_STARTER_MAPA_API_KEY` é o único nome aceito para a credencial do
  Research Starter e permanece restrito ao backend de Production.
- Em produção, o papel inicial da conta ainda é permanente até a conclusão da C88.
- O estado-alvo aprovado para planejamento permite escolher Aluno ou Orientador
  na mesma conta; banco, servidor, interface e RLS devem aplicar o mesmo modo.
- O modo ativo será persistido no banco, versionado e trocado apenas por RPC;
  JWT, metadata e armazenamento local não serão fontes de autorização.
- No estado-alvo, Aluno terá somente construção própria e Orientador somente
  revisão vinculada; trocar o modo nunca altera propriedade ou conteúdo.
- Avisos acadêmicos orientam sem bloquear; integridade técnica continua
  obrigatória.
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.

## Estado validado mais recente

A Change 082 concluiu somente a auditoria e o planejamento de modos alternáveis.
Foram identificadas dependências do contrato imutável, lacunas de autorização e
RLS, definida a arquitetura-alvo e criadas as Changes 083–088. Nenhum código de
produto, migration, dado, ambiente ou deployment foi alterado; o último estado
funcional publicado continua sendo a C81 no deployment
`dpl_G8kNnBN9DayztcX1VM3U9EbuwUUU`.

## Questões em aberto

- Aprovação explícita para iniciar a Change 083.
- O conector Supabase recusou consultas somente leitura por falta de permissão;
  o preflight remoto deve ser concluído antes de qualquer DDL da C83.
