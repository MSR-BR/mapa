# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma.
- Changes concluídas: 001–081 conforme `.specs/roadmap.md`.
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

A Change 081 incorporou o vídeo fornecido à landing pública logo após o hero e
adicionou acesso direto pelo botão secundário. O player usa controles nativos,
`playsInline`, dimensões declaradas, poster real e carregamento sob demanda. O
MP4 público preserva o hash do original; o layout foi preparado para desktop e
celular. A aplicação em produção ainda não foi publicada com essa mudança.

## Questões em aberto

Nenhuma no escopo atual. A publicação da Change 081 depende de uma solicitação
posterior de CPD.
