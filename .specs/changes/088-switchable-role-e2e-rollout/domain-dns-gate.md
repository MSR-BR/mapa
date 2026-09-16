# Gate de domínio e DNS

## Evidência recebida

- Fonte: PDF `Universidade Federal Fluminense Mail - Complete your domain setup
  for mapadapesquisa.com.br.pdf`.
- SHA-256:
  `41716607ae6556f802d70b69392b9cc4f4c5cd2f85a13fd422da7916a620a6eb`.
- O PDF foi gerado em 16/09/2026 a partir de mensagem da Vercel enviada em
  15/09/2026 às 13:00.
- A mensagem informa que `mapadapesquisa.com.br` já está configurado na Vercel,
  mas os nameservers permanecem em outro provedor e o DNS é administrado
  separadamente.
- A Vercel apresenta duas alternativas: continuar com registros A/CNAME no
  provedor externo ou delegar os nameservers. Para delegação, a mensagem lista
  `ns1.vercel-dns.com` e `ns2.vercel-dns.com` e informa propagação de até
  48 horas.
- A mensagem é evidência e recomendação operacional; não autoriza alteração de
  registrar, nameservers, zona DNS ou produção.

## Verificação somente leitura em 16/09/2026

- `dig +short NS mapadapesquisa.com.br` retornou `d.sec.dns.br` e
  `e.sec.dns.br`.
- `dig +short A mapadapesquisa.com.br` retornou `76.76.21.21`.
- `curl -I https://mapadapesquisa.com.br` retornou HTTP 200, servidor Vercel,
  HTTPS e HSTS.
- `www.mapadapesquisa.com.br` continua sem CNAME, coerente com a decisão da
  Change 038 de manter somente o domínio raiz.

Conclusão: hosting, domínio raiz e SSL estão funcionais com DNS externo. Essa
situação não bloqueia as Changes 083–087.

## Decisão obrigatória antes da C88

Escolher e registrar uma destas estratégias:

### A. Manter DNS externo

- Manter os nameservers atuais.
- Usar `vercel domains inspect mapadapesquisa.com.br` para obter os registros
  exatos exigidos pelo projeto.
- Administrar A/CNAME e demais registros no provedor atual.
- Verificar domínio, certificado, redirecionamentos e e-mail antes e depois do
  rollout.

### B. Delegar DNS à Vercel

- Exigir autorização explícita do responsável pelo domínio.
- Confirmar no dashboard/`vercel domains inspect` os nameservers vigentes; não
  executar a troca confiando apenas no e-mail arquivado.
- Exportar ou inventariar previamente toda a zona: A, AAAA, CNAME, MX, TXT, CAA,
  SRV, DNSSEC/DS, subdomínios e verificações de terceiros.
- Recriar e validar na Vercel todos os registros que precisam ser preservados,
  especialmente MX, SPF, DKIM e DMARC usados pelo e-mail e pelo fluxo
  `suporte@mapadapesquisa.com.br`/Resend.
- Trocar os nameservers no registrador em janela própria, separada da ativação
  das novas policies/RPC, e observar a propagação por até 48 horas.
- Manter plano de rollback com provedor anterior, zona exportada, responsáveis e
  critérios objetivos de retorno.

Se não houver decisão explícita, a opção conservadora é manter o DNS externo já
funcional. A C88 não pode alterar nameservers automaticamente.

## Gate de saída

- Estratégia A ou B aprovada e registrada.
- Domínio atribuído ao projeto correto e `vercel domains inspect` sem pendência.
- NS, A/CNAME, HTTPS, certificado, HSTS, domínio canônico e `/api/health`
  verificados.
- `www` permanece deliberadamente não publicado, salvo nova Change.
- Envio e recebimento de `suporte@mapadapesquisa.com.br`, MX e autenticações de
  e-mail testados caso qualquer registro DNS seja alterado.
- Nenhum cutover DNS ocorre na mesma janela das migrations/RLS de perfil.
- Evidências, horário, propagação, responsável e recuperação registrados no CPD.
