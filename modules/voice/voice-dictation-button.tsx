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
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      if (!field.isConnected || field.disabled || field.readOnly) return;
      const transcript = Array.from(event.results).filter((result) => result.isFinal).map((result) => result[0]?.transcript ?? "").join(" ");
      const result = insertDictation(field.value, transcript, caretRef.current ?? field.value.length, field.maxLength);
      if (result.value !== field.value) {
        // Use the native setter so React's controlled onChange receives the input event.
        const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        setter?.call(field, result.value);
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.setSelectionRange(result.caret, result.caret);
        caretRef.current = result.caret;
      }
      if (result.truncated) setMessage("O limite deste campo foi atingido; revise o texto antes de continuar.");
      field.focus();
    };
    recognition.onerror = (event) => {
      setMessage(event.error === "not-allowed" ? "Permita o uso do microfone no navegador para ditar." : "Não foi possível reconhecer a fala. Você pode continuar digitando.");
      recognitionRef.current = null;
      setListening(false);
      try { recognition.stop(); } catch { /* The browser may already have stopped it. */ }
    };
    recognition.onend = () => { recognitionRef.current = null; setListening(false); };
    try { recognitionRef.current = recognition; recognition.start(); setListening(true); setMessage(""); }
    catch { recognitionRef.current = null; setListening(false); setMessage("O microfone não pôde ser iniciado."); }
  }

  return <span className="voice-dictation">
    <button aria-label={`${listening ? "Parar ditado" : "Ditar texto"}: ${label}`} aria-pressed={listening} className="voice-dictation-button" onClick={toggle} title="O navegador pode processar a fala em seu serviço de reconhecimento; o Mapa não grava o áudio." type="button">{listening ? "■ Parar" : "🎙 Ditar"}</button>
    {listening ? <small role="status">Ouvindo… O navegador pode processar a fala em seu serviço de reconhecimento.</small> : null}
    {message ? <small role="status">{message}</small> : null}
  </span>;
}
