// Cena presa na rolagem: a agenda da semana se preenche e três frases contam o fluxo.
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
    const st = ScrollTrigger.create({ trigger: secao, start: "top 64px", end: "+=250%", onUpdate: (s) => setFase(Math.min(2, Math.floor(s.progress * 3))) });
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

export default function CenaAgenda({ base }) {
  return (
    <ScrollSequence
      pasta={`${base}seq/agenda`} pastaCelular={`${base}seq/agenda-celular`} quadros={120} rolagem={2.5} ajuste="contain" topo={64}
      poster={`${base}seq/agenda/0120.webp`} alt="Agenda da semana sendo preenchida, serviço por serviço, nas linhas das equipes" className="cena"
    >
      <Frases />
    </ScrollSequence>
  );
}
