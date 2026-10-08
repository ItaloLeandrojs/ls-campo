import { useEffect } from "react";

/** Carimbo de concluído: círculo e ✓ se desenham (CSS, fora da thread principal) e o celular vibra de leve. */
export default function Carimbo({ texto = "Concluído" }) {
  useEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(30);
  }, []);
  return (
    <div className="carimbo" role="status" aria-live="assertive">
      <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
        <circle className="carimbo-circulo" cx="60" cy="60" r="52" pathLength="1" />
        <path className="carimbo-check" d="M38 62 L54 77 L84 45" pathLength="1" />
      </svg>
      <b>{texto}</b>
    </div>
  );
}
