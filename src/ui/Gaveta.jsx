import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";

/** Painel lateral (gaveta) sobre <dialog>: foco preso, Esc fecha, desliza da direita. */
export default function Gaveta({ aberto, aoFechar, titulo, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);
  return (
    <dialog ref={ref} className="gaveta" onClose={aoFechar} onCancel={(e) => { e.preventDefault(); aoFechar(); }}
      onClick={(e) => { if (e.target === ref.current) aoFechar(); }} aria-labelledby="gaveta-titulo">
      {aberto && (
        <div className="gaveta-miolo">
          <header className="gaveta-topo">
            <h2 id="gaveta-titulo">{titulo}</h2>
            <button type="button" className="btn btn-fantasma btn-icone" aria-label="Fechar" onClick={aoFechar}><X size={20} /></button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
