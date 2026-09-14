# Critérios de aceite

1. Configurações identifica corretamente o modo ativo.
2. A mesma conta alterna nos dois sentidos sem logout ou novo cadastro.
3. Repetir o modo atual não incrementa versão nem cria evento redundante.
4. Dois envios concorrentes não sobrescrevem silenciosamente a última escolha.
5. Uma segunda aba atualiza a interface e não mantém permissões antigas.
6. Payload adulterado não escolhe modo diferente do permitido pelo contrato.
7. Troca para modo sem aceite mostra o consentimento correto.
8. A experiência funciona por teclado, em leitor de tela e em viewport móvel.
9. Com a flag desligada, o link e a ação de troca não ficam disponíveis.
