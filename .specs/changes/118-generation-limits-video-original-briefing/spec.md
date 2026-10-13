# C118 — Limites de geração, velocidade do vídeo e briefing original no PDF

Autorização: em 13/10/2026, o responsável aprovou executar em uma única change os três itens descritos no chat, com “segue e execute. cpd limpo ao final.” Inclui commit, push e deploy no projeto existente mapadapesquisa.

## Escopo e aceite

1. Unificar limites dos campos editáveis entre geração, regeneração, formulário e validação. O prompt explicita os limites do schema; respostas fora do contrato não são persistidas e usam no máximo a tentativa de reformulação/fallback já autorizada. Não cortar palavras/texto do aluno, aumentar orçamento ou trocar modelos. Testar valores no limite, excedentes, falha repetida e preservação do conteúdo anterior.
2. Controles acessíveis de velocidade 1×, 1,5× e 2× no vídeo da home, com indicação da opção ativa. Preservar controles nativos, poster e carregamento sob demanda; verificar desktop/celular.
3. Acrescentar ao PDF final as cinco respostas originais do Mapa Avançado, identificadas pelas perguntas e produto escolhido, preservando o relatório existente. Não reescrever nem sintetizar as respostas. Respostas antigas são apresentadas como armazenadas: espaços periféricos removidos por versões anteriores não são recuperáveis. Novas entradas preservam espaços e quebras de linha. Mapa Rápido sem briefing não recebe apêndice inventado. Verificar documento longo, paginação e conteúdo extraído.

## Diagnóstico inicial

- A regeneração integral da problemática reutiliza o schema dos objetivos (700), embora formulário/validação permitam somente 500.
- Os limites de texto estão duplicados entre schemas/geração/UI; o prompt de várias operações não informa comprimentos.
- Listas metodológicas são exibidas/unidas por vírgula e reinterpretadas na edição; vírgulas dentro dos itens podem fragmentar o conteúdo e gerar bloqueios, apesar de uma resposta válida da IA. Os avisos éticos permitem 6 × 400 caracteres no schema, mas o campo desconsidera os 5 separadores.
- `initialBriefing` mantém as cinco respostas independentes do resumo de 5.000 caracteres. O schema atual aplica trim; a exportação ainda não inclui esse registro.

## Verificação e release

Testes locais e transporte de IA simulado (nenhuma chamada paga), lint/typecheck, exportações, renderização do PDF, regressão de rotas e gates de segurança/build. Sem migration, chaves, novos modelos, Ads ou TERMO. Versão prevista v13102026.1. Publicar artefato do commit exato, validar antes de promover e conferir domínio canônico/logs. Rollback: deployment dpl_2H37LDo1RfmAH9TjqWWDeyn1c7sG (v11102026.1). Preservar e versionar separadamente os registros de acompanhamento C110 já presentes no Git.

## Implementação e gate local

Implementação concluída; [validação local](validation-2026-10-13.md) aprovada com risco residual dev-only preexistente. O salvamento aceita recuperar problemática já excessiva sem permitir sua ampliação; confirmação e novas gerações continuam limitadas a 500. Publicação aguardando build remoto e promoção do candidato exato.
