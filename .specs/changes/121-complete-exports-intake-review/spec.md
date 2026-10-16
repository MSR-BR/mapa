# C121 — Relatórios completos e revisão da entrada avançada

Autorização: pedido de 16/10/2026 para retirar Otimizar literatura, identificar validação pelo orientador, completar Word conforme PDF sem reduzir o PDF, limitar campos iniciais do Avançado a 400 caracteres e exibir texto original/texto Mapa da Pesquisa por campo; CPD limpo ao final.

## Escopo e aceite

- Retirar a opção Otimizar literatura da interface, preservando referências existentes e regeneração individual.
- Botões de capítulos e metodologia devem informar envio para validação do orientador nos projetos Aluno, espera quando pendente e Próximo nos projetos autônomos. Nenhuma alteração de autorização ou aprovação exigida.
- Novas respostas aos cinco campos iniciais do Avançado: máximo de 400 caracteres por campo, contador visível e validação no servidor. Respostas antigas até 2.000 caracteres continuam legíveis e exportáveis sem corte.
- Word passa a conter as mesmas seções e textos acadêmicos, referências, classificação, resultados, recomendações, apêndice e registro do PDF. Usar conteúdo compartilhado para impedir divergência futura; preservar apresentação/qualidade do PDF e Word editável.
- No apêndice Avançado, cada campo apresenta Texto original e Texto Mapa da Pesquisa; original permanece literal. Não inventar fatos ou referências. Modo Rápido não recebe apêndice Avançado.
- Testar limites/legados, interface por perfil, paridade de conteúdo entre formatos e renderização com respostas longas. Validar build, publicar versão seguinte e registrar CPD/rollback; deixar Git limpo.

Sem alteração de Ads, chaves ou modelos. O PDF atual é a referência de conteúdo e qualidade.

## Decisões de implementação

- “Texto Mapa da Pesquisa” é uma reformulação fiel de cada resposta, com o mesmo sentido e sem acrescentar fatos. A primeira exportação do Avançado prepara e salva as cinco sugestões, exibindo o comparativo editável; após revisar, o autor exporta. O original fica somente para leitura.
- A preparação usa a política Gemini/GPT existente e é reaproveitada por PDF e Word. Cada briefing recebe uma preparação; falhas ou conflito de revisão preservam os dados e permitem nova tentativa. Editar a reformulação não dispara IA novamente. O download GET não chama IA nem grava dados.
- O par original/reformulação fica no JSON já existente do workflow, sem migration ou Supabase Storage. Não substitui unidades acadêmicas confirmadas nem altera aprovações, estado ou contexto do projeto.
- Word é editável e compartilha integralmente o conteúdo acadêmico do PDF. Paginação e quebras podem variar conforme o editor. O PDF preexistente, antes do apêndice, foi comparado e preservado.
- A geração inicial do comparativo acrescenta uma operação limitada de IA ao primeiro uso. Orçamentos, modelos, chaves e fallback já configurados são preservados. A validação desta change usa somente dados sintéticos e provedores simulados.

Implementação e validação local concluídas; publicação candidata v16102026.2. Ver [validação](validation-2026-10-16.md).
