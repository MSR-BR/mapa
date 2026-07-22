# Estratégia de deployment

## Ambientes

- Local: desenvolvimento com serviços isolados e dados sintéticos.
- Preview: um ambiente por mudança, sem dados de produção.
- Produção: promoção controlada após gates.

## Plataformas confirmadas

- Aplicação web e Route Handlers: Vercel, usando o runtime padrão do Next.js.
- Banco de dados e autenticação: Supabase, projeto `aeaweherkrqmlqnxsmib`.
- O projeto Research Starter (`ygmzwfatdbyxvpbuusmy`) permanece fora do escopo.
- Supabase deve permanecer no plano Free durante todo o projeto; recursos pagos e branches remotas estão proibidos sem nova decisão explícita do usuário.

## Pipeline

1. Instalar dependências com lockfile.
2. Executar checagem de tipos, lint e testes.
3. Gerar build imutável.
4. Aplicar migrações compatíveis antes da ativação do código dependente.
5. Executar smoke tests.
6. Promover ou reverter conforme resultado.

## Configuração e segredos

- Variáveis separadas por ambiente.
- Segredos somente no gerenciador da plataforma.
- Chaves externas com menor privilégio e rotação documentada.
- Falha rápida quando configuração obrigatória estiver ausente.

## Banco e migrações

- Migrações versionadas, revisadas e testadas em cópia não produtiva.
- Mudanças destrutivas usam estratégia expandir/migrar/contrair.
- Backup e restauração devem ser testados antes do piloto.

## Rollback

- Reversão rápida da aplicação para build anterior.
- Migrações preferencialmente compatíveis com duas versões consecutivas.
- Feature flags para geração e integrações externas quando aplicável.
- Runbook com critérios de incidente e responsáveis antes da produção.

## Limite desta decisão

Vercel e Supabase estão confirmados como arquitetura-alvo. Esta decisão não cria nem publica um projeto Vercel: a implantação real ocorre somente na Change 006 e após decisão de região e requisitos LGPD. A Change 006 deve demonstrar compatibilidade com o Supabase Free; aumento de plano não é uma alternativa automática.
