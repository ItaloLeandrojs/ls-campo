// Ajudantes dos testes de ponta a ponta: Playwright com o Edge instalado e o servidor de prévia do Astro.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

let pw;
for (const raiz of [process.cwd() + "/", "C:/Users/italo.silva/Desktop/CURSO CLAUDE/AULA 4/site-v2/"]) {
  try { pw = await import(pathToFileURL(createRequire(raiz + "x.js").resolve("playwright")).href); break; } catch {}
}
if (!pw) throw new Error("Playwright não encontrado");
export const chromium = pw.chromium ?? pw.default.chromium;

export const PORTA = 4331;
export const URL_BASE = `http://localhost:${PORTA}/ls-campo/`;

export async function servidor() {
  const p = spawn("npx", ["astro", "preview", "--port", String(PORTA)], { shell: true, stdio: "pipe" });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(URL_BASE); if (r.ok) return () => { try { process.platform === "win32" ? spawn("taskkill", ["/pid", String(p.pid), "/T", "/F"]) : p.kill(); } catch {} }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Servidor de prévia não subiu");
}

export async function navegador() {
  return chromium.launch({ channel: "msedge", args: ["--autoplay-policy=no-user-gesture-required"] });
}

/** Contexto com relógio fixo (quarta 07/10/2026 09:30) para os dados de exemplo serem sempre os mesmos. */
export async function pagina(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  await ctx.addInitScript(() => {
    const fixo = new Date(2026, 9, 7, 9, 30).getTime();
    const Orig = Date;
    // eslint-disable-next-line no-global-assign
    Date = class extends Orig { constructor(...a) { super(...(a.length ? a : [fixo])); } static now() { return fixo; } };
  });
  const page = await ctx.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  return { ctx, page, erros };
}

let falhas = 0;
export function confere(cond, texto) {
  if (cond) console.log(`  ✓ ${texto}`);
  else { falhas++; console.log(`  ✗ ${texto}`); }
}
export const resultado = () => { console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo"); return falhas; };
