# Change 066 — Título final ampliado com aviso de concisão

**Status:** concluída

## Objetivo

Permitir títulos finais mais completos sem bloquear a validação por tamanho, mantendo uma recomendação clara de concisão.

## Escopo

- ampliar o limite técnico do título final de 120 para 240 caracteres;
- tornar títulos acima de 120 caracteres um aviso, nunca um erro de validação;
- apresentar o limite e o aviso na Etapa 4;
- manter a geração de IA orientada a títulos concisos;
- propagar o aviso ao mapa final sem impedir o encerramento.

## Critérios de aceite

1. Um título entre 121 e 240 caracteres pode ser salvo e validado.
2. O usuário vê uma recomendação de concisão, sem bloqueio de avanço.
3. Títulos acima de 240 caracteres continuam protegidos por limite técnico claro.
4. O mapa final conserva o aviso como informação não bloqueante.

## CPD

- **Check:** lint, typecheck, testes, exportação e build.
- **Persist:** o título longo segue a persistência atual de metodologia e projeto.
- **Deploy/document:** publicação em produção, health check e evidência de fechamento.
