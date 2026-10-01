# Decisões e fontes

- Consulta determinística de metadados, não geração por Gemini nem aquisição do texto integral.
- Crossref primário, DataCite fallback. Somente o DOI é enviado, nunca projeto, usuário ou cookies.
- `source: manual` continua representando a origem editorial da referência;
  `metadataLookup` opcional registra DOI, provedor e horário para rastreabilidade.
- Dados de terceiros são texto não confiável, nunca HTML executável.
- Cache de metadados públicos: uma hora, 256 entradas e coalescência por DOI;
  rate limit 20/minuto/usuário por instância (limitação transversal já aceita).
- Limites do formulário são respeitados com avisos explícitos; campos ausentes ficam vazios.
- Autores passam de 8 para até 100, ainda limitados a 1.200 caracteres no formulário.
- Sem migração de banco: campo opcional no JSON existente, compatível com registros antigos.
- Patches de segurança aplicados após achado no gate, sem `npm audit fix --force`.
- Arquivo avulso `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` preservado fora do commit/deploy.

## Fontes primárias consultadas em 01/10/2026

- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [DataCite: Get DOI](https://support.datacite.org/docs/api-get-doi)
- [Next.js: atualização](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js: advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
- [brace-expansion: advisory](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr)

Sem autorização para campanha Ads ou alteração de configurações Supabase/DNS;
essas frentes permanecem fora desta change.
