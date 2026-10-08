// Crachá: 3D só sob demanda, versão parada com "reduzir movimento", Entrar sempre funciona, aparece só na primeira vez.
import { chromium, servidor, pagina, confere, resultado, URL_BASE } from "./util.mjs";

const parar = await servidor();
const b = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  // 1. Com 3D
  const { page, erros } = await pagina(b, { viewport: { width: 1280, height: 860 } });
  const pedidos = [];
  page.on("request", (r) => pedidos.push(r.url()));
  await page.goto(URL_BASE + "app/");
  await page.getByRole("button", { name: /Sou planejador/ }).waitFor();
  await page.goto(URL_BASE + "app/#/agenda");
  await page.waitForSelector(".grade");
  confere(!pedidos.some((u) => /Cracha|card\.glb/.test(u)), "entrada e agenda não baixam o 3D");
  await page.goto(URL_BASE + "app/#/equipe/escolher");
  const glb = page.waitForResponse((r) => r.url().includes("card.glb"), { timeout: 30000 });
  await page.getByRole("button", { name: /Ipê/ }).click();
  await page.waitForURL(/cracha=ipe/);
  await glb;
  await page.waitForSelector(".lanyard-wrapper canvas", { timeout: 20000 });
  confere(pedidos.some((u) => /Cracha\./.test(u)) && pedidos.some((u) => /card\.glb/.test(u)), "ao escolher a equipe, o 3D é baixado");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "_shots/cracha-3d.png" });
  await page.getByRole("button", { name: /Entrar/ }).click();
  await page.waitForURL(/#\/equipe$/);
  confere(await page.getByText("Equipe Ipê").isVisible(), "Entrar leva para o app da equipe");
  await page.goto(URL_BASE + "app/#/equipe/escolher");
  await page.getByRole("button", { name: /Ipê/ }).click();
  await page.waitForURL(/#\/equipe$/);
  confere(true, "segunda vez com a mesma equipe pula o crachá");
  confere(erros.filter((e) => !/WebGL|GPU|swiftshader/i.test(e)).length === 0, `sem erros no console (${erros.join(" | ").slice(0, 300) || "nenhum"})`);

  // 2. Reduzir movimento: crachá parado, sem baixar o 3D
  const r = await pagina(b, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce", isMobile: true, hasTouch: true });
  const pedidos2 = [];
  r.page.on("request", (q) => pedidos2.push(q.url()));
  await r.page.goto(URL_BASE + "app/#/equipe/escolher");
  await r.page.getByRole("button", { name: /Jatobá/ }).click();
  await r.page.waitForURL(/cracha=jatoba/);
  confere(await r.page.locator(".cracha-parado").isVisible(), "reduzir movimento mostra o crachá parado");
  confere(!pedidos2.some((u) => /Cracha\.|card\.glb/.test(u)), "reduzir movimento não baixa o 3D");
  await r.page.screenshot({ path: "_shots/cracha-parado.png" });
  await r.page.getByRole("button", { name: /Entrar/ }).click();
  await r.page.waitForURL(/#\/equipe$/);
  confere(true, "Entrar funciona sem o 3D");
} finally {
  await b.close();
  parar();
}
process.exit(resultado() ? 1 : 0);
