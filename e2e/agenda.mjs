// Agenda: arrastar para turno livre, turno ocupado, equipe sem especialidade, tirar da agenda e agendar pelo teclado.
import { servidor, navegador, pagina, confere, resultado, URL_BASE } from "./util.mjs";

async function arrastar(page, origem, destino) {
  await destino.scrollIntoViewIfNeeded();
  await origem.scrollIntoViewIfNeeded();
  const a = await origem.boundingBox();
  const b = await destino.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 4, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(450);
}

// Primeira vaga vazia, a partir de amanhã, de uma equipe.
const vagaLivre = (page, equipe) => page.locator(`.vaga:not(.passada):empty[aria-label^="${equipe}, "]:not([aria-label*="qua, 07/10"])`).first();
const vagaOcupada = (page, equipe) => page.locator(`.vaga:not(.passada)[aria-label^="${equipe}, "]:has(.card-sv.arrastavel)`).first();

const parar = await servidor();
const b = await navegador();
try {
  const { page, erros } = await pagina(b, { viewport: { width: 1440, height: 1400 } });
  await page.goto(URL_BASE + "app/#/agenda");
  await page.waitForSelector(".a-agendar .card-sv");

  // 1. Turno livre de equipe com a especialidade (primeiro da lista é "Pequenos reparos": Cajueiro faz)
  const primeiro = page.locator(".a-agendar .card-sv").first();
  const codigo = (await primeiro.locator(".card-sv-cod").textContent()).trim();
  const tipo = (await primeiro.locator(".card-sv-tipo").textContent()).trim();
  confere(tipo === "Pequenos reparos", `primeiro da lista é Pequenos reparos (${tipo})`);
  await arrastar(page, primeiro, vagaLivre(page, "Cajueiro"));
  confere((await page.locator(".agenda-msg").textContent()).includes(`${codigo} agendado`), "mensagem confirma o agendamento");
  confere(await page.locator(`.grade .card-sv:has-text("${codigo}")`).count() === 1, "card aparece na grade");
  confere(await page.locator(`.a-agendar .card-sv:has-text("${codigo}")`).count() === 0, "card saiu da lista A agendar");

  // 2. Turno ocupado
  const segundo = page.locator(".a-agendar .card-sv").filter({ hasText: "Pequenos reparos" }).first();
  const cod2 = (await segundo.locator(".card-sv-cod").textContent()).trim();
  await arrastar(page, segundo, vagaOcupada(page, "Jatobá"));
  confere(/já tem serviço nesta/.test(await page.locator(".agenda-msg").textContent()), "turno ocupado mostra a frase da regra");
  confere(await page.locator(`.a-agendar .card-sv:has-text("${cod2}")`).count() === 1, "serviço continua na lista");

  // 3. Equipe sem a especialidade
  await arrastar(page, segundo, vagaLivre(page, "Carnaúba"));
  confere((await page.locator(".agenda-msg").textContent()).includes("A equipe Carnaúba não faz pequenos reparos."), "equipe sem especialidade é bloqueada com explicação");

  // 4. Tirar da agenda arrastando de volta para a lista
  await arrastar(page, page.locator(`.grade .card-sv:has-text("${codigo}")`), page.locator(".a-agendar"));
  confere((await page.locator(".agenda-msg").textContent()).includes(`${codigo} voltou para A agendar`), "arrastar de volta tira da agenda");

  // 5. Agendar pelo teclado: foco no card, Enter abre a ficha, Agendar abre o diálogo
  const card = page.locator(`.a-agendar .card-sv:has-text("${codigo}")`);
  await card.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Agendar…" }).click();
  const dlg = page.locator("dialog.dialogo[open]");
  confere(await dlg.isVisible(), "diálogo de agendar abre");
  confere(!(await dlg.locator("#ag-equipe option").allTextContents()).some((t) => t.startsWith("Carnaúba")), "diálogo só oferece equipes com a especialidade");
  await dlg.locator("#ag-equipe").selectOption("aroeira");
  let achou = false;
  for (let i = 1; i < 10 && !achou; i++) {
    await dlg.locator("#ag-dia").selectOption({ index: i });
    for (const t of ["manha", "tarde"]) {
      await dlg.locator(`input[value="${t}"]`).check();
      if (await dlg.getByRole("button", { name: "Agendar" }).isEnabled()) { achou = true; break; }
    }
  }
  confere(achou, "diálogo encontra um turno livre");
  await dlg.getByRole("button", { name: "Agendar" }).click();
  confere(await page.locator(`.grade .card-sv:has-text("${codigo}")`).count() === 1, "agendado pelo diálogo aparece na grade");

  // 6. Persistência: recarregar mantém
  await page.reload();
  await page.waitForSelector(".grade");
  confere(await page.locator(`.grade .card-sv:has-text("${codigo}")`).count() === 1, "agendamento continua após recarregar");
  confere(erros.length === 0, `sem erros no console (${erros.join(" | ") || "nenhum"})`);
} finally {
  await b.close();
  parar();
}
process.exit(resultado() ? 1 : 0);
