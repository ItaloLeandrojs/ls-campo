// Indicadores reagem aos dados: concluir um serviço soma 1; filtro de equipe destaca a equipe.
import { servidor, navegador, pagina, confere, resultado, URL_BASE } from "./util.mjs";

const lerConcluidos = async (page) => {
  await page.waitForTimeout(900); // contador termina
  return Number((await page.locator(".kpi").first().locator("b").textContent()).replace(/\D/g, ""));
};

const parar = await servidor();
const b = await navegador();
try {
  const { page, erros } = await pagina(b);
  await page.goto(URL_BASE + "app/#/indicadores");
  await page.getByRole("radio", { name: "Mês atual" }).click();
  const antes = await lerConcluidos(page);
  confere(antes > 0, `concluídos no mês atual: ${antes}`);
  confere(await page.locator(".graf-v-col").count() === 4, "gráfico de prazo tem 4 meses");
  confere((await page.locator(".painel h2").first().textContent()).startsWith("O prazo melhorou"), "título do gráfico diz a conclusão");

  // conclui o serviço em execução da Aroeira
  await page.goto(URL_BASE + "app/#/equipe/escolher");
  await page.getByRole("button", { name: /Aroeira/ }).click();
  await page.getByRole("button", { name: "Dar retorno" }).first().click();
  for (const cb of await page.locator(".check-item input").all()) await cb.check();
  await page.getByRole("button", { name: "Enviar retorno" }).click();
  await page.getByText("Concluído", { exact: true }).waitFor();

  await page.goto(URL_BASE + "app/#/indicadores");
  await page.getByRole("radio", { name: "Mês atual" }).click();
  const depois = await lerConcluidos(page);
  confere(depois === antes + 1, `concluir um serviço soma 1 (${antes} → ${depois})`);

  await page.getByLabel("Equipe", { exact: true }).selectOption("ipe");
  confere(await page.locator(".graf-h-lista li.apagado").count() === 5, "filtro de equipe apaga as outras 5 na ocupação");
  confere(await page.locator("table.sr-only").count() >= 3, "gráficos têm tabela para leitor de tela");
  confere(erros.length === 0, `sem erros no console (${erros.join(" | ") || "nenhum"})`);
} finally {
  await b.close();
  parar();
}
process.exit(resultado() ? 1 : 0);
