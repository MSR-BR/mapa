# Roteiro promocional para NotebookLM

## Configuração recomendada

- Artefato: `Video Overview`.
- Formato: `Brief`.
- Idioma: português do Brasil.
- Duração-alvo: aproximadamente 45–60 segundos; a duração final é controlada
  pelo NotebookLM e pode variar.
- Público: estudantes, pesquisadores e orientadores.
- Estilo visual sugerido: `Retro Print`, priorizando as capturas reais do
  aplicativo presentes nas fontes.
- Tom: moderno, motivador, confiável, direto e sem promessas exageradas.

## Prompt para o campo Personalizar

> Crie um vídeo promocional dinâmico de aproximadamente 60 segundos sobre o
> aplicativo Mapa da Pesquisa, destinado a estudantes, pesquisadores e
> orientadores.
>
> Abra com uma pergunta de impacto que represente a dificuldade de transformar
> uma ideia em um projeto de pesquisa coerente. Apresente rapidamente o problema
> e mostre o Mapa da Pesquisa como um caminho claro para organizar problemática,
> objetivos, capítulos e metodologia.
>
> Use ritmo visual crescente, cortes rápidos no início e transições fluidas.
> Priorize as capturas reais da interface fornecidas nas fontes. Não invente
> telas, funcionalidades, depoimentos, estatísticas ou resultados.
>
> Mostre que existem os modos Mapa Rápido e Mapa Avançado. Explique que a
> inteligência artificial oferece sugestões, mas que o usuário mantém o
> controle. Deixe clara a colaboração entre os perfis: o aluno desenvolve o
> projeto e o orientador revisa e valida.
>
> Use narração natural em português do Brasil e frases curtas. Se o formato
> oferecer música, prefira uma trilha eletrônica contemporânea, inspiradora e
> crescente, sem voz e sem aparência infantil.
>
> Termine com o logotipo oficial, a frase “Da primeira pergunta ao seu projeto”,
> o endereço “mapadapesquisa.com.br” e a chamada “Comece agora”.
>
> Não tente recriar ou desenhar um QR Code. Apenas reserve uma área limpa no
> encerramento para que o QR Code verdadeiro seja inserido posteriormente na
> edição.

## Roteiro-base

### 0–6 s — Impacto

**Visual:** estudante diante de anotações desconectadas, abas abertas e uma
página em branco.

**Narração:**

> Você tem uma boa ideia de pesquisa… mas não sabe como transformá-la em um
> projeto?

**Texto na tela:** `SUA PESQUISA TRAVOU?`

### 6–15 s — O problema

**Visual:** as palavras `tema`, `objetivos`, `capítulos` e `metodologia` aparecem
desorganizadas.

**Narração:**

> Quando cada parte parece seguir uma direção diferente, começar pode ser a
> etapa mais difícil.

### 15–31 s — A solução

**Visual:** entrada na interface real do Mapa da Pesquisa; os elementos se
organizam progressivamente.

**Narração:**

> O Mapa da Pesquisa organiza sua ideia em um caminho claro: problemática,
> objetivos, capítulos e metodologia.

**Texto na tela:** `UMA IDEIA. UM CAMINHO CLARO.`

### 31–43 s — Como funciona

**Visual:** alternância entre Mapa Rápido, Mapa Avançado e sugestões da IA.

**Narração:**

> Escolha o modo rápido ou avançado. A inteligência artificial ajuda a
> estruturar e sugere melhorias. Você analisa e decide.

**Texto na tela:** `A IA SUGERE. VOCÊ DECIDE.`

### 43–52 s — Aluno e orientador

**Visual:** o projeto passa do perfil do aluno para a revisão do orientador.

**Narração:**

> O aluno desenvolve. O orientador revisa. E o projeto evolui com mais clareza e
> coerência.

**Texto na tela:** `CONSTRUA. REVISE. EVOLUA.`

### 52–60 s — Encerramento

**Visual:** logotipo oficial, mockup do aplicativo, área reservada para o QR Code
real e endereço do site.

**Narração:**

> Mapa da Pesquisa. Da primeira pergunta ao seu projeto. Comece agora.

**Texto final exato:**

```text
MAPA DA PESQUISA
Da primeira pergunta ao seu projeto
mapadapesquisa.com.br
COMECE AGORA
```

## Fontes a selecionar no notebook

1. Documento de apresentação do Mapa da Pesquisa.
2. Capturas reais da home, dos modos Rápido e Avançado e das quatro macroetapas.
3. Explicação objetiva das funções dos perfis Aluno e Orientador.
4. Uma página de identidade contendo o logotipo oficial, a paleta e os textos
   exatos do encerramento.

## Finalização obrigatória fora da geração

O logotipo, os textos finais e o QR Code escaneável devem ser aplicados como
camadas determinísticas na edição final. O QR deve apontar exatamente para
`https://mapadapesquisa.com.br` e ser validado dentro do último quadro. A saída
gerada pelo NotebookLM não deve ser considerada prova de fidelidade desses
elementos.
