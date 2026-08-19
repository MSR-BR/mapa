# Change 031 — Recuperação do callback Google

Status: concluída

## Diagnóstico

Quando o redirect `https://mapadapesquisa.com.br/auth/callback` não está na
lista de URLs permitidas do Supabase Auth, o provedor pode retornar o código
OAuth para a Site URL (`/`). A página inicial ignorava esse código e o usuário
parecia voltar deslogado.

## Implementação

- A raiz encaminha códigos OAuth recebidos ao Route Handler de callback, que
  troca o código por sessão e envia o usuário para o dashboard com `resume=1`,
  preservando o rascunho local.
- O callback oficial mantém o destino seguro e identifica falhas como erro de
  autenticação Google.
- A configuração recomendada continua sendo:
  - Site URL: `https://mapadapesquisa.com.br`
  - Redirect URL adicional: `https://mapadapesquisa.com.br/auth/callback`

## Critérios de aceite

1. Google retorna à sessão autenticada mesmo se o código chegar na raiz;
2. o destino do mapa continua sendo o dashboard;
3. falha no exchange não apaga o rascunho;
4. testes, build e smoke de produção passam.
