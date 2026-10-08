import { describe, it, expect } from "vitest";
import { concluidos, noPrazo, ocupacao, reagendamentos, porTipo, topClientes, serieMensalPrazo, reservas } from "../src/dominio/indicadores.js";

const equipes = [{ id: "ipe" }, { id: "jatoba" }];
const ag = (equipeId, data, turno) => ({ equipeId, data, turno });
const ev = (para, em, extra = {}) => ({ para, em: `${em}T10:00`, por: "planejador", ...extra });

// Semana de 05/10 (seg) a 10/10 (sáb); hoje = 07/10 (qua)
const servicos = [
  { // 1: concluído no prazo, ipe, seg manhã
    id: "1", clienteId: "c1", tipo: "pintura", prazo: "2026-10-06", criadoEm: "2026-10-01", etapa: "concluido",
    agendamento: ag("ipe", "2026-10-05", "manha"),
    historico: [ev("agendado", "2026-10-02", { agendamento: ag("ipe", "2026-10-05", "manha") }), ev("execucao", "2026-10-05"), ev("concluido", "2026-10-05")],
    retorno: { concluidoEm: "2026-10-05T11:00" },
  },
  { // 2: concluído atrasado, jatoba, ter dia inteiro
    id: "2", clienteId: "c1", tipo: "hidraulica", prazo: "2026-10-05", criadoEm: "2026-10-01", etapa: "concluido",
    agendamento: ag("jatoba", "2026-10-06", "dia"),
    historico: [ev("agendado", "2026-10-02", { agendamento: ag("jatoba", "2026-10-06", "dia") }), ev("concluido", "2026-10-06")],
    retorno: { concluidoEm: "2026-10-06T16:00" },
  },
  { // 3: reagendado (chuva) na seg tarde, depois concluído qua manhã no prazo, ipe
    id: "3", clienteId: "c2", tipo: "pintura", prazo: "2026-10-09", criadoEm: "2026-10-02", etapa: "concluido",
    agendamento: ag("ipe", "2026-10-07", "manha"),
    historico: [
      ev("agendado", "2026-10-02", { agendamento: ag("ipe", "2026-10-05", "tarde") }),
      ev("reagendar", "2026-10-05", { motivo: "chuva" }),
      ev("agendado", "2026-10-05", { agendamento: ag("ipe", "2026-10-07", "manha") }),
      ev("concluido", "2026-10-07"),
    ],
    retorno: { concluidoEm: "2026-10-07T12:00" },
  },
  { // 4: agendado no futuro (sex) — não conta na ocupação até hoje
    id: "4", clienteId: "c3", tipo: "reparos", prazo: "2026-10-15", criadoEm: "2026-10-03", etapa: "agendado",
    agendamento: ag("jatoba", "2026-10-09", "manha"),
    historico: [ev("agendado", "2026-10-03", { agendamento: ag("jatoba", "2026-10-09", "manha") })],
    retorno: null,
  },
  { // 5: movido (ter→qua) e depois desagendado — nada conta
    id: "5", clienteId: "c2", tipo: "reparos", prazo: "2026-10-20", criadoEm: "2026-10-04", etapa: "novo",
    agendamento: null,
    historico: [
      ev("agendado", "2026-10-04", { agendamento: ag("ipe", "2026-10-06", "manha") }),
      ev("agendado", "2026-10-05", { agendamento: ag("ipe", "2026-10-07", "tarde") }),
      ev("novo", "2026-10-05"),
    ],
    retorno: null,
  },
  { // 6: de setembro, fora do período
    id: "6", clienteId: "c3", tipo: "pintura", prazo: "2026-09-20", criadoEm: "2026-09-10", etapa: "concluido",
    agendamento: ag("ipe", "2026-09-15", "manha"),
    historico: [ev("agendado", "2026-09-10", { agendamento: ag("ipe", "2026-09-15", "manha") }), ev("concluido", "2026-09-15")],
    retorno: { concluidoEm: "2026-09-15T11:00" },
  },
];

const semana = { inicio: "2026-10-05", fim: "2026-10-10", equipes, hoje: "2026-10-07" };

describe("indicadores", () => {
  it("concluidos no período e por equipe", () => {
    expect(concluidos(servicos, semana)).toBe(3);
    expect(concluidos(servicos, { ...semana, equipeId: "ipe" })).toBe(2);
  });
  it("noPrazo: 2 de 3 no prazo", () => {
    expect(noPrazo(servicos, semana)).toEqual({ total: 3, noPrazo: 2, pct: 66.7 });
  });
  it("noPrazo sem concluídos dá pct null", () => {
    expect(noPrazo(servicos, { ...semana, inicio: "2026-08-01", fim: "2026-08-31" })).toEqual({ total: 0, noPrazo: 0, pct: null });
  });
  it("reservas: move e desagendar não contam; reagendado conta", () => {
    const r = reservas(servicos.find((s) => s.id === "5"));
    expect(r).toEqual([]);
    const r3 = reservas(servicos.find((s) => s.id === "3"));
    expect(r3.map((x) => x.data)).toEqual(["2026-10-05", "2026-10-07"]);
  });
  it("ocupacao até hoje: seg a qua = 3 dias úteis × 2 turnos × 2 equipes = 12", () => {
    // ipe: 1 (seg manhã) + 3a (seg tarde, reagendado) + 3b (qua manhã) = 3 turnos; jatoba: 2 (ter dia) = 2 turnos
    const o = ocupacao(servicos, semana);
    expect(o.geral).toBe(41.7); // 5 / 12
    expect(o.porEquipe).toEqual([
      { equipeId: "ipe", reservados: 3, capacidade: 6, pct: 50 },
      { equipeId: "jatoba", reservados: 2, capacidade: 6, pct: 33.3 },
    ]);
  });
  it("ocupacao filtrada por equipe", () => {
    expect(ocupacao(servicos, { ...semana, equipeId: "jatoba" }).geral).toBe(33.3);
  });
  it("reagendamentos por motivo", () => {
    expect(reagendamentos(servicos, semana)).toEqual({ total: 1, porMotivo: [{ motivo: "chuva", n: 1 }] });
    expect(reagendamentos(servicos, { ...semana, equipeId: "jatoba" }).total).toBe(0);
  });
  it("porTipo e topClientes contam serviços criados no período", () => {
    const outubro = { ...semana, inicio: "2026-10-01", fim: "2026-10-31" };
    expect(porTipo(servicos, outubro)).toEqual([{ tipo: "pintura", n: 2 }, { tipo: "reparos", n: 2 }, { tipo: "hidraulica", n: 1 }]);
    expect(topClientes(servicos, outubro, 2)).toEqual([{ clienteId: "c1", n: 2 }, { clienteId: "c2", n: 2 }]);
  });
  it("serieMensalPrazo", () => {
    expect(serieMensalPrazo(servicos, ["2026-09", "2026-10"])).toEqual([
      { mes: "2026-09", pct: 100, total: 1 },
      { mes: "2026-10", pct: 66.7, total: 3 },
    ]);
  });
});
