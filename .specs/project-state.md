# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma.
- Changes concluídas: 001–079 conforme `.specs/roadmap.md`.
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

A Change 079 preservou integralmente a C78 e criou a versão 2 do vídeo
promocional. A nova peça tem gancho em 0,3 segundo, quatro atos, apresentação
mais forte do app, faixa eletrônica profissional gerada, CTA, logo e QR Code
validado. Os dois pacotes permanecem separados em `outputs/social-promo-c78/`
e `outputs/social-promo-c79/`. A aplicação em produção não foi alterada.

## Questões em aberto

Nenhuma. Uma nova Change depende de feedback sobre a versão 2 ou de novo escopo
aprovado.
