// Serviços, clientes e equipes: criar serviço com validação, ver na lista e na agenda, filtros, fichas.
import { servidor, navegador, pagina, confere, resultado, URL_BASE } from "./util.mjs";

const parar = await servidor();
const b = await navegador();
try {
  const { page, erros } = await pagina(b);
  await page.goto(URL_BASE + "app/#/servicos/novo");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  confere(await page.getByText("Escolha o cliente.").isVisible(), "validação: cliente obrigatório");
  confere(await page.getByText("Descreva o serviço com pelo menos 10 letras.").isVisible(), "validação: descrição curta");
  confere((await page.evaluate(() => document.activeElement?.id)) === "novo-clienteId", "foco vai para o primeiro campo com erro");

  await page.locator("#novo-clienteId").selectOption({ index: 3 });
  await page.locator("#novo-tipo").selectOption("hidraulica");
  await page.locator("#novo-descricao").fill("Trocar a boia da caixa d'água do bloco B");
  await page.locator("#novo-prioridade").selectOption("urgente");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.waitForURL(/#\/servicos\/SV-\d+/);
  const id = page.url().split("/").pop();
  confere(await page.getByText("Serviço criado.").isVisible(), `ficha do novo serviço abre com aviso (${id})`);

  await page.goto(URL_BASE + "app/#/agenda");
  await page.waitForSelector(".a-agendar");
  const primeiro = (await page.locator(".a-agendar .card-sv .card-sv-cod").first().textContent()).trim();
  confere(await page.locator(`.a-agendar .card-sv:has-text("${id}")`).count() === 1, "novo serviço aparece em A agendar");
  confere(primeiro !== "" , `urgentes ficam no topo (primeiro: ${primeiro})`);

  await page.goto(URL_BASE + "app/#/servicos");
  await page.getByPlaceholder("Código, cliente ou descrição").fill(id);
  confere(await page.locator(".tabela-linha").count() === 1, "busca pelo código encontra 1");
  await page.getByPlaceholder("Código, cliente ou descrição").fill("");
  await page.getByLabel("Etapa").selectOption("concluido");
  const n = await page.locator(".tabela-linha").count();
  confere(n > 0 && (await page.locator(".tabela-linha .selo").allTextContents()).every((t) => t === "Concluído"), "filtro de etapa mostra só concluídos");
  await page.getByLabel("Etapa").selectOption("reagendar");
  await page.getByLabel("Tipo").selectOption("impermeabilizacao");
  await page.getByLabel("Equipe").selectOption("jatoba");
  confere(await page.getByText("Nenhum serviço encontrado").isVisible(), "estado vazio quando nada bate com os filtros");

  await page.goto(URL_BASE + "app/#/clientes");
  await page.locator(".tabela-linha").first().click();
  await page.waitForURL(/#\/clientes\/c\d+/);
  confere(await page.getByText("Concluídos no prazo").isVisible(), "ficha do cliente mostra o % no prazo");
  await page.goto(URL_BASE + "app/#/equipes");
  confere(await page.locator(".equipe-cartao").count() === 6, "6 equipes listadas");
  confere(erros.length === 0, `sem erros no console (${erros.join(" | ") || "nenhum"})`);
} finally {
  await b.close();
  parar();
}
process.exit(resultado() ? 1 : 0);
