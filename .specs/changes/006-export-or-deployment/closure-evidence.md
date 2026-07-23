# Evidências de encerramento — Change 006

Data: 23/07/2026  
Produção: `https://mapa-gray-two.vercel.app`
Deployment validado: `dpl_EiXQMidYn61HycDvsEeJiGtQhVCL`

## Exportação

| Verificação | Resultado |
|---|---|
| DOCX com assinatura ZIP/OOXML | Aprovado |
| PDF com assinatura `%PDF` | Aprovado |
| Fixture sintética DOCX/PDF | 9 páginas em cada formato, aprovado |
| DOCX real de produção renderizado pelo LibreOffice | 11 páginas, aprovado |
| PDF real de produção renderizado pelo Poppler | 10 páginas, aprovado |
| Capa, metadados, sumário e cinco capítulos | Aprovado |
| Avisos e referências verificadas | Aprovado |
| Rodapé, versão, data e paginação | Aprovado |
| Auditoria de acessibilidade DOCX | Zero achado alto, médio ou baixo |
| Comparação estrutural de conteúdo | Nenhuma seção obrigatória ausente |
| Bloqueio quando há edição não salva | Aprovado |
| Rota autenticada e filtrada por `owner_id` | Aprovado |
| `Cache-Control: private, no-store` | Aprovado |
| Smoke autenticado em produção | DOCX e PDF com HTTP 200, MIME, nome e assinatura corretos |

Durante o primeiro smoke do PDF em produção, o runtime serverless não encontrou os arquivos métricos AFM do PDFKit. O rastreamento desses arquivos foi incluído explicitamente em `next.config.ts`; o novo deployment foi validado com geração PDF real e HTTP 200.

## Economia e privacidade

- Nenhum bucket, tabela ou job adicional foi criado no Supabase.
- O arquivo é criado em memória, entregue na mesma requisição e descartado automaticamente.
- Não há URL assinada, pública ou reutilizável para expirar.
- O conteúdo não é enviado a um novo terceiro durante a exportação.
- Supabase Free permanece como restrição obrigatória.

## Região

- Supabase: `sa-east-1`, South America (São Paulo), confirmado no painel.
- Vercel Functions: `gru1`, São Paulo, configurado em `vercel.json` para reduzir latência e trânsito inter-regional.

## Backup e rollback

- As migrações permanecem versionadas no Git.
- No Free, PITR e restaurações diárias acessíveis não são usados; antes de migração destrutiva deve ser feito `supabase db dump`/`pg_dump` lógico para armazenamento criptografado controlado pelo responsável.
- Rollback da aplicação: promover o deployment anterior na Vercel.
- Rollback do banco: migrações aditivas; alterações destrutivas futuras exigem backup validado e plano específico.

## Resultado

A Change 006 está encerrada. O MVP cobre autenticação, projetos, briefing, pesquisa assistida, geração, edição persistente, DOCX, PDF e produção Vercel.
