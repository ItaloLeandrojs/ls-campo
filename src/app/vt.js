// Transição entre telas com a View Transitions API do navegador.
// Sem suporte ou com "reduzir movimento", troca direto.
import { flushSync } from "react-dom";

export const reduzMovimento = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function comTransicao(fn) {
  if (typeof document === "undefined" || !document.startViewTransition || reduzMovimento()) { fn(); return; }
  document.startViewTransition(() => flushSync(fn));
}

export function navegar(navigate, rota) {
  comTransicao(() => navigate(rota));
}
