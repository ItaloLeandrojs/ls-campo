// Prints rápidos: node e2e/prints.mjs "#/agenda" ...  (computador e celular). PAPEL=planejador|equipe opcional.
import { servidor, navegador, pagina, URL_BASE } from "./util.mjs";
const rotas = process.argv.slice(2);
const parar = await servidor();
const b = await navegador();
try {
  for (const [nome, vp] of [["pc", { width: 1440, height: 900 }], ["cel", { width: 390, height: 844 }]]) {
    const { page, erros } = await pagina(b, { viewport: vp, deviceScaleFactor: nome === "cel" ? 2 : 1, isMobile: nome === "cel", hasTouch: nome === "cel" });
    if (process.env.EQUIPE) { await page.goto(URL_BASE + "app/#/equipe/escolher"); await page.getByRole("button", { name: new RegExp(process.env.EQUIPE) }).click(); await page.waitForTimeout(400); }
    for (const r of rotas) {
      await page.goto(URL_BASE + "app/" + r); await page.waitForTimeout(900);
      const arq = `_shots/${nome}-${r.replace(/[^a-z0-9]+/gi, "_") || "raiz"}.png`;
      await page.screenshot({ path: arq, fullPage: process.env.FULL === "1" });
      console.log(arq, erros.length ? "ERROS: " + erros.join(" | ") : "");
    }
  }
} finally { await b.close(); parar(); }
