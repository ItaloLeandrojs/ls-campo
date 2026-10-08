// Prints rápidos de rotas: node e2e/prints.mjs "#/" "#/agenda" ...  (computador e celular)
import { servidor, navegador, pagina, URL_BASE } from "./util.mjs";
const rotas = process.argv.slice(2);
const parar = await servidor();
const b = await navegador();
try {
  for (const [nome, vp] of [["pc", { width: 1440, height: 900 }], ["cel", { width: 390, height: 844 }]]) {
    const { page } = await pagina(b, { viewport: vp, deviceScaleFactor: nome === "cel" ? 2 : 1, isMobile: nome === "cel", hasTouch: nome === "cel" });
    for (const r of rotas) {
      if (r.startsWith("@")) { await page.evaluate((k) => localStorage.setItem("ls-campo:extra", k), r); continue; }
      await page.goto(URL_BASE + "app/" + r); await page.waitForTimeout(900);
      const arq = `_shots/${nome}-${r.replace(/[^a-z0-9]+/gi, "_") || "raiz"}.png`;
      await page.screenshot({ path: arq, fullPage: process.env.FULL === "1" });
      console.log(arq);
    }
  }
} finally { await b.close(); parar(); }
