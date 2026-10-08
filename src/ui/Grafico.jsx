// Gráficos de barras em HTML (uma série, cor do acento). Barras crescem da base, meta se traça,
// dica ao passar o mouse ou focar, tabela para leitor de tela. "Reduzir movimento" desliga o crescimento.
import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

const fmt = (v, casas = 0) => (v === null || v === undefined ? "Sem dados" : v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }));

/** Número que conta do valor anterior até o novo. */
export function Numero({ valor, casas = 0, sufixo = "" }) {
  const ref = useRef(null);
  const anterior = useRef(0);
  const reduz = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (valor === null || valor === undefined) { el.textContent = "Sem dados"; return; }
    if (reduz) { el.textContent = fmt(valor, casas) + sufixo; anterior.current = valor; return; }
    const c = animate(anterior.current, valor, { duration: 0.7, ease: [0.23, 1, 0.32, 1], onUpdate: (v) => { el.textContent = fmt(v, casas) + sufixo; } });
    anterior.current = valor;
    return () => c.stop();
  }, [valor, casas, sufixo, reduz]);
  return <span ref={ref} className="num-valor">{fmt(valor, casas)}{valor === null || valor === undefined ? "" : sufixo}</span>;
}

function TabelaOculta({ titulo, dados, unidade }) {
  return (
    <table className="sr-only">
      <caption>{titulo}</caption>
      <tbody>{dados.map((d) => <tr key={d.rotulo}><th scope="row">{d.rotulo}</th><td>{fmt(d.valor, d.casas || 0)}{unidade}</td></tr>)}</tbody>
    </table>
  );
}

/** Barras verticais (ex.: % no prazo por mês) com linha de meta opcional. */
export function BarrasV({ titulo, dados, max = 100, meta, unidade = "%", chave }) {
  const reduz = useReducedMotion();
  return (
    <figure className="graf graf-v" aria-label={titulo}>
      <div className="graf-v-area" aria-hidden="true">
        {meta !== undefined && (
          <div className="graf-v-plot">
            <div className="graf-meta" style={{ bottom: `${(meta / max) * 100}%` }}><i /><span>Meta {meta}{unidade}</span></div>
          </div>
        )}
        {dados.map((d, i) => (
          <div key={d.rotulo} className="graf-v-col" tabIndex={0}>
            <span className="graf-v-valor num-valor">{fmt(d.valor, d.casas || 0)}{d.valor === null ? "" : unidade}</span>
            <div className="graf-v-trilho">
              <i className={`graf-v-barra${d.fraco ? " fraco" : ""}`} style={{ transform: `scaleY(${Math.max(0, Math.min(1, (d.valor || 0) / max))})`, transitionDelay: reduz ? "0ms" : `${i * 40}ms` }} />
            </div>
            <span className="graf-rotulo">{d.rotulo}</span>
            {d.dica && <span className="graf-dica" role="tooltip">{d.dica}</span>}
          </div>
        ))}
      </div>
      <TabelaOculta titulo={titulo} dados={dados} unidade={unidade} />
    </figure>
  );
}

/** Barras horizontais em ranking (ex.: motivos, ocupação por equipe). */
export function BarrasH({ titulo, dados, max, unidade = "", destaque, chave }) {
  const reduz = useReducedMotion();
  const topo = max ?? Math.max(1, ...dados.map((d) => d.valor || 0));
  return (
    <figure className="graf graf-h" aria-label={titulo}>
      <ul className="graf-h-lista" aria-hidden="true">
        {dados.map((d, i) => (
          <li key={d.rotulo} className={destaque && destaque !== d.id ? "apagado" : ""} tabIndex={0}>
            <span className="graf-rotulo">{d.rotulo}</span>
            <span className="graf-h-trilho">
              <i className="graf-h-barra" style={{ transform: `scaleX(${Math.max(0, Math.min(1, (d.valor || 0) / topo))})`, transitionDelay: reduz ? "0ms" : `${i * 40}ms` }} />
            </span>
            <span className="graf-h-valor num-valor">{fmt(d.valor, d.casas || 0)}{unidade}</span>
            {d.dica && <span className="graf-dica" role="tooltip">{d.dica}</span>}
          </li>
        ))}
      </ul>
      <TabelaOculta titulo={titulo} dados={dados} unidade={unidade} />
    </figure>
  );
}

export function useChaveAnimacao(...deps) {
  const [k, setK] = useState(0);
  useEffect(() => { setK((x) => x + 1); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return k;
}
