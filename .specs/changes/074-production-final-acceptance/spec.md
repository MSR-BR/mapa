# Change 074 — Homologação final do fluxo completo em produção

## Modelo

- `gpt-5.6-sol` com raciocínio `xhigh`.

## Objetivo

Homologar a jornada completa do Mapa da Pesquisa em produção, com contas distintas de aluno e orientador, comprovando navegação, persistência, colaboração, isolamento e integrações sem travamentos.

## Cenários obrigatórios

1. aluno e orientador mantêm o papel permanente entre sessões;
2. o Mapa Rápido seleciona uma sugestão, preenche o tema e avança com um clique;
3. cada validação avança em uma única ação e a barra abre somente etapas anteriores sem perda de dados;
4. o título final é produzido pela IA, aceita o limite ampliado e usa concisão apenas como aviso;
5. a metodologia reconcilia objetivos/tópicos e não bloqueia por critérios acadêmicos orientativos;
6. o orientador lê apenas projetos vinculados, comenta, pede correção e aprova sem editar o projeto do aluno;
7. o aluno recebe a decisão e conclui o mapa, preservando referências e exportação;
8. produção responde sem overlay, erro de console, falha de saúde ou erro de runtime.

## Gates de saída

- check local completo aprovado;
- verificador Supabase aluno–orientador aprovado e dados temporários removidos;
- jornada autenticada conferida no navegador;
- domínio canônico, health check e logs de produção aprovados;
- problemas encontrados corrigidos, retestados e documentados;
- evidências de encerramento registradas.

## Estado

Concluída.
