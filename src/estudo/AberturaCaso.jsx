// Abertura do estudo de caso: a tela fica presa enquanto três prints reais do sistema se sucedem com a rolagem.
// O palco é position: sticky (sem sequestrar a rolagem); o ScrollTrigger só diz em que fase a pessoa está.
// Com "reduzir movimento", as três fases aparecem uma embaixo da outra, sem prender a tela.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AberturaCaso({ fases }) {
  const secao = useRef(null);
  const [fase, setFase] = useState(0);
  const [reduz, setReduz] = useState(false);

  useEffect(() => {
    const r = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduz(r);
    if (r || !secao.current) return;
    const st = ScrollTrigger.create({
      trigger: secao.current, start: "top top", end: "bottom bottom",
      onUpdate: (s) => setFase(Math.min(fases.length - 1, Math.floor(s.progress * fases.length))),
    });
    return () => st.kill();
  }, [fases.length]);

  if (reduz) {
    return (
      <div className="ab-parado">
        {fases.map((f) => (
          <figure key={f.titulo} className={`ab-parado-fase ab-f-${f.forma}`}>
            <img src={f.img} alt={f.alt} width={f.w} height={f.h} loading="lazy" />
            <figcaption><b>{f.titulo}</b><span>{f.texto}</span></figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <section ref={secao} className="ab" style={{ height: `${fases.length * 110}dvh` }} aria-label="Como o sistema funciona, em três telas">
      <div className="ab-palco">
        <div className="ab-textos">
          {fases.map((f, i) => (
            <div key={f.titulo} className={`ab-texto${i === fase ? " ativo" : ""}`} aria-hidden={i !== fase}>
              <h2>{f.titulo}</h2>
              <p>{f.texto}</p>
            </div>
          ))}
          <ol className="ab-marcas" aria-hidden="true">
            {fases.map((f, i) => <li key={f.titulo} className={i === fase ? "ativo" : ""} />)}
          </ol>
        </div>
        <div className="ab-telas">
          {fases.map((f, i) => (
            <img key={f.titulo} src={f.img} alt={f.alt} width={f.w} height={f.h} loading={i === 0 ? "eager" : "lazy"}
              className={`ab-tela ab-f-${f.forma}${i === fase ? " ativo" : ""}${i < fase ? " passou" : ""}`} aria-hidden={i !== fase} />
          ))}
        </div>
      </div>
    </section>
  );
}
