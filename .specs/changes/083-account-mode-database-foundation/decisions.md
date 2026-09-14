# Decisões

1. Manter o nome `active_role` por compatibilidade, tratando-o como modo ativo.
2. Não criar tabela de habilitações: os dois modos são permitidos a toda conta.
3. Versionar a linha para impedir last-write-wins silencioso entre abas.
4. Auditar por trigger, não apenas pela RPC, para cobrir a criação inicial.
5. Manter a RPC sem grant até aplicação e interface estarem prontas.
