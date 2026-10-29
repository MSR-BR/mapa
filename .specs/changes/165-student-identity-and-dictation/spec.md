# Especificação

- Dados acadêmicos: nome, instituição, instituto/departamento, curso/programa e uma ou mais modalidades (TCC, mestrado acadêmico, mestrado profissional, doutorado, outro). Perfil editável, com RLS somente para o titular.
- O nome é copiado para projetos de autoria estudantil; o orientador só o vê nos projetos já acessíveis pela política de orientação. Os demais dados acadêmicos não são expostos ao orientador.
- Projetos antigos recebem o nome OAuth existente, se houver. Se não houver nome confiável, o card informa que ele ainda não foi preenchido. Nenhum mapa é bloqueado pelo cadastro complementar.
- Ditado pt-BR iniciado por clique nos campos principais de texto e título do mapa. Insere palavras completas na posição do cursor sem apagar edição existente, respeita o `maxLength`, informa erro/permissão/suporte e não grava áudio no app. Se o campo ficar bloqueado durante o reconhecimento, a transcrição é descartada. O serviço de reconhecimento do navegador pode processar a fala remotamente.
- Erros de leitura do perfil acadêmico não são tratados como cadastro ausente. Uma falha de gravação mantém os dados digitados e permite tentar novamente.
- CAPES: o catálogo oficial cobre programas de pós-graduação e IES, mas não todos os cursos, departamentos e TCC. O preenchimento permanece livre; não há dependência de uma API externa na navegação do aluno.
