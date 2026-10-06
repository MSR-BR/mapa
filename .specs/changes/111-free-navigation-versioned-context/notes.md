# Persistência, consumo e recuperação

## Política implementada

Salvar grava apenas uma unidade alterada (etapa) e seus vínculos; sem escrita por tecla, navegação ou polling. Salvamento semanticamente idêntico não grava. Não há agrupamento temporal nem descarte automático: cada salvamento explícito alterado é recuperável e os marcos confirmados permanecem. PDFs/anexos e o catálogo de referências não são duplicados em cada versão. Rascunho e proposta atuais permanecem no JSON; histórico fica em workflow_versions, com páginas de 20 metadados e corpo lido apenas ao selecionar uma versão. Exclusão definitiva do projeto conserva o comportamento de cascata existente; projetos em lixeira não expõem histórico.

A IA usa o contexto vigente e a revisão sourceRevision; a proposta grava sua revisão-base. Conflito entre abas falha sem sobrescrever. Texto ainda local permanece na tela para copiar/salvar após reconciliar. Rascunhos de contexto anterior pedem revisão explícita antes de confirmar; propostas antigas precisam ser geradas novamente. Aluno com submissão pendente pode consultar, mas edição fica congelada até o parecer.

## Medição sintética reproduzível

`npm run supabase:verify-versioned-workflow`, PostgreSQL 17:

- 2.015 versões na fixture, incluindo 1.000 legadas e versões metodológicas maiores.
- Média lógica das novas unidades: 4.754 bytes.
- Tabela (incluindo TOAST): 2.433.024 bytes; índices: 524.288 bytes.
- Payload corrente: 17.722 bytes nos cenários com 0, 100, 300 e 1.000 novas versões.
- Navegação: zero writes/IA. Uma edição salva: um UPDATE do projeto + INSERT por unidade/bucket efetivamente alterado, na mesma transação. Confirmação pode versionar também dependências marcadas stale; portanto não prometer uma única linha por confirmação.

Cenário ilustrativo de 100 versões por projeto (MB/GB decimais):

| Projetos | Conteúdo lógico histórico | Disco projetado pela média mista da fixture, com índices | Leitura de todo esse histórico uma vez |
|---|---:|---:|---:|
| 100 | 47,54 MB | 14,68 MB | ≥47,54 MB + JSON/metadados |
| 1.000 | 475,4 MB | 146,8 MB | ≥475,4 MB + JSON/metadados |
| 10.000 | 4,754 GB | 1,468 GB | ≥4,754 GB + JSON/metadados |

Compressão e distribuição real podem mudar muito o disco. A média mista inclui legado menor e texto sintético compressível; não é garantia de capacidade. Projeção exclui outros dados, WAL, crescimento de índices, tráfego de autenticação e cópias. Consulta normal não lê o histórico: 1.000 carregamentos desta fixture representam ~17,72 MB de JSON corrente, independentemente do número de versões.

## Preflight remoto

Painel do projeto aeaweherkrqmlqnxsmib: 117 workflows, 4.105 versões legadas, zero já migrados, banco de 16 MB. Consulta em 06/10/2026, sem conteúdo privado no recibo. Plano Free existente, sem upgrade, Realtime ou serviço novo. O tamanho é observação pontual, não cobrança garantida. Sem retenção automática: acompanhar tamanho do banco; erro de capacidade preserva texto local e impede confirmação do salvamento.

## Corte e recuperação

1. Preparar deployment imutável sem promover domínio.
2. Aplicar migration transacional com lock de escrita. Arquivar todas as versões legadas e criar baseline por unidade antes de remover o array do registro corrente. Comparar hashes de conteúdo e igualdade de cada entrada legada dentro da transação; divergência aborta tudo.
3. Confirmar tabela, ACL/RLS, triggers, contagens e schema_migrations; promover o deployment verificado e fazer smoke no domínio.
4. Falha antes do COMMIT reverte integralmente. Depois do COMMIT, nunca publicar cliente antigo com escrita: trigger workflow_client_upgrade_required impede sobrescrever rascunhos novos. Corrigir para frente ou preparar build compatível que mantenha o contrato C111. Uma simples promoção do deployment anterior não é rollback funcional seguro; poderá manter leitura, mas bloqueará escritas.

Não apagar workflow_versions nem reconstruir os dados atuais a partir de um histórico parcial para reverter. Em incidente, preservar ambos e investigar antes de qualquer restauração do banco.
