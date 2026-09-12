# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma.
- Changes concluídas: 001–075 conforme `.specs/roadmap.md`.
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

A Change 075 encerrou a estabilização operacional: variável canônica do Research
Starter somente em Production, smoke autenticado com HTTP 200 e três referências,
Node.js 22.x, Next.js 16.3.5, 90 testes, exportação, build, scanner de segurança e
`npm audit` sem vulnerabilidades conhecidas. O deployment final
`dpl_A96gpBn81Z4Rfu5tqDxoRpYKACZi` está READY no domínio canônico.

## Questões em aberto

Nenhuma questão funcional conhecida. Novas Changes dependerão de feedback real,
incidente ou novo escopo aprovado.
