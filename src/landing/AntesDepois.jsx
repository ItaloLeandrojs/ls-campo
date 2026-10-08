// Comparador antes/depois: a imagem de cima é recortada com clip-path (sem DOM extra, acelerado).
// Arrastar, tocar ou usar as setas do teclado (slider acessível).
import { useRef, useState } from "react";
import { ArrowsHorizontal } from "@phosphor-icons/react";

export default function AntesDepois({ antes, depois, rotuloAntes = "Antes", rotuloDepois = "Depois", alt = "", largura, altura }) {
  const [pct, setPct] = useState(50);
  const caixa = useRef(null);
  const arrastando = useRef(false);

  const mover = (clientX) => {
    const r = caixa.current.getBoundingClientRect();
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  const teclas = (e) => {
    const passo = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") { e.preventDefault(); setPct((p) => Math.max(0, p - passo)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setPct((p) => Math.min(100, p + passo)); }
    if (e.key === "Home") setPct(0);
    if (e.key === "End") setPct(100);
  };

  return (
    <figure className="ad-fig">
    <div
      ref={caixa} className="ad" style={{ aspectRatio: `${largura} / ${altura}` }}
      onPointerDown={(e) => { arrastando.current = true; e.currentTarget.setPointerCapture(e.pointerId); mover(e.clientX); }}
      onPointerMove={(e) => { if (arrastando.current) mover(e.clientX); }}
      onPointerUp={() => { arrastando.current = false; }}
      onPointerCancel={() => { arrastando.current = false; }}
    >
      <img src={depois} alt={`${rotuloDepois}: ${alt}`} width={largura} height={altura} draggable="false" loading="lazy" />
      <img className="ad-cima" src={antes} alt={`${rotuloAntes}: ${alt}`} width={largura} height={altura} draggable="false" loading="lazy" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
      <div className="ad-linha" style={{ left: `${pct}%` }} aria-hidden="true" />
      <div
        className="ad-alca" style={{ left: `${pct}%` }} role="slider" tabIndex={0}
        aria-label={`Comparar ${rotuloAntes.toLowerCase()} e ${rotuloDepois.toLowerCase()}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        aria-valuetext={`${Math.round(pct)}% mostrando ${rotuloAntes.toLowerCase()}`} onKeyDown={teclas}
      >
        <ArrowsHorizontal size={20} weight="bold" aria-hidden="true" />
      </div>
    </div>
    <figcaption className="ad-legenda" aria-hidden="true"><span>← {rotuloAntes}</span><span>{rotuloDepois} →</span></figcaption>
    </figure>
  );
}
