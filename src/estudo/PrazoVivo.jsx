// Peça viva: cada quadrado é um serviço concluído no mês. Tocar muda a data de conclusão (no prazo ou atrasado)
// e a porcentagem recalcula com a mesma função do painel de Indicadores.
import { useState } from "react";
import { ESTADO_INICIAL, calcularPrazo } from "./prazo.js";

const pct = (v) => (v === null ? "sem dados" : `${String(v).replace(".", ",")}%`);

export default function PrazoVivo() {
  const [estados, setEstados] = useState(ESTADO_INICIAL);
  const r = calcularPrazo(estados);
  const trocar = (i) => setEstados((e) => e.map((x, j) => (j === i ? !x : x)));

  return (
    <div className="pv">
      <div className="pv-numero" aria-live="polite">
        <b>{pct(r.pct)}</b>
        <span>{r.noPrazo} de {r.total} concluídos até o prazo</span>
      </div>
      <ul className="pv-grade" aria-label="Serviços concluídos em setembro">
        {estados.map((ok, i) => (
          <li key={i}>
            <button type="button" className={`pv-sv${ok ? "" : " atrasado"}`} aria-pressed={!ok} onClick={() => trocar(i)}>
              <span className="num">SV-{String(612 + i).padStart(4, "0")}</span>
              <small>{ok ? "No prazo" : "Atrasado"}</small>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="pv-volta" onClick={() => setEstados(ESTADO_INICIAL)} disabled={estados.every((x, i) => x === ESTADO_INICIAL[i])}>Voltar ao início</button>
    </div>
  );
}
