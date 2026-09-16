# Roadmap de implementação

## Princípios de sequenciamento

Cada fase entrega uma base verificável para a seguinte. Integrações externas permanecem atrás de contratos. O avanço depende da aprovação e da conclusão do gate anterior.

| Ordem | Mudança | Estado | Resultado e gate de saída |
|---|---|---|---|
| 001 | Criar estrutura do projeto | Concluída | Next.js/Vercel saneado, ferramentas e smoke aprovados. |
| 002 | Implementar fundação do MVP | Concluída | Autenticação, Supabase Free, RLS, migração e shell aprovados. |
| 003 | Implementar projetos e briefing | Concluída | CRUD, briefing validado, proteção contra perda e evidências encerrados. |
| 004 | Implementar geração e editor | Concluída | Research Starter, Gemini, schema 1.0.0 e editor persistente aprovados. |
| 005 | Testes e validação | Concluída | Jornada real, segurança, responsividade, dependências e produção aprovadas. |
| 006 | Exportação e fechamento do piloto | Concluída | DOCX/PDF, região, retenção inicial, rollback e produção aprovados. |
| 007 | Dashboard, integração e referências | Concluída | Navegação, integração de mapas, literatura otimizada e referências nas exportações. |
| 008 | Login com Google | Concluída | Login Google e e-mail operacionais no domínio canônico. |
| 009 | Mapa da Pesquisa v2 | Concluída | Contrato global, estados, persistência e regras da nova jornada aprovados. |
| 010 | Descoberta de propostas | Concluída | Prompt pesquisado e seis cards distintos e fundamentados, com integração real validada. |
| 011 | Problemática e objetivos | Concluída | Etapas 1, 2 e 3 editáveis, versionadas e validadas. |
| 012 | Capítulos 2 e 4 | Concluída | Etapas 4 e 5 editáveis, rastreáveis e ligadas aos objetivos e à literatura verificável. |
| 013 | Metodologia e resultados esperados | Concluída | Matriz metodológica completa por objetivo, com classificação editável e resultados esperados validados. |
| 014 | Rastreabilidade e coerência | Concluída | Página final única, grafo de origem/destino e motor de regras. |
| 015 | Transição e entrega do v2 | Implantada em produção | Legado preservado, dashboard/exportações atualizados, CPD e smoke público concluídos; pendente apenas validação autenticada real. |
| 025 | Entrada estruturada da situação-problema | Concluída | Cinco perguntas orientadas substituem o prompt único, preservam o briefing no workflow e chegam à descoberta com compatibilidade legada. |
| 026 | Tipo de produto e níveis de aprofundamento | Concluída | Seleção de TCC, monografia, dissertação, tese e artigos, com guia auxiliar aplicado às instruções da IA em todas as etapas. |
| 027 | SEO, landing page e indexação pública | Concluída | Metadados, dados estruturados, textos públicos, sitemap, robots e documentação alinhados às entradas estruturadas e aos produtos acadêmicos. |
| 028 | Compatibilidade de rascunhos legados | Concluída | Recuperação de prompts antigos sem perder a validação mínima da nova entrada estruturada. |
| 029 | Recuperação do briefing após autenticação | Concluída | Rascunho preservado até a criação ser confirmada, com recuperação mesmo se o callback perder o parâmetro de retorno. |
| 030 | Roteiro rápido e construção avançada | Concluída | Prompt livre com sugestões e entrada estruturada coexistem em cards recolhíveis, com persistência segura nos dois caminhos. |
| 031 | Recuperação do callback Google | Concluída | Código OAuth recebido na URL raiz é trocado por sessão e retorna ao dashboard; falhas preservam o destino e o rascunho. |
| 032 | Retomada pós-login e início recolhido | Concluída | O rascunho autenticado aguarda o aceite legal, segue direto para a descoberta em cards e o dashboard oferece roteiro rápido e construção avançada recolhidos por padrão; textos legais atualizados. |
| 033 | Distribuição do suporte para a equipe | Concluída | Mensagens enviadas por suporte@mapadapesquisa.com.br chegam aos e-mails institucionais de Mario Reis e Sérgio França; o reply-to continua sendo o e-mail informado pelo usuário. |
| 034 | Recebimento direto em suporte@mapadapesquisa.com.br | Concluída | Resend Receiving, MX, webhook e endpoint verificados; mensagem externa encaminhada com sucesso para `marioreis@id.uff.br` e `sfranca@id.uff.br`. |
| 035 | Teste E2E aluno–orientador | Concluída | Runner autenticado executou o fluxo de perfis, vínculo, leitura supervisionada, correção, aprovações, mapa final e referências em projeto temporário; limpeza confirmada. |
| 036 | Auditoria Supabase e segurança residual | Concluída | Migrations remotas e locais, grants das funções SECURITY DEFINER, RLS remoto autenticado/anônimo, rate limiting, Firewall publicado em modo observação, advisor via CLI, build e smoke aprovados; a indisponibilidade do conector MCP não bloqueia a auditoria equivalente. |
| 037 | Revisão legal e autorização do responsável | Concluída | Termos, privacidade, consentimento por papel, créditos, contatos e acessibilidade revisados; autorização de uso confirmada pelo professor responsável da UFF. |
| 038 | Domínio `www` | Concluída | Domínio raiz confirmado como único endereço público; hosts técnicos antigos redirecionam para ele e `www` foi deliberadamente não publicado. |
| 039 | Fechamento operacional do piloto | Concluída | CPD técnico, E2E, domínio, integrações, segurança de aplicação, exportações, Docker local, smoke, commit limpo e tag `v21082026.1` aprovados. |
| 040 | Paridade dos modos de entrada na home | Concluída | Home alinhada ao dashboard, com Mapa Avançado recomendado, Mapa Rápido recolhido e contraste visual entre os cards. |
| 041 | Relatos de problemas e triagem privada | Concluída | Formulário na home e no app, anexos privados, RLS por usuário, notificação Resend e painel de triagem restrito à equipe. Migration, testes e produção aprovados. |
| 042 | Mapa Rápido com sugestões resilientes | Concluída | Sugestões locais aparecem enquanto o usuário digita, refinamento por IA continua quando disponível e o fluxo rápido mantém alternativas de tema, formulação e recorte sem bloquear o início. |
| 043 | Descoberta de propostas resiliente | Concluída | Research Starter e Gemini têm tratamento de respostas inválidas, retry transitório, normalização de referências, limite de tempo, retry de cards e diagnóstico por etapa; o briefing é preservado. |
| 044 | Validação final do pipeline Gemini + Research Starter | Concluída | Smokes reais do Gemini, Research Starter e descoberta, E2E autenticado aluno–orientador, exportação PDF, testes, lint, typecheck, build, deploy e smoke público aprovados. |
| 045 | Observabilidade e manutenção pós-piloto | Concluída | Correlation ID, logs operacionais sanitizados, health check sem cache, runbook, testes e smoke público aprovados; produção em `v23082026.4`. |
| 046 | PDF final conforme modelo acadêmico e registro CBL | Concluída | PDF final reorganizado no formato do modelo fornecido, com capítulos 1–5, referências cruzadas, link do aplicativo, registro CBL/ISBN e código de barras incorporado; produção em `v23082026.5`. |
| 047 | Conclusão, impactos e agenda de pesquisa | Concluída | PDF final diferencia resultados esperados, explicita impactos potenciais, oportunidades derivadas da literatura e recomendações relacionadas ao tema, objetivos e referências. |
| 048 | Recuperação de senha e retorno seguro | Concluída | Link de recuperação usa confirmação OTP segura, preserva destinos internos e mantém compatibilidade com callbacks antigos. |
| 049 | Auditoria final e encerramento operacional | Concluída | Código, Supabase, integrações, segurança, exportações, domínio, produção e CPD revalidados; versão final publicada em `v23082026.8`. |
| 050 | Persistência do orientador no projeto | Concluída | Reabertura mostra o orientador salvo e só abre a edição mediante ação explícita; versão `v25082026.1`. |
| 051 | Linguagem de cobertura dos objetivos | Concluída | Capítulos 2 e 4 usam “Atende parcialmente” e “Atende completamente”, com cobertura OE/OEG no mapa final e PDF; versão `v25082026.2`. |
| 052 | Explicação e garantia da otimização da literatura | Concluída | Card e endpoint explicam a nova busca no Research Starter, preservam referências externas e informam as associações recalculadas; versão `v25082026.3`. |
| 053 | Auditoria de regressão do relatório de 21–25/08 | Concluída | Auditoria local, E2E autenticada, integrações Gemini/Research Starter, Supabase/RLS, segurança, exportação PDF, domínio canônico, SEO, callbacks e smoke de produção aprovados; limitação do Docker local e `www` não publicado ficaram documentados; versão `v25082026.5`. |
| 054 | Instrumentação de produto e funis no GA4 | Concluída | Contrato tipado, consentimento, eventos de domínio, funis e sanitização sem PII implementados; testes locais aprovados e configuração de definições/relatórios do GA4 documentada para validação operacional. |
| 055 | Auditoria live da descoberta e briefing rápido | Concluída | Diagnóstico explícito de credencial Research Starter, preservação do briefing e correção da duplicação do prompt rápido; a credencial foi rotacionada e o serviço validado na Change 056. |
| 057 | Coerência metodológica ao editar e encerramento visível | Concluída | Avisos metodológicos recalculados a partir dos campos atuais, com estado limpo quando não há alertas; encerramento destacado na página final e orientado ao fim da Etapa 6. |
| 058 | Auditoria da lista de melhorias de 01/09/2026 | Concluída | Itens já implementados foram confirmados; divergências de texto, numeração, revisão de objetivos e lembretes foram separadas nas Changes 059–062. |
| 059 | Mapa Rápido: texto de exemplo e sugestões numeradas | Concluída | Placeholder alinhado ao modelo, sugestões exibidas como Tema 1–3 e linguagem genérica removida também do fallback de IA. |
| 060 | Metodologia: numeração visível | Concluída | A navegação e os estados visíveis apresentam a Metodologia como Etapa 4, mantendo o identificador interno do workflow compatível. |
| 061 | Revisão e promoção de objetivos | Concluída | A etapa de objetivos específicos permite revisar o objetivo geral e promover um OE para OEG, preservando referências, justificativas, validação e rastreabilidade. |
| 062 | Lembretes de validação aluno–orientador | Concluída | Estudante e orientador podem reenviar com segurança o aviso da etapa pendente para a outra parte, sem expor credenciais ou criar uma nova revisão. |
| 063 | Correção das ações de objetivos | Concluída | Voltar, salvar, remover e promover objetivos aceitam a ausência de promoção sem retornar “Operação inválida”; regressão testada e publicada em produção. |
| 064 | Papel de conta imutável e linguagem de revisão | Concluída | Papel escolhido no primeiro acesso não pode mais ser trocado pela interface, Server Action ou banco; área de revisão ganhou linguagem neutra e a migration foi publicada e verificada no Supabase. |
| 065 | Mapa Rápido: seleção que avança | Concluída | Selecionar um tema sugerido preenche e submete o mesmo fluxo do Mapa Rápido: cria o projeto no dashboard ou preserva o rascunho antes do login na home; testes, build, deploy e health check aprovados. |
| 066 | Título final ampliado com aviso de concisão | Concluída | Título final aceita até 240 caracteres; acima de 120, a concisão é recomendada sem bloquear salvamento, validação ou encerramento; testes, build, deploy e health check aprovados. |
| 067 | Progresso da jornada em N/M | Concluída | A jornada exibe Etapa N/4 em descoberta, definição, capítulos, metodologia, mapa final e resumos de etapas validadas; subpassos e workflow interno preservados; testes, build, deploy e health check aprovados. |
| 068 | Coerência orientativa sem travar o fluxo | Concluída | Critérios acadêmicos de definição, capítulos, metodologia e mapa final são persistidos como avisos orientativos, permitindo avanço e encerramento; segurança técnica e formato inválido permanecem protegidos; testes, build, deploy e health check aprovados. |
| 069 | Retorno sem perda de dados | Concluída | Voltar e avançar sem edição preserva objetivo geral, objetivos específicos e Capítulo 4; só há regeneração após alteração real na origem; testes, build, deploy e health check aprovados. |
| 070 | Reconciliação de associações de tópicos | Concluída | Contagens usam apenas tópicos existentes; IDs órfãos ou duplicados são removidos das associações metodológicas sem apagar conteúdo válido; testes, build, deploy e health check aprovados. |
| 071 | Verificador E2E compatível com papel imutável | Concluída | A simulação aluno–orientador valida os papéis permanentes das contas de teste sem tentar atualizá-los; lint, tipos, 84 testes, build e fluxo RLS completo passaram, com limpeza do projeto temporário. |
| 072 | Recuperação do pipeline Gemini | Concluída | Gemini 3.6 Flash restaurou saída estruturada, metodologia e título final por IA; 85 testes, build, Research Starter e smokes de produção passaram no deployment dpl_BeNtfChz7iKdcneZHyD69LhmRodY. |
| 073 | Navegação e validação confiável das etapas | Concluída | Avanço explícito em um clique, barra Etapa/Passo navegável para trás e matriz metodológica reconciliada com objetivos reais; 88 testes, E2E autenticado e produção saudável. |
| 074 | Homologação final do fluxo completo em produção | Concluída | Jornada aluno–revisor, papéis imutáveis, isolamento, Mapa Rápido, navegação, IA, 89 testes e produção homologados; a higiene operacional remanescente da credencial foi encerrada na Change 075. |
| 075 | Estabilização operacional de produção | Concluída | Credencial canônica restrita a Production, smoke autenticado aprovado, Node.js 22 fixado, dependências sem vulnerabilidades conhecidas, 90 testes e deployment `dpl_A96gpBn81Z4Rfu5tqDxoRpYKACZi` validados. |
| 076 | Clareza dos perfis e interface contextual | Concluída | Perfis Aluno e Orientador voltaram a ser identificados explicitamente; papel permanente, controles contextuais, E2E entre contas e produção foram validados. |
| 077 | Menu de perfil conciso | Concluída | Menu mantém somente a identificação explícita de Aluno ou Orientador; textos auxiliares, código sem uso, testes, produção e CPD foram validados. |
| 078 | Vídeo promocional para redes sociais | Concluída | Vídeo vertical de 15 segundos exportado em H.264 com gancho, fluxo resumido, figuras de Aluno e Orientador, logo oficial, link, QR Code validado, trilha original e pacote de publicação. |
| 079 | Vídeo promocional premium — versão 2 | Concluída | C78 preservada; nova peça com gancho em 0,3 s, transformação visual do app, mensagem de valor, CTA premium, faixa eletrônica gerada, QR validado e pacote reproduzível. |
| 080 | Roteiro promocional para NotebookLM | Concluída | Prompt e roteiro Brief em português estruturados para aproximadamente 60 segundos, com conteúdo exato separado da geração; nenhum vídeo ou deploy foi executado. |
| 081 | Vídeo de apresentação na landing page | Concluída | MP4 fornecido incorporado após o hero com poster real, controles acessíveis, carregamento sob demanda, layout responsivo e regressão automatizada; CPD validado no domínio canônico. |
| 082 | Auditoria e arquitetura de modos alternáveis | Concluída | Contrato imutável, lacunas de UI/servidor/RLS, matriz canônica e sequência C83–C88 documentados; autoria própria nos dois perfis e revisão vinculada foram separadas sem mudança funcional remota. |
| 083 | Fundação de dados para modo ativo | Planejada | Migration aditiva preserva o modo atual, acrescenta autoria imutável ao projeto, versão/horário, trilha append-only e RPC ainda sem grant; preflight remoto é gate obrigatório. |
| 084 | Autorização centralizada por modo | Planejada | DAL fail-closed combina modo, autoria e relação em Server Components, Server Actions e Route Handlers; código permanece sob feature flag desligada. |
| 085 | Seleção de perfil nas configurações | Planejada | A mesma conta escolhe Aluno ou Orientador com confirmação, concorrência versionada, consentimento correto e atualização entre abas. |
| 086 | Interface estrita Aluno/Orientador | Planejada | Ambos criam e gerenciam projetos próprios; Aluno pode usar supervisão, enquanto Orientador cria de forma autônoma e recebe revisões vinculadas em área separada. |
| 087 | RLS e vínculos conscientes do modo | Planejada | Policies, funções e trigger combinam modo, autoria e relação; Orientador mantém CRUD autônomo próprio sem poder autoaprovar projeto criado como Aluno. |
| 088 | Homologação E2E e rollout de modos | Planejada | Duas contas e duas abas validam autoria, supervisão, revisão, troca e RLS; gate separado confirma estratégia DNS, domínio, SSL e e-mail sem cutover automático de nameservers. |

## Marcos

- M0: arquitetura e especificações aprovadas — concluído.
- M1: fundação técnica pronta — concluído.
- M2: gerenciamento de projetos utilizável — concluído.
- M3: estrutura gerada e editável — concluído.
- M4: MVP validado — concluído.
- M5: piloto implantado — concluído em ambiente controlado.
- M6: fluxo conceitual v2 aprovado — concluído.
- M7: descoberta, problemática, objetivos, capítulos, metodologia e resultados esperados validados.
- M8: mapa rastreável e coerente entregue — concluído.
- M9: v2 implantado com compatibilidade legada — concluído e revalidado em produção com fluxo autenticado real.
- M10: conta com modos Aluno/Orientador alternáveis e estritamente isolados — planejado nas Changes 083–088.

## Dependências externas

- Hosting: Vercel confirmado.
- Domínio raiz funcional na Vercel com DNS externo em 16/09/2026; escolha entre
  manter o provedor atual ou delegar nameservers fica como gate controlado da C88.
- Banco e Auth: Supabase/PostgreSQL confirmado no projeto `aeaweherkrqmlqnxsmib`.
- Provedor de IA: Gemini 3.6 Flash confirmado na conta já paga pelo responsável, com GEMINI_MODEL como override opcional.
- Contrato do Research Starter: v1 integrado exclusivamente pelo backend.
- Custos, privacidade, retenção, termos e responsável pelo tratamento devem continuar monitorados durante o rollout do v2.

## Evolução pós-MVP aprovada para especificação

O Mapa da Pesquisa v2 substitui a geração monolítica por descoberta assistida, validação em etapas, biblioteca metodológica, rastreabilidade e coerência. A implementação deve seguir estritamente as Changes 009 a 015, uma por vez.

## Fora do roadmap atual

Templates completos por área, compartilhamento, colaboração em tempo real, redação integral da pesquisa e aprendizado entre usuários permanecem fora do escopo.
