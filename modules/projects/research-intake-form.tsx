"use client";

import { useEffect, useState, type KeyboardEvent } from "react";

import {
  RESEARCH_INTAKE_FIELDS,
  type ResearchIntakeDraft,
} from "./research-intake";
import {
  RESEARCH_PRODUCT_TYPES,
  type ResearchProductType,
} from "@/modules/research-workflow/research-level-guidance";

type ResearchIntakeFormProps = {
  value: ResearchIntakeDraft;
  onChange: (value: ResearchIntakeDraft) => void;
  showResearchType?: boolean;
};

const GUIDANCE_ROWS: Array<[string, keyof (typeof RESEARCH_PRODUCT_TYPES)[number]["dimensions"]]> = [
  ["Finalidade", "finalidade"],
  ["Problema", "problema"],
  ["Lacuna", "lacuna"],
  ["Originalidade", "originalidade"],
  ["Revisão da literatura", "literatura"],
  ["Metodologia", "metodologia"],
  ["Dados e evidências", "dados"],
  ["Análise", "analise"],
  ["Discussão", "discussao"],
  ["Contribuição", "contribuicao"],
];

export function ResearchIntakeForm({ value, onChange, showResearchType = false }: ResearchIntakeFormProps) {
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenInfo(null);
        setShowGuide(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function updateField(name: keyof ResearchIntakeDraft, nextValue: string) {
    onChange({ ...value, [name]: nextValue });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.currentTarget.name !== "delimitationQuestion") return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="research-intake">
      <div className="research-intake-intro">
        <div>
          <p className="research-intake-kicker">Cinco perguntas para começar</p>
          <h2>Formule a situação-problema</h2>
          <p>Suas respostas serão reunidas em um briefing para a IA e para o Research Starter. Escreva com suas palavras; você poderá revisar as propostas depois.</p>
        </div>
        <span className="research-intake-required">Todos os campos são obrigatórios</span>
      </div>

      {showResearchType ? (
        <section className="research-type-picker" aria-labelledby="research-type-title">
          <div className="research-intake-section-heading">
            <div>
              <p className="research-intake-kicker">Produto acadêmico</p>
              <h3 id="research-type-title">Que tipo de pesquisa você vai produzir?</h3>
              <p>Essa escolha ajusta extensão, rigor, profundidade da literatura e expectativa de contribuição em todas as etapas.</p>
            </div>
            <button className="research-info-button" onClick={() => setShowGuide(true)} type="button" aria-label="Ver guia de aprofundamento">i</button>
          </div>
          <div className="research-type-grid" role="radiogroup" aria-label="Tipo de pesquisa">
            {RESEARCH_PRODUCT_TYPES.map((item) => (
              <label className={`research-type-option ${value.researchType === item.id ? "is-selected" : ""}`} key={item.id}>
                <input
                  checked={value.researchType === item.id}
                  name="researchType"
                  onChange={() => onChange({ ...value, researchType: item.id as ResearchProductType })}
                  required
                  type="radio"
                  value={item.id}
                />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.shortDescription}</small>
                </span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <div className="research-intake-fields">
        {RESEARCH_INTAKE_FIELDS.map((field, index) => (
          <section className="research-intake-field" key={field.name}>
            <div className="research-intake-label-row">
              <label htmlFor={`research-intake-${field.name}`}><span>{index + 1}</span>{field.label}<sup>*</sup></label>
              <button className="research-info-button" onClick={() => setOpenInfo(field.name)} type="button" aria-label={`Instruções: ${field.label}`}>i</button>
            </div>
            <textarea
              id={`research-intake-${field.name}`}
              maxLength={2_000}
              minLength={10}
              name={field.name}
              onChange={(event) => updateField(field.name, event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={field.placeholder}
              required
              rows={3}
              value={value[field.name]}
            />
          </section>
        ))}
      </div>

      <input name="intakeJson" type="hidden" value={JSON.stringify(value)} />

      {openInfo ? (
        <div className="research-info-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpenInfo(null); }}>
          <div className="research-info-dialog" role="dialog" aria-modal="true" aria-labelledby="research-info-title">
            <button className="dialog-close" onClick={() => setOpenInfo(null)} type="button" aria-label="Fechar">×</button>
            <p className="research-intake-kicker">Como responder</p>
            <h3 id="research-info-title">{RESEARCH_INTAKE_FIELDS.find((field) => field.name === openInfo)?.label}</h3>
            <p>{RESEARCH_INTAKE_FIELDS.find((field) => field.name === openInfo)?.help}</p>
          </div>
        </div>
      ) : null}

      {showGuide ? (
        <div className="research-info-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowGuide(false); }}>
          <div className="research-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="research-guide-title">
            <button className="dialog-close" onClick={() => setShowGuide(false)} type="button" aria-label="Fechar">×</button>
            <p className="research-intake-kicker">Guia de profundidade</p>
            <h3 id="research-guide-title">O produto escolhido orienta todo o mapa</h3>
            <p>O Mapa ajusta a densidade da revisão, o rigor metodológico e a contribuição esperada. A tabela resume as diferenças principais.</p>
            <div className="research-guide-table-wrap"><table className="research-guide-table"><thead><tr><th>Dimensão</th><th>{RESEARCH_PRODUCT_TYPES.find((item) => item.id === value.researchType)?.label ?? "Produto selecionado"}</th></tr></thead><tbody>
              {(value.researchType ? RESEARCH_PRODUCT_TYPES.find((item) => item.id === value.researchType) : RESEARCH_PRODUCT_TYPES[0])?.dimensions && GUIDANCE_ROWS.map(([label, key]) => {
                const selected = value.researchType ? RESEARCH_PRODUCT_TYPES.find((item) => item.id === value.researchType) : RESEARCH_PRODUCT_TYPES[0];
                return <tr key={key}><th>{label}</th><td>{selected?.dimensions[key]}</td></tr>;
              })}
            </tbody></table></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
