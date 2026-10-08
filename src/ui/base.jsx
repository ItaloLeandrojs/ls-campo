// Peças pequenas reutilizadas em todas as telas.
import { ROTULO_ETAPA } from "../dominio/tipos.js";

export function Selo({ etapa }) {
  return <span className={`selo selo-${etapa}`}>{ROTULO_ETAPA[etapa]}</span>;
}

export function Botao({ variante = "secundario", grande, icone, className = "", children, ...resto }) {
  return (
    <button type="button" className={`btn btn-${variante}${grande ? " btn-grande" : ""}${icone && !children ? " btn-icone" : ""} ${className}`.trim()} {...resto}>
      {icone}
      {children}
    </button>
  );
}

export function Vazio({ titulo, children }) {
  return (
    <div className="vazio">
      <b>{titulo}</b>
      {children && <p>{children}</p>}
    </div>
  );
}

export const base = import.meta.env.BASE_URL;
