# Relatório de auditoria

## Resultado

A base existente é aproveitável, mas recolocar apenas um seletor no menu seria
inseguro e inconsistente. C64 e C71 tornaram o perfil imutável no formulário,
na Server Action, no grant do banco e no E2E. A autoria já oferecida ao
Orientador deve ser preservada, mas hoje não está separada de forma persistente
do contexto de revisão de projetos estudantis.

## Pontos positivos preserváveis

- `user_profiles.active_role` já é persistido no servidor e não no navegador.
- `projects` distingue proprietário (`owner_id`) e orientador (`advisor_id`).
- A revisão possui checagem de vínculo e trigger que limita as alterações do
  orientador ao registro de revisão.
- Consentimentos legais já são separados por `profile_role`.
- Existe verificador E2E com duas contas e limpeza do projeto temporário.

## Problemas encontrados

### Críticos para o novo requisito

1. **Troca bloqueada em todas as camadas.** `setInitialProfileRole` aceita apenas
   a primeira escolha; a migration C64 remove o grant e a policy de UPDATE; os
   testes exigem imutabilidade.
2. **RLS de orientação ignora o modo ativo.** Uma conta vinculada pode consultar
   `projects` e `research_workflows` como orientador pela Data API mesmo quando
   sua interface estiver no modo Aluno.
3. **Projetos próprios não registram o perfil de autoria.** Como a conta hoje tem
   papel imutável, `owner_id` era suficiente. Após liberar a troca, seria possível
   abrir como Orientador um projeto criado como Aluno e contornar sua supervisão.
4. **Endpoints de autoria não conhecem o contexto do projeto.** Criação, geração,
   descoberta, navegação, edição, integração, exportação e exclusão verificam
   autenticação/propriedade, mas não distinguem projeto de Aluno supervisionável
   de projeto próprio e autônomo do Orientador.
5. **Autoria e revisão estão misturadas apenas por branches de interface.** O
   dashboard já permite ao Orientador criar e manter projetos próprios, o que deve
   ser preservado, porém falta um contrato persistido que separe esses projetos
   autônomos dos projetos de estudantes recebidos para revisão.

### Altos

6. **Fallback silencioso para Aluno.** `loadUserProfile` ignora erros de consulta
   e usa `student` quando o perfil está ausente ou inválido. Autorização deve
   falhar fechada e diferenciar “não configurado” de “banco indisponível”.
7. **Checagens duplicadas e divergentes.** Cada página/rota combina perfil,
   propriedade e vínculo de forma própria; não existe um DAL canônico de ator.
8. **Consentimento confia em campo oculto.** A Server Action aceita
   `profileRole` enviado pelo cliente e pode registrar consentimento de outro
   modo; o papel deve ser lido exclusivamente do contexto autoritativo.
9. **Exposição antes do bloqueio.** A página de projeto carrega e mostra o título
   de um projeto vinculado antes de informar que o modo não permite revisão.
10. **Funções SQL não validam modo.** `set_project_advisor` e
    `claim_pending_advisor_projects` confiam apenas em identidade/propriedade ou
    e-mail; a primeira também não proíbe auto-orientação.

### Médios

11. Não há versionamento do contexto para detectar duas trocas concorrentes.
12. Não há trilha append-only de mudanças de modo.
13. Uma aba antiga só descobre a troca quando recarrega; falta sincronização de
    experiência entre abas, embora o servidor ainda deva ser a defesa real.
14. Analytics não possui evento específico de troca de modo e o QuickStart usa
    `profile_role: unknown` em parte da jornada autenticada.
15. Os tipos gerados tratam `active_role` como `string`, reduzindo a proteção do
    compilador contra valores inválidos.

## Conclusão

A solução correta é manter uma única sessão Supabase e uma única identidade,
persistir o modo ativo no banco, registrar também o perfil de autoria imutável
de cada projeto e aplicar a combinação `(modo ativo, autoria, relação)` no DAL e
na RLS. Trocar de perfil nunca altera propriedade, autoria, supervisão ou conteúdo.
