# Publicação consolidada C122–C128 — 22/10/2026

**Estado final: PUBLICADO.** A conclusão abaixo supera os estados intermediários
de preparação e bloqueio de acesso registrados neste documento.

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

## Conclusão após acesso correto — 22/10/2026

PUBLICATION_STATE: PUBLISHED. RELEASE_GATE: PASS_WITH_ACCEPTED_RISK.

O responsável concluiu o login na conta que contém mapa-da-pesquisa,
ref aeaweherkrqmlqnxsmib, AI Agent MSR-BR's Org. Preflight remoto confirmou
21 migrations até C112, nenhuma das quatro candidatas aplicada; limite global
5000000 micros (US$5/mês) e zero vínculos de orientador incompatíveis na consulta
agregada de e-mail confirmado/identidade Google correspondente. Nenhum endereço,
texto acadêmico, chave ou valor de credencial foi extraído.

As três funções substituídas coincidiram, normalizando comentários/espaços,
com as últimas definições do repositório (C087/C111). ACLs, policies, triggers,
colunas e bucket foram capturados antes da mudança no artefato local restrito:
`/Users/marioreis/.codex/visualizations/2026/10/06/01a10eda-341c-76b1-a181-beefcd7013ef/release-2026-10-22/schema-before.json`.
O plano Free não disponibiliza backups gerenciados: esse snapshot permite preparar
compensação de definições, não é backup completo de dados/PITR. As quatro migrations
são transacionais e não apagam mapas, textos, históricos nem anexos. Recuperação
preferida é correção à frente; eventual compensação que reabra falhas exige revisão
separada. Não foi comprada retenção ou feito dump de conteúdo privado.

Deployment existente dpl_8Tff91nwcPxs4vyCc6Ex9293TJPR promovido pela CLI oficial,
com confirmação de sucesso. https://mapadapesquisa.com.br/api/health respondeu
HTTP200, status ok e **v22102026.1**. A promoção antecedeu as migrations; durante
a janela a nova rota de lembretes falhava fechada até a RPC existir. O health
confirma configuração/versão, não disponibilidade dos provedores de IA.

Migrations aplicadas individualmente, em ordem, pelo SQL Editor autenticado:

1. 20261022183455_c125_workflow_owner_guard
2. 20261022183456_c125_verified_google_advisor
3. 20261022183508_c125_bug_report_intake_guard
4. 20261022213449_c127_advisor_reminder_guard

Cada transação incluiu o registro correspondente no ledger, com o SQL original
inteiro em statements[1], sem modificar o arquivo aprovado. Texto colado conferido
integralmente antes de cada execução; cada resultado retornou a versão esperada.
O ledger final tem 25 migrations. MD5 dos quatro SQLs armazenados e dos corpos das
seis funções em produção coincidem byte a byte com os arquivos do commit funcional;
SHA256 dos arquivos/payloads registrados em evidence/migration-manifest.json.

Pós-verificação: dois triggers habilitados; DELETE direto de workflow negado;
INSERT de campos administrativos de relatos negado, campos de intake permitidos;
bucket privado, 5 MiB e apenas PNG/JPEG/WebP. RPC de lembretes executável somente
por authenticated entre os papéis de API; tabelas de contadores privadas/RLS e
sem privilégios de anon/authenticated/service_role. RPC sem sessão retorna
allowed=false/auth_required antes de reservar ou escrever. Teto de IA permanece US$5.

Smoke canônico: home, /mapa, health e VTT HTTP200; 19 cues, transcrição e CTA
presentes; prompt-suggestions e rota de lembretes sem login HTTP401. Navegador
confirmou versão pública e transcrição expansível. Evidências JSON em evidence/.
Não houve nova geração paga, envio real de e-mail ou teste com conteúdo de alunos.
Os testes sintéticos de múltiplos usuários/concorrência/exportação são os locais
já registrados e vinculados ao mesmo código; não se afirma repetição integral
em produção nem teste real de transporte de e-mail ou upload Storage.

Ads, GA4, TERMO, chaves e configurações Auth permaneceram intocados. GA-05/GA-09
continuam verificações administrativas separadas; não declarar medição paga
validada ou autorizar tráfego por causa desta publicação. Sem cota diária de IA
por decisão humana; continua o risco de um usuário consumir o orçamento global.

Commit funcional publicado: aa781d042ed125fee8f4bb49d2fa67702b3a2a02.
Registro de fechamento e evidências enviados na mesma branch, sem force-push
ou alteração de main. Tag v22102026.1 identifica o commit funcional. A limpeza
final do Git é conferida após o commit documental e push, sem apagar arquivos.
Pó Mágico v20261020.002, checkpoint delivery/closure, delta: acesso resolvido,
preflight/promoção/migrations/smoke concluídos; Codex/GPT-6, sem subagentes.
