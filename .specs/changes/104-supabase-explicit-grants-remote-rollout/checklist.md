# Checklist

- [x] Autorização específica recebida.
- [x] Candidato-base e destino confirmados.
- [x] Gate local reaprovado para 19 migrations.
- [x] Migration history remoto inicial reconciliado em 18 migrations.
- [x] Data API e schema `private` verificados.
- [x] Grants, RLS, policies, funções e defaults auditados.
- [x] Security Advisor classificado: zero erros e quatro warnings explicados.
- [x] Smoke anônimo aprovado.
- [ ] Prova autenticada compatível com Google-only aprovada.
- [x] Migration C104 aplicada e readback aprovado.
- [x] Ausência de mutação das fixtures comprovada: o runner parou no HTTP 422
  antes da leitura dos perfis, troca de modos ou criação de registros.
- [x] Decisão do release gate registrada: `PASS_WITH_ACCEPTED_RISK`; falta uma
  prova autenticada pós-migration por mecanismo compatível com Google-only.
- [x] Roadmap, estado e perfil de segurança atualizados.
