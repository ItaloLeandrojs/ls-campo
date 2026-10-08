import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";

/** Diálogo nativo (<dialog> com showModal): foco preso, Esc fecha, fundo inerte. */
export default function Dialogo({ aberto, aoFechar, titulo, children, rodape, largura = 480 }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);
  return (
    <dialog ref={ref} className="dialogo" style={{ maxWidth: largura }} onClose={aoFechar} onCancel={(e) => { e.preventDefault(); aoFechar(); }}
      onClick={(e) => { if (e.target === ref.current) aoFechar(); }} aria-labelledby="dialogo-titulo">
      {aberto && (
        <div className="dialogo-miolo">
          <header className="dialogo-topo">
            <h2 id="dialogo-titulo">{titulo}</h2>
            <button type="button" className="btn btn-fantasma btn-icone" aria-label="Fechar" onClick={aoFechar}><X size={20} /></button>
          </header>
          <div className="dialogo-corpo">{children}</div>
          {rodape && <footer className="dialogo-pe">{rodape}</footer>}
        </div>
      )}
    </dialog>
  );
}
