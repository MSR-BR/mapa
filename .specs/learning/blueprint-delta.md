# Delta proposto para o blueprint

## Operação de segredos

Adicionar ao gate de release a reconciliação de variáveis por nome, alvo e ID,
com proibição explícita de exportar segredos ocultos para produzir evidência.

## Runtime e dependências

Exigir que a versão efetiva do runtime seja confirmada no log de um build limpo,
além da declaração no manifesto. Registrar também auditoria de dependências e
decisão explícita sobre scripts de instalação antes do deploy final.

## Integrações externas

Diferenciar três níveis de prova: configurado, autenticado e funcional. Para o
encerramento, integrações críticas precisam de smoke funcional pelo caminho real
do produto.
