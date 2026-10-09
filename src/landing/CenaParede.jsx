// Cena presa na rolagem: a anatomia de uma parede (bloco, reboco, tinta terracota) e três frases contam o fluxo.
// Vídeo gerado com IA no Google Flow (Veo 3.1 Fast) em 2 etapas (blocos > reboco > tinta), 720p nativo sem ampliação,
// convertido em quadros de 1280 px com bordas esfumadas: public/seq/parede. A cena não passa de 1280 px para não esticar.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollSequence from "./ScrollSequence.jsx";

gsap.registerPlugin(ScrollTrigger);

const FRASES = [
  ["O pedido chega.", "Cliente, tipo de serviço, prazo e prioridade entram na lista a agendar."],
  ["A equipe certa, no turno certo.", "O sistema só aceita equipe com a especialidade e turno livre."],
  ["Retorno com foto e checklist.", "A equipe fecha o serviço no celular e o indicador já muda."],
];

function Frases() {
  const ref = useRef(null);
  const [fase, setFase] = useState(0);
  const [reduz, setReduz] = useState(false);
  useEffect(() => {
    const r = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduz(r);
    if (r) return;
    const secao = ref.current?.closest(".seq");
    if (!secao) return;
    const st = ScrollTrigger.create({ trigger: secao, start: "top 64px", end: "+=300%", onUpdate: (s) => setFase(Math.min(2, Math.floor(s.progress * 3))) });
    return () => st.kill();
  }, []);
  return (
    <div ref={ref} className="cena-frases">
      {FRASES.map(([t, d], i) => (
        <div key={t} className={`cena-frase${reduz || i === fase ? " ativa" : ""}${!reduz && i < fase ? " passou" : ""}`} aria-hidden={!reduz && i !== fase}>
          <b>{t}</b><span>{d}</span>
        </div>
      ))}
    </div>
  );
}

export default function CenaParede({ base }) {
  return (
    <ScrollSequence
      pasta={`${base}seq/parede`} pastaCelular={`${base}seq/parede-celular`} quadros={168} rolagem={3} ajuste="contain" larguraMax={1280} topo={64}
      poster={`${base}seq/parede/0168.webp`} alt="Parede de blocos de concreto recebendo reboco e depois tinta terracota, em estúdio escuro" className="cena"
    >
      <Frases />
    </ScrollSequence>
  );
}
