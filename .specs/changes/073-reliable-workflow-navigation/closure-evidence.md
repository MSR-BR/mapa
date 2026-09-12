# Evidências de encerramento — Change 073

## Resultado

A navegação do mapa passou a separar macroetapas de passos internos, avançar por URL canônica após validação e permitir retorno direto a qualquer etapa anterior sem regenerar o conteúdo salvo. A metodologia agora reconcilia IDs produzidos pela IA com os objetivos e tópicos reais, evitando matriz vazia por vínculo inexistente.

## Correções implementadas

- navegação explícita com router.replace após validação ou retorno, eliminando a permanência na tela anterior causada por router.refresh;
- barra compartilhada com Etapa N/4 para macroetapas e Passo N/M para o detalhe atual;
- etapas anteriores renderizadas como botões acessíveis; etapa atual e futuras permanecem informativas;
- confirmação antes de abandonar edições locais ainda não salvas;
- sincronização do workflow devolvido pela API antes da mudança de URL, inclusive entre passos do mesmo componente;
- rota autenticada POST /api/projects/[id]/navigation, protegida por proprietário, revisão otimista e revisão pendente;
- reconciliação determinística de IDs inválidos ou duplicados da matriz para cada OE e para o OEG;
- remoção de associações a tópicos inexistentes e escolha de tópico válido de cobertura;
- estado vazio da metodologia explicado com a ação Gerar matriz novamente;
- título final da IA preservado e editável, sem voltar a tratá-lo como um campo curto obrigatório.

## Check

- npm run check: aprovado;
- lint: zero erros e zero avisos após o ajuste final;
- TypeScript: aprovado;
- testes: **88/88 aprovados**;
- exportação PDF: aprovada;
- build Next.js 16.2.11: aprovado;
- git diff --check: aprovado.

## Verificação aluno/revisor

npm run supabase:verify-advisor-student concluiu com status ok:

- cadastro/login e papel persistente de aluno e revisor;
- vínculo e leitura supervisionada;
- bloqueio de edição indevida pelo revisor;
- comentários, solicitação de correção e sete aprovações;
- mapa final concluído e três referências associadas.

## Verificação em navegador

- build local de produção respondeu 200 e renderizou conteúdo sem tela em branco;
- mapa final autenticado apresentou Etapa 4/4 e Passo 2/2;
- quatro destinos anteriores foram expostos como botões: Problemática, Objetivos, Capítulos e Matriz metodológica;
- um único clique em Matriz metodológica abriu workflowStep=methodology_matrix, incrementou a revisão e atualizou o conteúdo para Passo 1/2 · Etapa 4/4;
- nenhuma exceção de JavaScript, erro de console ou overlay do Next.js foi detectado;
- os demais destinos são cobertos pela mesma rota compartilhada e pelos testes de ordenação/autorização.

## Persist

- conteúdo acadêmico salvo não é apagado ao voltar;
- saltos para etapa atual ou futura são recusados;
- revisão concorrente evita sobrescrita por outra aba;
- edições não salvas exigem confirmação;
- IDs do banco continuam sendo a fonte canônica, mesmo quando a IA devolve UUIDs divergentes.

## Deploy

- alvo: produção;
- deployment: dpl_Dgb3wGA5EkDNwi6t1NmAc76Kt4nH;
- URL do artefato: https://mapadapesquisa-qqhofwwyy-msr-brs-projects.vercel.app;
- alias: https://mapadapesquisa.com.br;
- estado: READY;
- health: ok, com Gemini, Research Starter, Supabase e Resend configurados;
- varredura pós-deploy: nenhum log de erro encontrado nos dez minutos recentes.
