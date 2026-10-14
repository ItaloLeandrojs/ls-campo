// Gera src/styles/carregando.css a partir do desenho do logo (7 tijolos). Rodar: node scripts/gerar-carregando.mjs
// O tempo (ciclo de 1,75 s, parede completa de 58% a 88%) precisa bater com src/ui/abertura-tempo.js.
import fs from "node:fs";
import { TIJOLOS as T } from "../src/ui/tijolos.js";
const quadro = (i, nome, queda) => {
  const s = 3 + 7 * i, l = s + 13;
  return `@keyframes ${nome}${i} { 0%, ${s}% { opacity: 0; transform: translateY(${queda}); animation-timing-function: cubic-bezier(.23, 1, .32, 1); } ${l}%, 88% { opacity: 1; transform: none; } 95%, 100% { opacity: 0; transform: none; } }`;
};
const rects = T.map(([x, y, w], i) => `<rect class="t t${i}" x="${x}" y="${y}" width="${w}" height="40" rx="5"/>`).join("");
// SVG autônomo, para fundo de imagens que ainda estão carregando
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><style>.t{fill:#fff;opacity:0;animation:1.75s infinite}${T.map((_, i) => `.t${i}{animation-name:t${i}}`).join("")}${T.map((_, i) => quadro(i, "t", "-34px").replace(/\s+/g, " ")).join("")}</style><rect width="256" height="256" rx="56" fill="#B8462A"/>${rects}</svg>`;
const dataUri = "data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, "%27");

const css = `/* Carregamento com a marca: os tijolos do logo são assentados um a um (base, meio, topo) em ciclos de 1,75 s.
   Usado na abertura (uma vez por visita), nos pedaços que carregam depois (mapa, crachá 3D, Excel) e nas imagens.
   O conteúdo entra de embaçado para nítido. Gerado por scripts/gerar-carregando.mjs: não editar à mão. */

.logo-tijolos { display: block; overflow: visible; }
.logo-tijolos .fundo { fill: #B8462A; }
.logo-tijolos .t { fill: #fff; opacity: 0; transform-box: fill-box; animation-duration: 1.75s; animation-iteration-count: infinite; }
${T.map((_, i) => `.logo-tijolos .t${i} { animation-name: tijolo${i}; }`).join("\n")}
${T.map((_, i) => quadro(i, "tijolo", "-85%")).join("\n")}

/* Abertura de tela cheia */
#abertura { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; background: var(--bg, #FAFAF9);
  transition: opacity 480ms cubic-bezier(.23, 1, .32, 1), filter 480ms cubic-bezier(.23, 1, .32, 1), transform 480ms cubic-bezier(.23, 1, .32, 1); }
#abertura .logo-tijolos { width: 88px; height: 88px; }
#abertura.saindo { opacity: 0; filter: blur(8px); transform: scale(1.04); pointer-events: none; }
#abertura.saindo .t { animation-play-state: paused; }

/* Pedaço carregando no próprio lugar */
.carregando-logo { display: grid; place-items: center; gap: 10px; color: var(--muted); font-size: 13.5px; }
.carregando-logo .logo-tijolos { width: var(--tam, 44px); height: var(--tam, 44px); }
.logo-mini { display: inline-block; width: 18px; height: 18px; vertical-align: -3px; }

/* Imagens: o logo animado aparece no lugar até a foto chegar */
img.midia-carregando { background: url("${dataUri}") center / 44px 44px no-repeat, var(--surface-2, #F3F3F1); }

/* Entrada: de embaçado para nítido. "backwards" para não deixar filter no fim (filter cria contexto para position: fixed). */
@keyframes entra-foco { from { opacity: 0; filter: blur(12px); transform: translateY(8px); } }
.entra-foco, img.midia-entra { animation: entra-foco 650ms cubic-bezier(.23, 1, .32, 1) backwards; }
html.com-abertura .entra-abertura { animation: entra-foco 650ms cubic-bezier(.23, 1, .32, 1) backwards; }
/* enquanto a abertura cobre a tela, as entradas esperam */
html.com-abertura:not(.abertura-fim) :is(.entra-foco, .l-sobe, img.midia-entra, .entra-abertura, .conteudo > * > *, .equipe-conteudo > * > *, .entrada-miolo > *) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .logo-tijolos .t { animation: none; opacity: 1; }
  #abertura { transition: opacity 200ms ease; }
  #abertura.saindo { filter: none; transform: none; }
  @keyframes entra-foco { from { opacity: 0; } }
}
`;
fs.writeFileSync(new URL("../src/styles/carregando.css", import.meta.url), css);
console.log(`src/styles/carregando.css: ${css.length} bytes`);
