# Change 035 — Teste E2E aluno–orientador

## Objetivo

Validar, com duas contas isoladas e sem dados simulados tratados como sucesso, o
fluxo completo de um estudante e de um orientador no domínio de produção.

## Submudanças

1. Configurar `MAPA_E2E_STUDENT_EMAIL`, `MAPA_E2E_ADVISOR_EMAIL` e
   `MAPA_E2E_PASSWORD` somente no ambiente de execução seguro.
2. Criar ou confirmar os perfis aluno e orientador e o vínculo por e-mail.
3. Executar login, escolha de perfil, logout, retorno e recuperação de sessão.
4. Criar um mapa pelo Mapa Avançado e outro pelo Mapa Rápido.
5. Testar cards de descoberta, seleção, justificativas, referências e avanço por
   todas as etapas.
6. Testar envio para o orientador, comentário, solicitação de correção,
   validação e bloqueio do avanço enquanto a etapa estiver pendente.
7. Confirmar notificações, destinatários, assunto, link direto e `reply-to`.
8. Testar salvar rascunho, fechar o navegador, retomar em outro dispositivo,
   concluir o mapa e separar projetos em andamento/concluídos/integrados.
9. Testar integração de projetos e exportação PDF, inclusive referências e
   cabeçalho/rodapé do Mapa da Pesquisa.
10. Registrar evidências sem armazenar senhas, tokens, prompts privados ou
    conteúdo acadêmico fora do banco autorizado.

## Critérios de aceite

- O aluno não consegue validar como orientador.
- O orientador vê somente projetos vinculados à sua conta.
- Cada intervenção produz no máximo uma notificação por destinatário/evento.
- A sessão e o estágio do projeto são recuperados após logout e novo login.
- PDF e notificações são entregues com conteúdo, links e referências esperados.
- O relatório registra resultado por cenário, evidência e risco residual.

## Execução e evidências — 20/08/2026

Comando executado:

```bash
npm run supabase:verify-advisor-student
```

Resultado: `status: ok`.

- Login aluno e orientador: aprovado.
- Perfis aluno/orientador e vínculo: aprovados.
- Leitura supervisionada e bloqueio de edição pelo orientador: aprovados.
- Comentário, solicitação de correção e revalidação: aprovados.
- Aprovação das etapas: 7 aprovações em 8 revisões registradas.
- Mapa final concluído e referências associadas: aprovados; 3 referências verificadas.
- Projeto temporário: removido pelo próprio runner após a execução.
- Nenhum projeto real foi alterado.

Complementos automatizados:

- `npm test`: 61 testes aprovados, incluindo contratos de notificações, perfis,
  gates de orientação, referências e exportação PDF.
- `npm run exports:verify`: verificação do PDF concluída sem erro (`pdfBytes: 14682`).

Observação operacional: a senha E2E precisava estar entre aspas no `.env.local`, pois contém
`#`; sem as aspas, o carregador de ambiente truncava a senha e o login falhava.

### CPD

Change 035 concluída. Os cenários cobertos pelo runner passaram e a limpeza do dado temporário
foi confirmada. Permanecem fora deste gate as verificações externas específicas de Resend,
Google OAuth, PDF/DOCX e domínio, que continuam cobertas pelas Changes 034, 036, 037 e 039.
