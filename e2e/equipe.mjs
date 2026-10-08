// Equipe no celular: concluir com checklist e foto, recusar arquivo que não é imagem, reagendar com motivo, planejador vê o resultado.
import fs from "node:fs";
import { servidor, navegador, pagina, confere, resultado, URL_BASE } from "./util.mjs";

fs.writeFileSync("e2e/nao-imagem.txt", "isto não é uma foto");
const parar = await servidor();
const b = await navegador();
try {
  const { page, erros } = await pagina(b, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(URL_BASE + "app/");
  await page.getByRole("button", { name: /Sou da equipe/ }).click();
  await page.getByRole("button", { name: /Aroeira/ }).click();
  await page.waitForURL(/#\/equipe$/);

  // Concluir o serviço em execução
  await page.getByRole("button", { name: "Dar retorno" }).first().click();
  await page.waitForURL(/#\/equipe\/servico\/SV-/);
  const id = page.url().split("/").pop();
  const enviar = page.getByRole("button", { name: "Enviar retorno" });
  confere(await enviar.isDisabled(), "Enviar desabilitado sem o checklist");
  confere(/Falta marcar \d itens obrigatórios/.test(await page.locator(".falta").textContent()), "mostra o que falta");

  const entradaAntes = page.locator('input[aria-label="Adicionar foto: Fotos de antes"]');
  await entradaAntes.setInputFiles("e2e/nao-imagem.txt");
  await page.waitForTimeout(400);
  confere((await page.locator(".campo-fotos .erro").first().textContent()).includes("não é uma imagem"), "arquivo que não é imagem é recusado com mensagem");
  await entradaAntes.setInputFiles("e2e/foto-teste.jpg");
  await page.locator(".campo-fotos").first().locator(".mini img").waitFor({ timeout: 8000 });
  const larg = await page.locator(".campo-fotos").first().locator(".mini img").evaluate((img) => img.naturalWidth);
  confere(larg === 1280, `foto de 3000 px reduzida para 1280 px (${larg})`);

  for (const cb of await page.locator(".check-item input").all()) await cb.check();
  confere(await enviar.isEnabled(), "Enviar habilita com o checklist completo");
  await page.locator("#ret-obs").fill("Cliente aprovou o acabamento.");
  await enviar.click();
  confere(await page.locator(".carimbo").getByText("Concluído").isVisible(), "carimbo de concluído aparece");
  await page.getByRole("button", { name: "Voltar para hoje" }).click();

  // Reagendar: achar uma equipe com serviço para iniciar hoje
  let achou = false;
  for (const eq of ["Aroeira", "Cajueiro", "Carnaúba", "Ipê", "Jatobá", "Mandacaru"]) {
    await page.goto(URL_BASE + "app/#/equipe/escolher");
    await page.getByRole("button", { name: new RegExp(eq) }).click();
    await page.waitForURL(/#\/equipe$/);
    const iniciar = page.getByRole("button", { name: "Iniciar serviço" }).first();
    if (await iniciar.count()) { await iniciar.click(); achou = true; break; }
  }
  confere(achou, "alguma equipe tem serviço para iniciar hoje");
  await page.getByRole("button", { name: "Dar retorno" }).first().click();
  const id2 = page.url().split("/").pop();
  await page.locator("label.resultado-opcao", { hasText: "Reagendar" }).click();
  confere(await page.getByRole("button", { name: "Enviar retorno" }).isDisabled(), "reagendar exige motivo");
  await page.locator("#ret-motivo").selectOption("chuva");
  await page.getByRole("button", { name: "Enviar retorno" }).click();
  confere(await page.getByText("Serviço devolvido ao planejador").isVisible(), "reagendado: aviso neutro, sem carimbo");

  await page.getByRole("link", { name: /Feitos/ }).click();
  confere(await page.locator(".feitos li").count() > 0, "Feitos lista o histórico da equipe");

  // Planejador vê os dois resultados
  await page.goto(URL_BASE + `app/#/servicos/${id}`);
  confere(await page.locator(".ficha .selo").first().textContent() === "Concluído", `${id} aparece Concluído para o planejador`);
  confere(await page.getByText("Cliente aprovou o acabamento.").isVisible(), "observação da equipe aparece na ficha");
  confere(await page.locator(".ficha-fotos img").count() === 1, "foto aparece na ficha do planejador");
  await page.goto(URL_BASE + `app/#/servicos/${id2}`);
  confere(await page.locator(".ficha .selo").first().textContent() === "Reagendar", `${id2} volta como Reagendar`);
  confere(await page.getByText("pediu reagendamento: chuva").isVisible(), "motivo aparece no histórico");
  confere(erros.length === 0, `sem erros no console (${erros.join(" | ") || "nenhum"})`);
} finally {
  await b.close();
  parar();
  fs.rmSync("e2e/nao-imagem.txt", { force: true });
}
process.exit(resultado() ? 1 : 0);
