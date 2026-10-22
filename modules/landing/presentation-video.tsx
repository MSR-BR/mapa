"use client";

import { useRef, useState } from "react";
import { presentationTranscript } from "./presentation-transcript";

export function PresentationVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [rate, setRate] = useState(1);

  function changeRate(next: number) {
    if (!video.current) return;
    video.current.playbackRate = next;
    setRate(video.current.playbackRate);
  }

  return (
    <figure className="landing-video-figure">
      <div className="landing-video-shell">
        <video
          ref={video}
          aria-describedby="landing-video-description"
          aria-label="Vídeo de apresentação do Mapa da Pesquisa"
          controls
          height={976}
          playsInline
          poster="/media/mapa-da-pesquisa-apresentacao-poster.webp"
          preload="none"
          width={576}
          onRateChange={(event) => setRate(event.currentTarget.playbackRate)}
        >
          <source src="/media/mapa-da-pesquisa-apresentacao.mp4" type="video/mp4" />
          <track kind="captions" src="/media/mapa-da-pesquisa-apresentacao.pt-BR.vtt" srcLang="pt-BR" label="Português" />
          Seu navegador não oferece suporte à reprodução deste vídeo.
        </video>
      </div>
      <div className="landing-video-speeds" role="group" aria-label="Velocidade de reprodução">
        <span>Velocidade</span>
        {[1, 1.5, 2].map((speed) => (
          <button key={speed} type="button" aria-pressed={rate === speed} onClick={() => changeRate(speed)}>
            {String(speed).replace(".", ",")}×
          </button>
        ))}
      </div>
      <figcaption>Apresentação do Mapa da Pesquisa · 1 min 17 s</figcaption>
      <details className="landing-video-transcript">
        <summary>Ler transcrição do vídeo</summary>
        {presentationTranscript.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </details>
    </figure>
  );
}
