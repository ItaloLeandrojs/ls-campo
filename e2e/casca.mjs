// Casca do app: entrada por papel, troca de papel, escolha de equipe, tema persistente.
import { servidor, navegador, pagina, confere, resultado, URL_BASE } from "./util.mjs";

const parar = await servidor();
const b = await navegador();
try {
  const { page, erros } = await pagina(b);
  await page.goto(URL_BASE + "app/");
  await page.getByRole("button", { name: /Sou planejador/ }).click();
  await page.waitForURL(/#\/agenda/);
  confere(page.url().includes("#/agenda"), "Sou planejador leva para a agenda");
  await page.getByRole("link", { name: "Indicadores" }).waitFor({ timeout: 10000 });
  confere(await page.getByRole("navigation").getByRole("link", { name: "Indicadores" }).isVisible(), "menu lateral visível");

  await page.getByRole("button", { name: /Tema escuro/ }).click();
  confere((await page.evaluate(() => document.documentElement.dataset.tema)) === "escuro", "tema escuro aplicado");
  await page.reload();
  confere((await page.evaluate(() => document.documentElement.dataset.tema)) === "escuro", "tema escuro continua após recarregar");
  await page.getByRole("button", { name: /Tema claro/ }).click();

  await page.getByRole("button", { name: /Ver como equipe/ }).click();
  await page.waitForURL(/#\/equipe\/escolher/);
  confere(page.url().includes("#/equipe/escolher"), "sem equipe escolhida, pergunta qual é");
  await page.getByRole("button", { name: /Aroeira/ }).click();
  await page.waitForURL(/cracha=aroeira/);
  confere(await page.getByRole("button", { name: /Entrar/ }).isVisible(), "primeira vez da equipe mostra o crachá com Entrar");
  await page.getByRole("button", { name: /Entrar/ }).click();
  await page.waitForURL(/#\/equipe$/);
  await page.getByText("Equipe Aroeira").waitFor();
  confere(await page.getByText("Equipe Aroeira").isVisible(), "topo mostra a equipe escolhida");

  await page.goto(URL_BASE + "app/#/indicadores");
  await page.getByRole("link", { name: "Indicadores" }).waitFor();
  confere(await page.getByRole("link", { name: "Indicadores" }).isVisible(), "link direto para tela do planejador funciona");
  await page.goto(URL_BASE + "app/#/rota-que-nao-existe");
  await page.waitForURL(/#\/$/);
  await page.getByText("Como você quer ver a demonstração?").waitFor();
  confere(await page.getByText("Como você quer ver a demonstração?").isVisible(), "rota desconhecida volta para a entrada");
  confere(erros.length === 0, `sem erros no console (${erros.join(" | ") || "nenhum"})`);
} finally {
  await b.close();
  parar();
}
process.exit(resultado() ? 1 : 0);
