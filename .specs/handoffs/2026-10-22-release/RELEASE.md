# Publicação consolidada C122–C128 — 22/10/2026

Autorização humana: “execute o que precise e depois cpd limpo”. Substitui a
restrição anterior de não fazer commit/deploy para este conjunto. Ads permanece
encerrado; não há autorização de reativação ou novo gasto. Nenhuma chamada paga.

## Candidato

Versão v22102026.1. C122 já era commit local; C123–C128 integram esta publicação.
O último parecer e os manifests anteriores são históricos. Código das migrations
revisadas mantido integralmente, sem alterar migrations já aplicadas.

Fechamento UX-06: legenda WebVTT e transcrição visível derivadas do áudio real do
MP4 (76,57 s), por faster-whisper small local/CPU, sem envio a API. 19 segmentos,
0–72,20 s, todos sem sobreposição e dentro da duração. Corrigida a grafia “A IA
sugere”. O rascunho antigo de 60 s não é usado. Tempos automáticos aproximados;
não se afirma revisão fonética manual integral. Controles 1×/1,5×/2× preservados.

## Verificações do destino

Vercel CLI oficial 65.1.0 confirmou projeto mapadapesquisa, produção C121 Ready
(dpl_J4ZA34BQ1JQeBqatrrJu7PJzFcfY, releaseCommit ac44539588a72f73bbe16311a1ebd9884d3d91da).
Production branch main; a branch codex/change-003-004 gera preview, não promoção.
ACCOUNT_MODE_SWITCH_ENABLED=true confirmado sem leitura de chaves.
Conector Vercel falhou 404, mas a CLI autenticada funcionou.

Supabase: conector sem permissão; sessão CLI existente não lista o projeto Mapa.
Login do painel encaminhou à verificação de 2FA GitHub. Usuário foi solicitado a
concluir pessoalmente; não contornar autenticação. Nenhuma migration remota ainda.

## Ordem/reversão

Preparar deployment de produção sem promover domínio. Antes de promover,
confirmar ledger/drift/recuperação, orçamento global e vínculos de identidade.
Promover servidor compatível; lembretes falham fechados até RPC nova disponível.
Aplicar, em ordem e parando na primeira falha, as quatro migrations C125/C127.
Verificar catálogo, metadata e smoke sem e-mails ou geração paga.
Preferir correção à frente; não restaurar Next vulnerável nem reabrir aprovações
forjadas. Não apagar mapas, históricos ou contadores.

## Estado

PUBLICATION_STATE: PREPARING. Este registro não confirma deploy ou CPD.
Pó Mágico v20261020.002, checkpoints resume/release; Codex/GPT-6, sem subagentes.

## Validação final

Build Turbopack limpo PASS (22 rotas estáticas); tipos PASS; lint zero erros,
um warning preexistente. Gate estático PASS_WITH_ACCEPTED_RISK. Reutilizados
os testes funcionais/SQL/browser de hashes iguais documentados no parecer final.
Os ajustes finais de legendas/versão passaram lint e novo build; 19 cues válidos.
O primeiro build foi impedido pelo sandbox; após remover apenas o cache temporário
e executar com a permissão local necessária, o build completo passou.

A verificação de whitespace exclui patches/logs históricos e a licença original:
esses artefatos preservam os bytes de origem. Código novo sem whitespace inválido.

## Resultado da execução

Commit funcional **aa781d042ed125fee8f4bb49d2fa67702b3a2a02**, enviado para
origin/codex/change-003-004. C122 incluída no histórico enviado. Nenhum force-push
ou alteração de main. Candidato exportado de git archive sem .env/segredos;
.specs excluída do upload, fontes e adaptador de dependências incluídos.

Configuração pública NEXT_PUBLIC_APP_VERSION de Production atualizada para
v22102026.1. Nenhuma chave ou outra configuração foi modificada.

Deployment **dpl_8Tff91nwcPxs4vyCc6Ex9293TJPR**, produção com `--skip-domain`,
**READY**, sem promover o domínio. URL:
https://mapadapesquisa-otqp0af10-msr-brs-projects.vercel.app
Build remoto aprovado. Health ok/v22102026.1; home e /mapa HTTP200; legenda
HTTP200 com 19 cues; transcrição/link /mapa presentes; sugestões sem login
HTTP401 com mensagem orientativa. Sem geração paga, e-mail ou gravação de mapa.

**PUBLICATION_STATE: STAGED_NOT_PROMOTED. CP e árvore limpa concluídos; D final
pendente do acesso ao banco. Não declarar CPD concluído.** O 2FA GitHub foi
concluído pelo responsável; a sessão MSR-BR autenticada lista cinco outros projetos,
mas não o Mapa. A organização Vercel mostra zero projetos Supabase e o projeto
não está conectado ao Storage Vercel. O identificador público configurado na
produção foi reconfirmado: aeaweherkrqmlqnxsmib. Seu endpoint Auth responde
HTTP401 sem chave (esperado), o que não substitui acesso administrativo/consulta.
Solicitado ao responsável entrar na conta Supabase que contém o Mapa. Não criar
outro banco, trocar URL/chaves, conceder permissões ou promover sem preflight.

A revisão automática rejeitou a tentativa de adiar a verificação 2FA GitHub;
ela não foi contornada. Foi aberto o fluxo normal e o responsável o concluiu.
O conector/CLI com a conta atual seguem sem o projeto Mapa. Nenhuma das quatro
migrations remotas foi aplicada. Ads/GA4/Supabase remoto não foram alterados.

Próximo passo já autorizado: com o acesso correto, conferir ledger, definições,
backup/recuperação, vínculos agregados e monthly_limit_micros=5000000; promover
este deployment compatível e aplicar as quatro migrations revisadas, verificar,
registrar CPD e tag. Caso o código precise mudar, gerar novo candidato verificado.
GA-05/GA-09 e atribuição paga não são declarados validados nem autorizam novo Ads.
