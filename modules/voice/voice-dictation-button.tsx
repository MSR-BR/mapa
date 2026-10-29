"use client";

import { useEffect, useRef, useState } from "react";
import { insertDictation } from "./voice-dictation";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function VoiceDictationButton({ targetId, label }: { targetId: string; label: string }) {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const caretRef = useRef<number | null>(null);

  useEffect(() => {
    const field = document.getElementById(targetId);
    const editable = field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement ? field : null;
    const rememberCaret = () => { caretRef.current = editable?.selectionStart ?? null; };
    editable?.addEventListener("select", rememberCaret);
    editable?.addEventListener("keyup", rememberCaret);
    editable?.addEventListener("click", rememberCaret);
    editable?.addEventListener("input", rememberCaret);
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      editable?.removeEventListener("select", rememberCaret);
      editable?.removeEventListener("keyup", rememberCaret);
      editable?.removeEventListener("click", rememberCaret);
      editable?.removeEventListener("input", rememberCaret);
    };
  }, [targetId]);

  function toggle() {
    if (recognitionRef.current) { recognitionRef.current.stop(); return; }
    const field = document.getElementById(targetId);
    const isTextField = field instanceof HTMLTextAreaElement
      || (field instanceof HTMLInputElement && ["text", "search"].includes(field.type));
    if (!isTextField || field.disabled || field.readOnly) {
      setMessage("Este campo não está disponível para ditado agora.");
      return;
    }
    const browser = window as RecognitionWindow;
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!SpeechRecognition) { setMessage("Ditado indisponível neste navegador. Continue digitando normalmente."); return; }
    const recognition = new SpeechRecognition();
    const committedResults = new Set<number>();
    const interimResults = new Map<number, string>();
    let insertedText = false;
    let hadError = false;
    let ended = false;
    const insertTranscript = (transcript: string) => {
      const currentField = document.getElementById(targetId);
      const editable = currentField instanceof HTMLTextAreaElement
        || (currentField instanceof HTMLInputElement && ["text", "search"].includes(currentField.type))
        ? currentField : null;
      if (!editable || editable.disabled || editable.readOnly) {
        setMessage("Este campo não está disponível para receber o ditado agora.");
        return;
      }
      const result = insertDictation(editable.value, transcript, caretRef.current ?? editable.value.length, editable.maxLength);
      if (result.value !== editable.value) {
        // The native setter and bubbling input event update React-controlled fields too.
        const prototype = editable instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        setter?.call(editable, result.value);
        const inputEvent = typeof InputEvent === "function"
          ? new InputEvent("input", { bubbles: true, inputType: "insertText", data: transcript })
          : new Event("input", { bubbles: true });
        editable.dispatchEvent(inputEvent);
        editable.setSelectionRange(result.caret, result.caret);
        caretRef.current = result.caret;
        insertedText = true;
      }
      if (result.truncated) setMessage("O limite deste campo foi atingido; revise o texto antes de continuar.");
      editable.focus();
    };
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      if (ended || hadError) return;
      for (const [index, result] of Array.from(event.results).entries()) {
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (result.isFinal) {
          interimResults.delete(index);
          if (!committedResults.has(index) && transcript) {
            committedResults.add(index);
            insertTranscript(transcript);
          }
        } else if (transcript && !committedResults.has(index)) {
          interimResults.set(index, transcript);
        }
      }
    };
    recognition.onerror = (event) => {
      hadError = true;
      setMessage(event.error === "not-allowed" ? "Permita o uso do microfone no navegador para ditar." : "Não foi possível reconhecer a fala. Você pode continuar digitando.");
      recognitionRef.current = null;
      setListening(false);
      try { recognition.stop(); } catch { /* The browser may already have stopped it. */ }
    };
    recognition.onend = () => {
      if (ended) return;
      ended = true;
      if (!hadError) {
        const pending = Array.from(interimResults.values()).join(" ").trim();
        if (pending) insertTranscript(pending);
        else if (!insertedText) setMessage("Nenhum texto foi reconhecido. Tente falar novamente ou digite normalmente.");
      }
      interimResults.clear();
      recognitionRef.current = null;
      setListening(false);
    };
    try { recognitionRef.current = recognition; recognition.start(); setListening(true); setMessage(""); }
    catch { recognitionRef.current = null; setListening(false); setMessage("O microfone não pôde ser iniciado."); }
  }

  return <span className="voice-dictation">
    <button aria-label={`${listening ? "Parar ditado" : "Ditar texto"}: ${label}`} aria-pressed={listening} className="voice-dictation-button" onClick={toggle} title="O navegador pode processar a fala em seu serviço de reconhecimento; o Mapa não grava o áudio." type="button">{listening ? "■ Parar" : "🎙 Ditar"}</button>
    {listening ? <small role="status">Ouvindo… O navegador pode processar a fala em seu serviço de reconhecimento.</small> : null}
    {message ? <small role="status">{message}</small> : null}
  </span>;
}
