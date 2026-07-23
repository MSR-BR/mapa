# Change 008 — Login com Google

Status: concluída em 23/07/2026.

## Objetivo

Preservar o acesso por e-mail e senha e oferecer autenticação Google pelo Supabase Auth.

## Requisitos

- O login por e-mail e senha permanece disponível e usa mensagem genérica para credenciais inválidas.
- A tela de login oferece “Continuar com Google”.
- O OAuth usa o provedor `google` exclusivamente no backend.
- O retorno passa pelo callback PKCE existente e preserva apenas destinos internos seguros.
- A URL de retorno em produção é `https://mapa-gray-two.vercel.app/auth/callback`.
- O botão Google só é considerado funcional quando o provedor estiver habilitado no Supabase e o cliente OAuth estiver configurado no Google Cloud.
- Enquanto essa configuração externa não estiver completa, `GOOGLE_AUTH_ENABLED` mantém o botão oculto para evitar um fluxo quebrado.

## Critérios de aceite

- [x] Logs reais confirmam login por e-mail com status 200 em produção.
- [x] A ação Google gera a URL OAuth pelo SDK oficial do Supabase.
- [x] Callback troca o código por sessão e rejeita destinos externos.
- [x] Provedor Google habilitado no Supabase.
- [x] Jornada Google concluída em produção com uma conta real e retorno ao dashboard.
- [x] Quality gate e deploy aprovados.
