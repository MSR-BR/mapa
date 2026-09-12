# Validação

- Comparar hashes dos oito ativos principais da C78 com seu manifesto.
- Inspecionar capa e quadros dos quatro atos em resolução original.
- Ler automaticamente o QR isolado e dentro do quadro final.
- Validar o MP4 por AVFoundation: 15 s, 1080 × 1920, 30 fps e áudio.
- Registrar origem, pico e RMS dos 15 segundos usados da trilha.
- Confirmar cópias exatas no fonte determinístico.
- Executar typecheck Swift, gates do projeto, auditoria e `git diff --check`.
