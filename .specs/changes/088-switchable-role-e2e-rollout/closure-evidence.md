# Evidências de encerramento — Change 088

**Status:** concluída em 17/09/2026.

## Resultado

A troca reversível entre os modos Aluno e Orientador foi homologada em produção
com duas contas sintéticas. O modo permanece no banco entre logins, cada
biblioteca respeita o `authoring_role` imutável e o Orientador mantém seus
projetos próprios autônomos enquanto revisa projetos estudantis somente quando
há vínculo.

O fechamento também reativou a exportação Word já existente no código. PDF e
DOCX agora aparecem na interface, passam pelo mesmo controle de proprietário e
estado do workflow e foram gerados com assinaturas válidas para projetos
sintéticos de Aluno e Orientador.

## Matriz de validação

- `npm run check`: lint, typecheck, 119/119 testes, PDF/DOCX e build Next.js
  16.3.5 aprovados.
- `npm run security:audit`: 543 arquivos inspecionados; nenhum segredo,
  exposição de rota ou regressão crítica.
- `npm audit --omit=dev`: zero vulnerabilidades.
- `npm run supabase:verify-advisor-student`: duas contas, troca
  Aluno→Orientador→Aluno, persistência após novo login, versão obsoleta negada,
  UPDATE direto do perfil negado, bibliotecas isoladas, criação própria,
  vínculo, correção, sete aprovações, conclusão, referências, exportação nos
  dois formatos e cleanup aprovados.
- Exportações no E2E: Aluno — DOCX 11.900 bytes e PDF 426.794 bytes;
  Orientador — DOCX 11.893 bytes e PDF 426.794 bytes.
- RLS remota consciente do modo: 15 verificações aprovadas.
- RLS autenticada entre proprietários: seis verificações aprovadas.
- RLS anônima e matriz local PostgreSQL 17: aprovadas.
- Gemini: `gemini-3.6-flash` retornou o schema estruturado esperado.
- Research Starter em produção: HTTP 200, três referências e resposta válida.
- Security Advisors: zero erros e quatro avisos já classificados na C87.
- Performance Advisors: zero erros e três avisos esperados já classificados na
  C87. A C88 não alterou schema, grants ou policies.

## Interface e concorrência

O Chrome headless confirmou dois logins, duas sessões, abertura da segunda aba,
HTTP 200 e o dashboard correto do Aluno. O driver temporário não conseguiu
acionar um card React já presente no DOM; portanto, esse clique não é registrado
como aprovado. A cobertura de interação/sincronização foi completada por testes
de componente e contrato, enquanto a versão obsoleta foi recusada pela RPC real
e o E2E remoto confirmou que nenhuma gravação indevida ocorreu.

A sessão autenticada da C87 já havia confirmado visualmente o seletor
`Aluno/Orientador` em produção. Nenhum erro 5xx ou defeito de produto foi
observado nessa investigação do harness.

## Domínio, DNS e e-mail

Foi adotada a estratégia A: manter DNS externo. Nenhum nameserver ou registro
foi alterado.

- NS: `d.sec.dns.br` e `e.sec.dns.br`.
- A do domínio raiz: `76.76.21.21`.
- MX preservado: `10 inbound-smtp.sa-east-1.amazonaws.com`.
- Domínio raiz: HTTP/2 200, Vercel, HTTPS e HSTS.
- `www`: deliberadamente ausente conforme C38.
- Como não houve mudança DNS, o teste destrutivo/operacional de envio e
  recebimento não foi repetido nesta janela. O fluxo de suporte permanece
  coberto pela C34.
- SPF/DMARC não foram encontrados no preflight somente leitura; isso fica como
  observação de segurança de e-mail, não como motivo para uma alteração DNS sem
  Change e autorização próprias.

## Produção e CPD

- Commit funcional: `c8bdc4e`.
- Versão pública: `v17092026.1`.
- Deployment final: `dpl_FRVTWXQUpRtJBbUEotEmWV9TEtjp` — READY.
- Artefato:
  `https://mapadapesquisa-657e4u42u-msr-brs-projects.vercel.app`.
- Alias canônico: `https://mapadapesquisa.com.br`.
- `/api/health`: `status=ok`, versão correta e Supabase, Gemini, Research
  Starter e Resend como `configured`.
- Rota DOCX sem sessão retorna 401 e `Cache-Control: private, no-store`.
- Consulta de logs de erro dos 15 minutos pós-rollout não encontrou registros.
- Nenhum dado temporário de projeto/workflow permaneceu após o E2E.

## Roll-forward

A recuperação permanece em camadas: desativar a flag para impedir novas trocas
sem desfazer o schema; corrigir policies apenas por migration aditiva; preservar
autoria e dados existentes; tratar DNS em janela independente. Nenhum rollback
foi necessário.
