# C119 — Recuperação e diagnóstico da metodologia

Autorizada pelo responsável em 15/10/2026: “pode continuar investigando e resolver esses dois erros da metodologia. faça o que for preciso e cpd limpo ao final”. Execução inclui implementação, testes, commit, push e publicação.

## Escopo

Investigar os dois eventos methodology/provider_invalid_response de 14/10 sem presumir que representem dois defeitos distintos ou falha do provedor. Reproduzir falhas no percurso formulário → rota → persistência → resposta, corrigir bloqueios demonstráveis e distinguir conflitos, validação, rede, cancelamento, IA e persistência sem conteúdo privado nos diagnósticos.

- Recuperação acionável quando o contexto de um rascunho ficou antigo; preservar a revisão explícita e a aprovação do orientador.
- Salvamento de rascunho e retorno continuam possíveis quando pré-requisitos precisam de revisão.
- Falha secundária ao sincronizar o título não apresenta uma metodologia já confirmada como fracasso nem impede o avanço; aviso explícito e diagnóstico sanitizado.
- Erros de persistência deixam de ser confundidos com conflito de outra aba. Falhas não apagam texto nem provocam repetição automática de IA.
- UI e eventos classificam o erro real conhecido, sem supor erro de IA. Código de versão, operação e status somente em formato controlado.

## Aceite

Testes de regressão para contexto antigo, conflito real, falha do banco, atualização secundária do título, autorização/orientador, rede/resposta inválida/cancelamento e preservação de conteúdo. Verificar UI de recuperação e avanço com serviços sintéticos, lint, tipos, testes gerais, segurança e build. Publicar o commit validado no projeto mapadapesquisa e conferir domínio, versão e negações de acesso.

## Limites de evidência

Consulta Vercel histórica de 14/10 recusada pelo conector (403) e pela CLI (400). Consulta Supabase agregada recusada por permissão; nenhum dado de projeto retornado. Portanto o vínculo causal entre falhas reproduzidas e os dois eventos históricos permanece não confirmado. Correções serão identificadas pela reprodução, sem atribuição inventada.

Sem mudança de modelo, orçamento, chaves, permissões, esquema ou campanha Ads. Preservar e versionar separadamente os documentos pendentes C109/C110. Sem nova chamada paga de IA necessária para os testes.
