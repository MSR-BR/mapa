# Lições reutilizáveis

1. Um health de configuração deve ser acompanhado por smoke autenticado que
   percorra o mesmo backend usado pelo produto.
2. Segredos de produção devem ser reconciliados por metadados e identificadores,
   nunca por exportação ou impressão de valores.
3. Entradas de ambiente sobrepostas podem exigir remoção por ID na API do
   provedor, porque a CLI pode não distinguir alvos duplicados.
4. Em Vercel, uma faixa ampla como `>=22` pode selecionar uma versão principal
   mais nova; `22.x` fixa a linha de runtime esperada.
5. Builds limpos e auditoria de dependências fazem parte da evidência de release,
   mesmo quando o deploy anterior parecia saudável.
6. Identidade de perfil e área de trabalho são conceitos diferentes: linguagem
   neutra pode simplificar ações, mas não deve apagar quem o usuário é no sistema.
7. Capacidades visuais por papel devem derivar de um único contrato testável,
   enquanto autorização continua sendo aplicada no servidor e no banco.
8. Textos explicativos de estado permanente devem aparecer somente quando ajudam
   uma decisão atual; em menus compactos, o rótulo explícito do perfil pode ser
   suficiente.
9. Em peças promocionais com conteúdo exato, a geração visual deve ficar restrita
   às cenas abertas; marca, texto, URL e QR Code precisam de composição
   determinística e validação automatizada.
10. A inspeção de quadros exportados é indispensável mesmo quando duração,
    resolução e codec passam, pois transformações de canvas podem inverter todo o
    vídeo sem provocar erro técnico.
11. Um vídeo explicativo não se torna anúncio apenas com boa aparência: o
    primeiro segundo precisa interromper o scroll, o produto deve protagonizar
    uma transformação e a música precisa construir energia até o CTA.
12. Revisões criativas devem manter a versão aprovada em diretório e hash
    próprios; uma nova direção é uma nova entrega, não uma sobrescrita.
13. Em plataformas de vídeo fundamentadas em fontes, o roteiro pode orientar a
    narrativa, mas duração, narração e composição continuam não determinísticas;
    logo, texto, URL e QR Code precisam de uma etapa final controlada.
14. Vídeo promocional abaixo da dobra deve reservar espaço por dimensões ou
    `aspect-ratio`, mostrar poster representativo e usar carregamento sob demanda;
    autoplay com áudio não deve ser requisito de conversão.
