# Validação

- `npm run supabase:verify-advisor-student` atualizado.
- Verificadores RLS anônimo e autenticado em ambos os modos.
- Testes de UI/configurações, APIs e Server Actions.
- Cenário duas abas/sessões e versão obsoleta.
- `npm run check`, `npm run security:audit`, `npm audit` e
  `git diff --check`.
- Smokes reais de Gemini e Research Starter sem imprimir credenciais.
- Exportação PDF/DOCX de projetos sintéticos de Aluno e Orientador.
- Supabase migrations + Security/Performance Advisors.
- `vercel domains inspect mapadapesquisa.com.br`, NS, A/CNAME, certificado e
  propagação verificados conforme a estratégia escolhida.
- Deployment READY, domínio canônico 200, HTTPS/HSTS, `/api/health` ok,
  `www` conforme C38 e logs sem erro novo.
- Se qualquer DNS mudar, smoke real de envio e recebimento em
  `suporte@mapadapesquisa.com.br`, MX, SPF, DKIM e DMARC.
- Query final confirma cleanup dos projetos/workflows sintéticos.
