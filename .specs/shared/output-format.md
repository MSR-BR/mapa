# Formato de saída

## Estrutura canônica

A geração retorna um objeto versionado; HTML livre nunca é a fonte de verdade.

```text
ResearchStructure
├── schemaVersion
├── title
├── chapters[]
│   ├── id
│   ├── number
│   ├── title
│   └── sections[]
│       ├── id
│       ├── title
│       ├── content
│       ├── optional
│       ├── provenance
│       └── referenceIds[]
└── warnings[]
```

## Capítulos mínimos

1. Introdução: contextualização, situação-problema, objetivo geral, objetivos específicos, questões, delimitação opcional e organização.
2. Revisão da Literatura: tópicos iniciais de fundamentação teórica.
3. Metodologia Científica: classificação, coleta e análise/tratamento.
4. Desenvolvimento da Pesquisa: tópicos previstos.
5. Conclusões: conclusões esperadas como planejamento e trabalhos futuros, nunca resultados inventados.

## Regras editoriais

- Português do Brasil por padrão.
- Títulos curtos e consistentes.
- Conteúdo editável em texto seguro.
- Campos ausentes são omitidos; não recebem fatos fictícios.
- Avisos de incerteza permanecem visíveis na exportação.

## DOCX e PDF

- Preset acadêmico narrativo, página Carta e margens de 1 polegada.
- Capa editorial simples com título e metadados disponíveis.
- Sumário estático e hierarquia real de títulos.
- Quebra lógica por capítulo.
- Referências verificadas com links quando disponíveis.
- Rodapé com versão, data, paginação e aviso de revisão.
- O conteúdo corresponde exclusivamente à última versão salva confirmada.
- O download é autenticado, privado, `no-store` e produzido em memória.
