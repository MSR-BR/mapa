# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma.
- Changes concluídas: 001–076 conforme `.specs/roadmap.md`.
- Changes pendentes: nenhuma.

## Decisões-chave

- Aplicação Next.js publicada na Vercel em `https://mapadapesquisa.com.br`.
- Supabase é responsável por banco e autenticação; RLS protege os dados.
- Gemini e Research Starter são acessados somente pelo backend.
- `RESEARCH_STARTER_MAPA_API_KEY` é o único nome aceito para a credencial do
  Research Starter e permanece restrito ao backend de Production.
- O papel inicial da conta é permanente.
- Avisos acadêmicos orientam sem bloquear; integridade técnica continua
  obrigatória.
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.

## Estado validado mais recente

A Change 076 restaurou a identificação explícita de Aluno e Orientador sem
reintroduzir troca de papel. O contrato contextual mantém o campo de orientador
exclusivo do Aluno; o E2E com duas contas confirmou persistência, isolamento,
vínculo, comentários, correções, aprovações e conclusão. Next.js 16.3.5, 92
testes, exportação e build passaram. O deployment
`dpl_AsVvML65fECUU2XfhCGaFN4anYGd` está READY no domínio canônico.

## Questões em aberto

Nenhuma. Uma nova Change depende de feedback real, incidente ou novo escopo
aprovado.
