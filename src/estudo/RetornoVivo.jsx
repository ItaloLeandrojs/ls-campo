// Peça viva: o checklist real da pintura. O botão de enviar só libera com os itens obrigatórios marcados,
// igual à tela da equipe no sistema.
import { useState } from "react";
import { CheckCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { TIPO } from "../dominio/tipos.js";

const ITENS = TIPO.pintura.checklist;

export default function RetornoVivo() {
  const [marcados, setMarcados] = useState({});
  const [enviado, setEnviado] = useState(false);
  const faltam = ITENS.filter((i) => i.obrigatorio && !marcados[i.id]).length;
  const trocar = (id) => setMarcados((m) => ({ ...m, [id]: !m[id] }));

  if (enviado) {
    return (
      <div className="rv rv-enviado" role="status">
        <CheckCircle size={40} weight="duotone" aria-hidden="true" />
        <b>Retorno enviado.</b>
        <p>O planejador já vê o serviço como concluído, com o checklist e a hora do envio.</p>
        <button type="button" className="rv-volta" onClick={() => { setMarcados({}); setEnviado(false); }}><ArrowCounterClockwise size={16} /> Fazer de novo</button>
      </div>
    );
  }

  return (
    <form className="rv" onSubmit={(e) => { e.preventDefault(); if (!faltam) setEnviado(true); }}>
      <fieldset>
        <legend>Pintura do hall de entrada</legend>
        {ITENS.map((i) => (
          <label key={i.id} className="rv-item">
            <input type="checkbox" checked={!!marcados[i.id]} onChange={() => trocar(i.id)} />
            <span>{i.texto}{!i.obrigatorio && <small> opcional</small>}</span>
          </label>
        ))}
      </fieldset>
      <button type="submit" className="rv-enviar" disabled={faltam > 0}>
        {faltam ? `Faltam ${faltam} ${faltam > 1 ? "itens obrigatórios" : "item obrigatório"}` : "Enviar retorno"}
      </button>
    </form>
  );
}
