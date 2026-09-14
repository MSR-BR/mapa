# Notas

- `TO authenticated` não é autorização suficiente; todas as policies precisam
  de identidade, modo, autoria e relação com o recurso.
- O Orientador possui dois contextos legítimos: proprietário de projeto autônomo
  e revisor de projeto estudantil vinculado. As policies mantêm esses caminhos
  separados.
- O helper de modo não recebe `user_id` arbitrário e deve usar nomes de schema
  qualificados, `search_path` seguro e grants mínimos.
- Não usar `raw_user_meta_data` para autorização. `app_metadata` também não será
  a fonte do modo, pois o JWT pode ficar obsoleto após uma troca.
- Após as policies estritas, rollback para uma versão anterior do app pode gerar
  UI incompatível. O caminho de emergência preferido é roll-forward da aplicação
  compatível; qualquer restauração de policy exige migration explícita.
