import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { gerarSemente } from "../src/dados/semente.js";
import { ocupados } from "../src/dominio/regras.js";
import { TIPO } from "../src/dominio/tipos.js";
import { diaSemana, somarDias, mesDe } from "../src/dominio/datas.js";
import { serieMensalPrazo, ocupacao } from "../src/dominio/indicadores.js";

const HOJE = "2026-10-07"; // quarta
const d = gerarSemente(HOJE);
const mesesAnteriores = (hoje) => {
  const [a, m] = hoje.split("-").map(Number);
  return [3, 2, 1].map((k) => { const t = new Date(a, m - 1 - k, 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`; });
};

describe("gerarSemente", () => {
  it("é determinística para a mesma data", () => {
    expect(JSON.stringify(gerarSemente(HOJE))).toBe(JSON.stringify(d));
  });
  it("tem 6 equipes e 30 clientes", () => {
    expect(d.versao).toBe(1);
    expect(d.equipes).toHaveLength(6);
    expect(d.clientes).toHaveLength(30);
    expect(d.equipes[0].nome).toBe("Aroeira");
  });
  it("todo tipo tem ao menos duas equipes", () => {
    for (const t of Object.keys(TIPO)) expect(d.equipes.filter((e) => e.especialidades.includes(t)).length).toBeGreaterThanOrEqual(2);
  });
  it("gera entre 400 e 650 serviços com códigos SV-0001 em diante, únicos", () => {
    expect(d.servicos.length).toBeGreaterThanOrEqual(400);
    expect(d.servicos.length).toBeLessThanOrEqual(650);
    expect(d.servicos[0].id).toBe("SV-0001");
    expect(new Set(d.servicos.map((s) => s.id)).size).toBe(d.servicos.length);
  });
  it("nada no domingo e nenhum turno com dois serviços", () => {
    for (const s of d.servicos) {
      if (!s.agendamento) continue;
      expect(diaSemana(s.agendamento.data)).not.toBe(0);
      const o = ocupados(d.servicos, s.agendamento.equipeId, s.agendamento.data, s.id);
      if (s.agendamento.turno === "dia") expect(o).toEqual({ manha: null, tarde: null });
      else expect(o[s.agendamento.turno]).toBeNull();
    }
  });
  it("toda equipe só recebe tipos da sua especialidade", () => {
    const eq = Object.fromEntries(d.equipes.map((e) => [e.id, e]));
    for (const s of d.servicos) if (s.agendamento) expect(eq[s.agendamento.equipeId].especialidades).toContain(s.tipo);
  });
  it("prazo no prazo melhora nos 3 meses anteriores (78, 84, 89 aprox.)", () => {
    const serie = serieMensalPrazo(d.servicos, mesesAnteriores(HOJE));
    const [a, b, c] = serie.map((x) => x.pct);
    expect(a).toBeGreaterThanOrEqual(74); expect(a).toBeLessThanOrEqual(80);
    expect(b).toBeGreaterThanOrEqual(81); expect(b).toBeLessThanOrEqual(87);
    expect(c).toBeGreaterThanOrEqual(86); expect(c).toBeLessThanOrEqual(92);
  });
  it("ocupação do mês anterior entre 55% e 75%", () => {
    const [mes] = mesesAnteriores(HOJE).slice(-1);
    const o = ocupacao(d.servicos, { inicio: `${mes}-01`, fim: `${mes}-30`, equipes: d.equipes, hoje: HOJE });
    expect(o.geral).toBeGreaterThanOrEqual(55);
    expect(o.geral).toBeLessThanOrEqual(75);
  });
  it("cerca de 12% dos concluídos passaram por reagendamento, com motivo", () => {
    const conc = d.servicos.filter((s) => s.etapa === "concluido");
    const reag = conc.filter((s) => s.historico.some((h) => h.para === "reagendar"));
    expect(reag.length / conc.length).toBeGreaterThan(0.08);
    expect(reag.length / conc.length).toBeLessThan(0.16);
    for (const s of reag) expect(s.historico.find((h) => h.para === "reagendar").motivo).toBeTruthy();
  });
  it("hoje: Aroeira tem 1 serviço em execução e há outros agendados", () => {
    const hoje = d.servicos.filter((s) => s.agendamento?.data === HOJE);
    expect(hoje.filter((s) => s.etapa === "execucao" && s.agendamento.equipeId === "aroeira")).toHaveLength(1);
    expect(hoje.filter((s) => s.etapa === "agendado").length).toBeGreaterThanOrEqual(4);
  });
  it("lista a agendar: 8 a 12 serviços (novo/reagendar) sem agendamento, 2 urgentes", () => {
    const abertos = d.servicos.filter((s) => ["novo", "reagendar"].includes(s.etapa));
    expect(abertos.length).toBeGreaterThanOrEqual(8);
    expect(abertos.length).toBeLessThanOrEqual(12);
    for (const s of abertos) expect(s.agendamento).toBeNull();
    expect(abertos.filter((s) => s.prioridade === "urgente")).toHaveLength(2);
  });
  it("nada agendado no passado fica sem concluir (exceto reagendados)", () => {
    for (const s of d.servicos) if (s.agendamento && s.agendamento.data < HOJE) expect(s.etapa).toBe("concluido");
  });
  it("próxima semana tem agenda parcial", () => {
    const seg = somarDias(HOJE, 5); // segunda 12/10
    const prox = d.servicos.filter((s) => s.agendamento && s.agendamento.data >= seg && s.agendamento.data <= somarDias(seg, 5));
    expect(prox.length).toBeGreaterThan(5);
  });
  it("domingo como 'hoje' não quebra e não cria nada no domingo", () => {
    const dom = gerarSemente("2026-10-11");
    expect(dom.servicos.some((s) => s.agendamento?.data === "2026-10-11")).toBe(false);
  });
  it("nenhum termo proibido nos textos", () => {
    const lista = path.resolve("..", "ls-campo-termos-proibidos.txt");
    if (!fs.existsSync(lista)) return;
    const texto = JSON.stringify(d);
    for (const t of fs.readFileSync(lista, "utf8").split(/\r?\n/).filter(Boolean)) expect(texto.includes(t), t).toBe(false);
  });
  it("datas de criação e prazo são coerentes", () => {
    for (const s of d.servicos) {
      expect(s.criadoEm <= s.prazo).toBe(true);
      if (s.agendamento) expect(s.criadoEm <= s.agendamento.data).toBe(true);
      expect(mesDe(s.criadoEm) >= "2026-06").toBe(true);
    }
  });
});
