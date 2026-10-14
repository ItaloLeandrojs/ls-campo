// Saída da abertura e imagens carregando com o logo. Roda no navegador (script do Abertura.astro).
import { esperaParaSair, CICLO } from "./abertura-tempo.js";

const reduz = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const umaVez = (alvo, evento) => new Promise((r) => alvo.addEventListener(evento, r, { once: true }));

/** Página pronta: fontes e, no app, o React montado. Fotos não seguram a abertura: cada uma tem o próprio logo e entra quando chega. No máximo 8 s. */
function pronto() {
  const espera = [document.fonts?.ready];
  if (document.body.dataset.espera === "app" && !window.__lsCampoPronto) espera.push(umaVez(window, "ls-campo:pronto"));
  return Promise.race([Promise.all(espera), new Promise((r) => setTimeout(r, 8000))]);
}

function sair(el) {
  el.classList.add("saindo");
  document.documentElement.classList.add("abertura-fim");
  window.dispatchEvent(new Event("ls-campo:abertura-fim"));
  setTimeout(() => el.remove(), 520);
}

export async function iniciarAbertura() {
  const el = document.getElementById("abertura");
  if (!el) return;
  await pronto();
  const anim = el.querySelector(".t0")?.getAnimations?.()[0];
  if (reduz() || !anim) { setTimeout(() => sair(el), Math.max(0, 800 - performance.now())); return; }
  // Com a página ainda montando, o setTimeout pode atrasar: confere de novo e, se a parede já passou, espera a próxima.
  const tentar = () => {
    const ms = esperaParaSair({ agora: Number(anim.currentTime) || 0 });
    if (ms > 0) { setTimeout(tentar, ms); return; }
    document.documentElement.dataset.aberturaFase = Math.round((Number(anim.currentTime) || 0) % CICLO); // conferido nos testes
    sair(el);
  };
  tentar();
}

/** Imagens do conteúdo que ainda não chegaram mostram o logo animado no lugar e entram de embaçado para nítido. */
export function marcarMidias(raiz = document) {
  for (const img of raiz.querySelectorAll("main img")) {
    if (img.complete && img.naturalWidth) continue;
    img.classList.add("midia-carregando");
    const fim = () => { img.classList.remove("midia-carregando"); img.classList.add("midia-entra"); };
    img.addEventListener("load", fim, { once: true });
    img.addEventListener("error", () => img.classList.remove("midia-carregando"), { once: true });
  }
}
