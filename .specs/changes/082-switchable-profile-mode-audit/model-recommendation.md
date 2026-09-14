# Modelo recomendado

## Principal

- Modelo: `gpt-5.6-sol`.
- Esforço: `Ultra` no Codex quando disponível; caso a interface ofereça apenas
  `Extra High (xhigh)`, usar esse nível.

## Justificativa

A sequência cruza migration compatível, funções `SECURITY DEFINER`, grants,
RLS, sessão, DAL Next.js, concorrência entre abas, interface e E2E. Sol é o
modelo disponível neste ambiente mais apropriado para trabalho profissional
complexo e uso prolongado de ferramentas. O nível máximo reduz o risco de uma
correção local criar divergência em outra camada.

Manter o mesmo modelo nas C83–C88 favorece continuidade arquitetural. Modelos
mais rápidos podem auxiliar em tarefas mecânicas, mas não devem decidir nem
aprovar migrations, policies ou gates de segurança desta sequência.

Documentação oficial consultada:
https://developers.openai.com/api/docs/models/gpt-5.6-sol
