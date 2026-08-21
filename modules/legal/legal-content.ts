export const LEGAL_TERMS_VERSION = "1.1.0";

export const LEGAL_PROFILE_COPY = {
  student: {
    roleLabel: "estudante",
    intro: "Como estudante, você cria o mapa, registra suas justificativas e envia cada etapa ao orientador vinculado quando a revisão for necessária.",
    checkbox: "Li e aceito os Termos de uso e a Política de privacidade para usar o Mapa como estudante.",
  },
  advisor: {
    roleLabel: "orientador",
    intro: "Como orientador, você pode criar projetos próprios e, quando estiver vinculado a um estudante, ler, comentar e validar as etapas enviadas para sua orientação.",
    checkbox: "Li e aceito os Termos de uso e a Política de privacidade para usar o Mapa como orientador.",
  },
} as const;

export const LEGAL_CONTENT = {
  terms: {
    title: "Termos de uso",
    paragraphs: [
      "O Mapa da Pesquisa é uma ferramenta de apoio à organização de projetos acadêmicos. Ele transforma as informações fornecidas pelo usuário em sugestões de problemática, objetivos, capítulos, metodologia e resultados esperados.",
      "O usuário é responsável por revisar, justificar e validar o conteúdo antes de utilizá-lo em uma pesquisa, com apoio do orientador quando houver vínculo. Sugestões geradas por IA não substituem orientação acadêmica, revisão humana, normas da instituição ou avaliação ética.",
      "As referências e buscas do Research Starter podem ser incompletas, desatualizadas ou inadequadas ao recorte escolhido. Confira autoria, metadados, acesso ao texto e pertinência de cada fonte antes de citá-la.",
      "Ao aceitar, você concorda com o armazenamento do projeto, com o histórico de validações e com o recebimento de e-mails transacionais sobre ações que exigem sua atenção. Essas mensagens não são publicidade.",
      "Você declara que tem autorização para inserir o conteúdo enviado e se compromete a não inserir senhas, chaves, dados pessoais sensíveis ou dados de participantes que não sejam necessários ao planejamento da pesquisa.",
      "O serviço pode usar provedores técnicos de autenticação, hospedagem, IA, pesquisa, analytics e e-mail para operar o Mapa. O uso pode ser interrompido ou limitado para manutenção, segurança ou cumprimento de obrigações legais.",
    ],
  },
  privacy: {
    title: "Privacidade",
    paragraphs: [
      "Podemos armazenar identificadores da conta e do perfil, e-mail, papel (estudante ou orientador), projetos, entradas, referências, justificativas, comentários, vínculos de orientação, histórico de validações e registros do aceite.",
      "Usamos esses dados para autenticação, continuidade entre dispositivos, vínculo aluno–orientador, geração do mapa, associação de referências, suporte, segurança e notificações transacionais.",
      "O conteúdo necessário à geração e à busca bibliográfica pode ser enviado, de forma controlada pelo backend, a provedores técnicos como Supabase, Vercel, Gemini, Research Starter, Resend e Google Analytics quando você autorizar analytics. Cada provedor trata os dados segundo seus próprios termos.",
      "Não vendemos dados pessoais. Restringimos o acesso por autenticação, políticas de segurança e regras de acesso por proprietário. Projetos e comentários não ficam disponíveis para outros usuários sem vínculo autorizado.",
      "Mantemos os dados enquanto a conta ou o projeto forem necessários ao serviço e para registros de segurança, suporte e validação. Quando um projeto é excluído, ele deixa de aparecer na aplicação e a purga dos derivados segue o procedimento de retenção do piloto, com alvo de até 30 dias; cópias de backup podem levar mais tempo para serem substituídas.",
      "Para solicitar suporte ou exercer direitos sobre seus dados, escreva para suporte@mapadapesquisa.com.br.",
    ],
  },
  support: {
    title: "Suporte",
    paragraphs: [
      "Descreva o problema no uso do aplicativo, informe a etapa do projeto e, se possível, inclua o navegador e o horário aproximado. Não envie senhas, chaves, tokens ou dados sensíveis.",
      "Sua mensagem será encaminhada para a equipe do Mapa da Pesquisa por suporte@mapadapesquisa.com.br e poderá ser respondida para o e-mail informado no formulário.",
    ],
  },
  credits: {
    title: "Créditos",
    paragraphs: [
      "Sérgio França",
      "Departamento de Engenharia Civil · Escola de Engenharia · Universidade Federal Fluminense",
      "Mario Reis",
      "Instituto de Física · Universidade Federal Fluminense",
    ],
  },
} as const;
