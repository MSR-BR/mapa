# Decisões

1. `RESEARCH_STARTER_MAPA_API_KEY` é o único nome canônico.
2. O teste operacional oficial é o caminho autenticado do produto publicado.
3. O arquivo local não recebe cópia do segredo oculto de produção.
4. Node.js usa `22.x`, permitindo apenas atualizações minor/patch da linha 22.
5. `esbuild` e `unrs-resolver` são dependências transitivas de desenvolvimento;
   seus postinstalls serão negados explicitamente enquanto lint, testes e build
   funcionarem com os binários opcionais já distribuídos.
6. Atualizações de segurança permanecem dentro das versões principais já
   adotadas: Next.js 16.3.5, Resend 6.28, Tailwind 4.3.3, PostCSS 8.5.28 e
   Sharp 0.35.4.
7. Nenhuma correção automática com `--force` é aceita sem nova Change e análise
   explícita de compatibilidade.
