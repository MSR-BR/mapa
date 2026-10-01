# Critérios de aceite

1. Aluno e Orientador veem os dois modos de orientação em cada campo pertinente; somente Aluno mantém o contexto obrigatório na validação.
2. O pedido pontual muda o texto enviado à IA apenas em `regenerate` e é limpo somente após sucesso.
3. IDs, quantidade e tamanho das orientações são validados na API e limitados à etapa ativa.
4. Notas persistentes recém-digitadas são consideradas e preservadas em capítulos e matriz; uma falha de geração não apaga a versão salva.
5. A justificativa metodológica da classificação continua acadêmica e distinta do pedido pontual.
6. Lint, tipos, testes, exportações, build, gate de segurança, UI responsiva e smoke público passam antes do encerramento.
