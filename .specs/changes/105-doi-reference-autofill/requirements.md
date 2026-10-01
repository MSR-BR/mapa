# Requisitos

- DOI opcional no topo de Referências externas, aceitando DOI puro, `doi:` e link doi.org/dx.doi.org.
- Botão Buscar dados; preencher somente campos vazios e preservar digitação concorrente.
- Consultar Crossref e usar DataCite como fallback, sem geração de dados pela IA.
- Título, autores, revista, volume/ano/páginas e abstract editáveis; somente título obrigatório.
- Dados ausentes ficam vazios. Falha de busca permite cadastro manual sem regeneração ou consumo de Gemini.
- Autorização central por proprietário, modo ativo, consentimento e versão do perfil; consulta não avança etapas nem muda revisão.
- Timeout, rate limit, cache limitado, validação de DOI, hosts fixos, redirecionamentos proibidos e limites de tamanho.
- Persistir proveniência da consulta sem classificar a referência como descoberta pelo Research Starter.
- Evitar DOI duplicado e não truncar silenciosamente listas no antigo limite de oito autores.
- Preservar migrations, contas, perfis, referências existentes e arquivos avulsos do usuário.

O gate de publicação encontrou dependências vulneráveis preexistentes. Patches
compatíveis Next.js/eslint-config-next 16.3.8 e brace-expansion são parte da
higiene necessária deste CPD; não há migração de versão principal.
