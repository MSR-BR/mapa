# Evidências de encerramento — Change 005

Data: 23/07/2026  
Ambiente validado: `https://mapa-gray-two.vercel.app`  
Deployment final: `dpl_Gh2c6YDBUnsgEVbVsqXzQqY3q9hB`

## Matriz de rastreabilidade

| Requisito | Evidência | Resultado |
|---|---|---|
| Autenticação | Login por e-mail e senha no ambiente de produção | Aprovado |
| Projetos e briefing | Projeto criado, briefing salvo e recarregado com nível “Mestrado” | Aprovado |
| Research Starter | Consulta real limitada a 180 caracteres e 20 referências | Aprovado |
| Gemini | Estrutura real produzida com Gemini 2.5 Flash e schema canônico 1.0.0 | Aprovado |
| Anti-alucinação | IDs de evidência validados contra as referências recebidas antes da persistência | Aprovado |
| Estrutura acadêmica | Cinco capítulos obrigatórios, em ordem, com 11 seções | Aprovado |
| Editor | Primeiro título alterado e salvo como versão 2 | Aprovado |
| Persistência | Recarga confirmou o título editado sem perda | Aprovado |
| Recuperação | Falhas externas anteriores ficaram registradas e a nova tentativa concluiu sem apagar dados válidos | Aprovado |
| Autorização | Acesso autenticado encontrou o projeto próprio; UUID alheio/desconhecido retornou zero linha | Aprovado |
| Acesso anônimo | REST sem sessão não leu `projects`, `generation_jobs` ou `research_structures` | Aprovado |
| Responsividade | Viewport 390 × 844 sem overflow horizontal; botões com 40–70 px de altura | Aprovado |
| Produção | `/`, `/login` e `/api/health` responderam; `/dashboard` redirecionou anônimo para login | Aprovado |
| Dependências | `npm audit --omit=dev` sem vulnerabilidade conhecida | Aprovado |

## Falhas encontradas e corrigidas

1. O tópico enviado ao Research Starter excedia o contrato de 180 caracteres. O adaptador e a rota pública agora aplicam o limite correto.
2. A forma retornada pelo Gemini variava em campos canônicos controlados pela aplicação. A resposta generativa agora usa schema flexível e é normalizada/validada no servidor antes da persistência.
3. O raciocínio dinâmico do Gemini 2.5 Flash consumia o orçamento de saída. O `thinkingBudget` foi fixado em zero para esta tarefa estruturada, reduzindo custo e latência.
4. Logs de falha foram estruturados sem incluir prompts, chaves, relatórios ou conteúdo do usuário.

## Runbooks essenciais

### Geração falhou

1. Consultar os logs Vercel por `generation_job_failed` e pelo `jobId`.
2. Identificar a fronteira: Research Starter, Gemini, validação ou Supabase.
3. Manter a estrutura anterior; nunca apagar o último conteúdo válido.
4. Corrigir a causa e usar “Tentar novamente”.

### Research Starter indisponível

1. Confirmar `/api/health` do Mapa.
2. Verificar status/código sanitizado do adaptador Research Starter.
3. Não repetir automaticamente em loop; a nova tentativa é explícita pelo usuário.

### Gemini indisponível ou saída inválida

1. Verificar quota e faturamento do projeto Gemini.
2. Confirmar `GEMINI_API_KEY` e o modelo configurado na Vercel.
3. Preservar a estrutura anterior e repetir somente após correção.

### Rollback

1. Promover na Vercel o deployment anterior estável ou reverter o commit da aplicação.
2. As migrações desta etapa são aditivas; não executar rollback destrutivo de dados.
3. Revalidar health, login e leitura do projeto após a promoção.

## Riscos residuais

| Risco | Decisão | Proprietário |
|---|---|---|
| SMTP compartilhado do Supabase Free pode limitar confirmação/recuperação | Manter no piloto fechado; configurar SMTP próprio somente se o volume exigir | Responsável pelo produto |
| Research Starter pode levar dezenas de segundos | Manter progresso visível e nova tentativa explícita; sem polling permanente | Engenharia |
| Custos Gemini variam com volume | Limitar referências, saída e chamadas; monitorar a conta já paga | Responsável pelo produto |
| Advisor remoto do Supabase não pôde ser lido pelo conector por OAuth/permissão | RLS, índices e políticas foram revisados por migração e REST; renovar o conector antes do piloto público | Engenharia |
| Exportação ainda não existe | Implementar e validar na Change 006 | Engenharia |

## Decisão

A Change 005 está encerrada para o MVP existente. A Change 006 permanece aberta para exportação DOCX/PDF, decisões finais de retenção/LGPD e fechamento operacional do piloto.
