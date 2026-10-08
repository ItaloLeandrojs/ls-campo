// Gera a mídia da apresentação a partir do próprio app: prints (agenda, celular, antes e depois)
// e vídeos curtos (agenda, equipe, indicadores). A cena da parede vem de vídeo (public/seq/parede).
// Uso: node e2e/midia.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium, servidor, pagina, URL_BASE } from "./util.mjs";

const SAIDA = "public";
const TMP = "_midia";
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
for (const d of ["img", "video"]) fs.mkdirSync(path.join(SAIDA, d), { recursive: true });
const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
const webp = (png, destino, largura) => ff("-i", png, "-vf", `scale=${largura}:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", "82", destino);

const parar = await servidor();
const b = await chromium.launch({ channel: "msedge" });
try {
  // 1. Print da agenda (computador) e do celular
  {
    const { page } = await pagina(b, { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
    await page.goto(URL_BASE + "app/#/agenda"); await page.waitForSelector(".grade"); await page.waitForTimeout(600);
    await page.screenshot({ path: `${TMP}/agenda.png` });
    webp(`${TMP}/agenda.png`, `${SAIDA}/img/agenda.webp`, 1600);
    webp(`${TMP}/agenda.png`, `${SAIDA}/img/agenda-900.webp`, 900);
    const cel = await pagina(b, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce", deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await cel.page.goto(URL_BASE + "app/#/equipe/escolher");
    await cel.page.getByRole("button", { name: /Aroeira/ }).click();
    await cel.page.getByRole("button", { name: /Entrar/ }).click();
    await cel.page.waitForTimeout(500);
    await cel.page.screenshot({ path: `${TMP}/celular.png` });
    webp(`${TMP}/celular.png`, `${SAIDA}/img/celular.webp`, 520);
    // antes e depois do retorno (mesmo enquadramento)
    await cel.page.getByRole("button", { name: "Dar retorno" }).first().click();
    await cel.page.locator(".check-item input").first().waitFor();
    await cel.page.locator(".retorno-form").scrollIntoViewIfNeeded();
    await cel.page.evaluate(() => scrollTo(0, document.querySelector(".retorno-form").offsetTop - 70));
    await cel.page.waitForTimeout(300);
    await cel.page.screenshot({ path: `${TMP}/antes.png` });
    for (const c of await cel.page.locator(".check-item input").all()) await c.check();
    await cel.page.locator('input[aria-label="Adicionar foto: Fotos de antes"]').setInputFiles("e2e/foto-teste.jpg");
    await cel.page.locator(".campo-fotos .mini img").first().waitFor();
    await cel.page.evaluate(() => scrollTo(0, document.querySelector(".retorno-form").offsetTop - 70));
    await cel.page.waitForTimeout(300);
    await cel.page.screenshot({ path: `${TMP}/depois.png` });
    webp(`${TMP}/antes.png`, `${SAIDA}/img/retorno-antes.webp`, 780);
    webp(`${TMP}/depois.png`, `${SAIDA}/img/retorno-depois.webp`, 780);
  }

  // 2. Vídeos curtos (gravados do app)
  const gravar = async (nome, opts, roteiro) => {
    const ctx = await b.newContext({ ...opts, recordVideo: { dir: `${TMP}/v-${nome}`, size: opts.viewport } });
    await ctx.addInitScript(() => { const f = new Date(2026, 9, 7, 9, 30).getTime(); const O = Date; Date = class extends O { constructor(...a) { super(...(a.length ? a : [f])); } static now() { return f; } }; }); // eslint-disable-line
    const page = await ctx.newPage();
    await roteiro(page);
    await ctx.close();
    const webm = fs.readdirSync(`${TMP}/v-${nome}`).find((f) => f.endsWith(".webm"));
    ff("-ss", "0.6", "-i", `${TMP}/v-${nome}/${webm}`, "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p", "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-an", "-movflags", "+faststart", `${SAIDA}/video/${nome}.mp4`);
    ff("-ss", "1.2", "-i", `${SAIDA}/video/${nome}.mp4`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", `${SAIDA}/img/${nome}-poster.webp`);
  };
  const arrastar = async (page, de, para) => {
    const a = await de.boundingBox(); const c = await para.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 4, { steps: 5 });
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 40 });
    await page.waitForTimeout(250); await page.mouse.up();
  };
  await gravar("agenda", { viewport: { width: 1280, height: 760 } }, async (page) => {
    await page.goto(URL_BASE + "app/#/agenda"); await page.waitForSelector(".grade"); await page.waitForTimeout(900);
    const card = page.locator(".a-agendar .card-sv").first();
    await arrastar(page, card, page.locator('.vaga:not(.passada):empty[aria-label^="Cajueiro, "]:not([aria-label*="07/10"])').first());
    await page.waitForTimeout(1500);
    await arrastar(page, page.locator(".a-agendar .card-sv").filter({ hasText: "Pequenos reparos" }).first(), page.locator('.vaga:not(.passada):empty[aria-label^="Carnaúba, "]').first());
    await page.waitForTimeout(2200);
  });
  await gravar("equipe", { viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, async (page) => {
    await page.goto(URL_BASE + "app/#/equipe/escolher");
    await page.getByRole("button", { name: /Aroeira/ }).click();
    await page.getByRole("button", { name: /Entrar/ }).click(); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Dar retorno" }).first().click();
    await page.locator(".check-item input").first().waitFor();
    for (const c of await page.locator(".check-item input").all()) { await c.check(); await page.waitForTimeout(350); }
    await page.getByRole("button", { name: "Enviar retorno" }).click();
    await page.waitForTimeout(2200);
  });
  await gravar("indicadores", { viewport: { width: 1280, height: 760 } }, async (page) => {
    await page.goto(URL_BASE + "app/#/indicadores"); await page.waitForTimeout(1600);
    await page.getByRole("radio", { name: "Mês atual" }).click(); await page.waitForTimeout(1300);
    await page.getByLabel("Equipe", { exact: true }).selectOption("ipe"); await page.waitForTimeout(1300);
    await page.getByRole("radio", { name: "Últimos 3 meses" }).click(); await page.waitForTimeout(1500);
  });
} finally {
  await b.close();
  parar();
}
for (const d of ["img", "video"]) {
  const p = path.join(SAIDA, d);
  const bytes = fs.readdirSync(p).reduce((s, f) => s + fs.statSync(path.join(p, f)).size, 0);
  console.log(`${p}: ${fs.readdirSync(p).length} arquivos, ${(bytes / 1e6).toFixed(2)} MB`);
}
