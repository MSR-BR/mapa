# Gate de release seguro

## Resultado possível

- `PASS`: candidato exato validado e sem risco aberto bloqueante.
- `PASS_WITH_ACCEPTED_RISK`: risco residual documentado, com responsável e limite claros.
- `BLOCKED`: evidência ausente, falha de controle ou destino/revisão ambíguos.
- `NOT_APPLICABLE`: mudança documental ou local sem entrega executável.

## 1. Identificar o candidato

- Registrar commit exato, árvore limpa ou arquivos não relacionados preservados.
- Registrar destino e ambiente.
- Classificar o diff: normal ou sensível (Auth, API, banco, dados, IA, segredos, dependências ou infraestrutura).
- Definir rollback antes da mutação.

## 2. Gate local

Para qualquer release:

```bash
npm run security:gate
npm run check
```

Mudanças Supabase também exigem os verificadores locais específicos da migration. Uma auditoria estática não comprova o estado remoto.

## 3. Autoridade

Aprovação técnica local não autoriza mutação remota. Deploy, migration, configuração de provedor, DNS, segredo ou campanha exigem autorização explícita para o alvo exato.

## 4. Aplicação

- Aplicar somente o candidato revisado.
- Não misturar migration privilegiada e deploy funcional sem plano e autorização separados.
- Preservar compatibilidade e rollback quando houver mudança de contrato.

## 5. Prova pós-release

- Confirmar revisão realmente publicada e destino canônico.
- Executar health e smokes proporcionais ao risco.
- Para banco: verificar objetos, grants, RLS e comportamento autorizado/negado.
- Verificar logs sanitizados e ausência de erros novos.
- Registrar deployment, versão, resultado e rollback conhecido.

## 6. Fechamento

Uma Change só passa a concluída quando as evidências correspondem ao candidato exato. Estado `configurado` ou `alcançável` não deve ser descrito como `funcionalmente validado`.
