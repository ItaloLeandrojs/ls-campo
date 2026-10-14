import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { gerarSemente } from "../src/dados/semente.js";
import { painel, noPrazo, concluidos } from "../src/dominio/indicadores.js";
import { montarRelatorio } from "../src/dominio/relatorio.js";
import { gerarXlsx } from "../src/dados/xlsx.js";

const HOJE = "2026-10-14";
const dados = gerarSemente(HOJE);
const clientes = Object.fromEntries(dados.clientes.map((c) => [c.id, c]));
const base = { servicos: dados.servicos, equipes: dados.equipes, clientes, hoje: HOJE, geradoEm: "2026-10-14T09:30:00" };

describe("painel (cálculo único da tela e da exportação)", () => {
  it("dá os mesmos números das funções separadas", () => {
    const p = painel(dados.servicos, { hoje: HOJE, periodo: "3m", equipeId: "", equipes: dados.equipes });
    const opts = { inicio: p.inicio, fim: HOJE, equipes: dados.equipes, hoje: HOJE };
    expect(p.concl).toBe(concluidos(dados.servicos, opts));
    expect(p.prazo).toEqual(noPrazo(dados.servicos, opts));
    expect(p.serie).toHaveLength(4);
  });
  it("mês atual começa no dia 1 do mês", () => {
    expect(painel(dados.servicos, { hoje: HOJE, periodo: "mes", equipeId: "", equipes: dados.equipes }).inicio).toBe("2026-10-01");
  });
});

describe("montarRelatorio", () => {
  const rel = montarRelatorio({ ...base, periodo: "3m", equipeId: "" });
  const aba = (nome) => rel.abas.find((a) => a.nome === nome);

  it("tem as 7 abas na ordem", () => {
    expect(rel.abas.map((a) => a.nome)).toEqual(["Resumo", "Prazo por mês", "Ocupação", "Reagendamentos", "Por tipo", "Clientes", "Serviços"]);
  });
  it("a aba Serviços lista exatamente os concluídos do período, e os 'Sim' batem com o no prazo", () => {
    const p = painel(dados.servicos, { hoje: HOJE, periodo: "3m", equipeId: "", equipes: dados.equipes });
    const linhas = aba("Serviços").linhas;
    expect(linhas).toHaveLength(p.prazo.total);
    const iNoPrazo = aba("Serviços").colunas.findIndex((c) => c.titulo === "No prazo");
    expect(linhas.filter((l) => l[iNoPrazo] === "Sim")).toHaveLength(p.prazo.noPrazo);
  });
  it("porcentagens vão como fração (o Excel formata como %)", () => {
    const pctCol = aba("Ocupação").colunas.findIndex((c) => c.tipo === "pct");
    for (const l of aba("Ocupação").linhas) if (l[pctCol] !== null) expect(l[pctCol]).toBeGreaterThanOrEqual(0), expect(l[pctCol]).toBeLessThanOrEqual(1);
  });
  it("o filtro de equipe vale para tudo e aparece no resumo", () => {
    const eq = dados.equipes[0];
    const r = montarRelatorio({ ...base, periodo: "mes", equipeId: eq.id });
    expect(r.filtros).toContain(eq.nome);
    expect(r.filtros).toContain("Mês atual");
    const iEq = r.abas.find((a) => a.nome === "Serviços").colunas.findIndex((c) => c.titulo === "Equipe");
    for (const l of r.abas.find((a) => a.nome === "Serviços").linhas) expect(l[iEq]).toBe(eq.nome);
  });
});

describe("gerarXlsx", () => {
  const abas = [
    { nome: "Teste & <ok>", colunas: [{ titulo: "Nome", tipo: "texto" }, { titulo: "Qtd", tipo: "numero" }, { titulo: "Taxa", tipo: "pct" }, { titulo: "Dia", tipo: "data" }], linhas: [["A & B <c>", 3, 0.5, "2026-10-14"], ["Sem data", 0, null, null]] },
    { nome: "Segunda", colunas: [{ titulo: "X", tipo: "texto" }], linhas: [] },
  ];
  const arquivos = unzipSync(gerarXlsx(abas));

  it("tem as partes obrigatórias de um .xlsx", () => {
    for (const p of ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]) expect(arquivos[p], p).toBeDefined();
  });
  it("escapa texto e nomes de aba", () => {
    const wb = strFromU8(arquivos["xl/workbook.xml"]);
    expect(wb).toContain('name="Teste &amp; ok"'); // < e > não são permitidos em nome de aba
    const s1 = strFromU8(arquivos["xl/worksheets/sheet1.xml"]);
    expect(s1).toContain("A &amp; B &lt;c&gt;");
    expect(s1).not.toMatch(/<c>/);
  });
  it("número vai como número, data como número de série e vazio fica sem célula", () => {
    const s1 = strFromU8(arquivos["xl/worksheets/sheet1.xml"]);
    expect(s1).toMatch(/<c r="B2" s="\d+"><v>3<\/v><\/c>/);
    expect(s1).toMatch(/<c r="C2" s="\d+"><v>0.5<\/v><\/c>/);
    expect(s1).toMatch(/<c r="D2" s="\d+"><v>46309<\/v><\/c>/); // 14/10/2026 no Excel
    expect(s1).not.toContain('r="C3"');
  });
  it("cabeçalho fixo e filtro nas colunas", () => {
    const s1 = strFromU8(arquivos["xl/worksheets/sheet1.xml"]);
    expect(s1).toContain('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>');
    expect(s1).toContain('<autoFilter ref="A1:D3"/>');
  });
});
