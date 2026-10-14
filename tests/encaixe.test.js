import { describe, it, expect } from "vitest";
import { custosDasVagas, melhorVaga } from "../src/dominio/encaixe.js";

const GEO = {
  sede: { p: [0, 0] },
  clientes: { c1: [1, 0], c2: [2, 0], c3: [0, 5] },
  dist: { "sede|c1": [2, 6], "sede|c2": [4, 10], "sede|c3": [10, 25], "c1|c2": [2, 5], "c1|c3": [9, 22], "c2|c3": [8, 20] },
};
const EQUIPES = [
  { id: "a", nome: "Aroeira", especialidades: ["pintura"] },
  { id: "b", nome: "Buriti", especialidades: ["pintura"] },
  { id: "h", nome: "Hidro", especialidades: ["hidraulica"] },
];
const HOJE = "2026-10-14"; // quarta
const DIAS = ["2026-10-15", "2026-10-16"];
const ag = (id, clienteId, equipeId, data, turno) => ({ id, clienteId, tipo: "pintura", duracao: "turno", etapa: "agendado", prazo: "2026-10-30", agendamento: { equipeId, data, turno } });

describe("custosDasVagas", () => {
  const novo = { id: "n", clienteId: "c2", tipo: "pintura", duracao: "turno", etapa: "novo", prazo: "2026-10-30", agendamento: null };
  const servicos = [ag("s1", "c1", "a", "2026-10-15", "manha"), ag("s3", "c3", "b", "2026-10-15", "manha")];
  const custos = custosDasVagas({ servico: novo, equipes: EQUIPES, dias: DIAS, servicos, hoje: HOJE, geo: GEO });

  it("só calcula vagas que a regra aceita (equipe certa, turno livre)", () => {
    expect(custos["h|2026-10-15|manha"]).toBeUndefined(); // hidráulica não faz pintura
    expect(custos["a|2026-10-15|manha"]).toBeUndefined(); // turno ocupado
    expect(custos["a|2026-10-15|tarde"]).toBeDefined();
  });
  it("marca as vagas depois do prazo", () => {
    const tarde = custosDasVagas({ servico: { ...novo, prazo: "2026-10-15" }, equipes: EQUIPES, dias: DIAS, servicos, hoje: HOJE, geo: GEO });
    expect(tarde["a|2026-10-16|manha"].aviso).toBe(true);
    expect(tarde["a|2026-10-15|tarde"].aviso).toBeUndefined();
  });
  it("vaga perto de quem já está no dia custa menos", () => {
    expect(custos["a|2026-10-15|tarde"].extraKm).toBe(4); // sede-c1-c2-sede (8) menos sede-c1-sede (4)
    // sede-c3-c2-sede (10+8+4 = 22) menos sede-c3-sede (20): a equipe já ia longe, c2 fica no caminho de volta.
    expect(custos["b|2026-10-15|tarde"].extraKm).toBe(2);
    expect(custos["a|2026-10-16|manha"].extraKm).toBe(8); // dia vazio: ida e volta
    expect(melhorVaga(custos).chave).toBe("b|2026-10-15|tarde");
  });
});

describe("melhorVaga", () => {
  it("escolhe a de menor km extra e, no empate, a mais cedo", () => {
    const custos = { "a|2026-10-16|manha": { extraKm: 3 }, "b|2026-10-15|tarde": { extraKm: 3 }, "a|2026-10-15|tarde": { extraKm: 5 } };
    expect(melhorVaga(custos)).toEqual({ chave: "b|2026-10-15|tarde", equipeId: "b", data: "2026-10-15", turno: "tarde", extraKm: 3 });
  });
  it("prefere vaga dentro do prazo, mesmo rodando mais", () => {
    const custos = { "a|2026-10-20|manha": { extraKm: 1, aviso: true }, "b|2026-10-15|tarde": { extraKm: 6 } };
    expect(melhorVaga(custos).chave).toBe("b|2026-10-15|tarde");
    expect(melhorVaga({ "a|2026-10-20|manha": { extraKm: 1, aviso: true } }).chave).toBe("a|2026-10-20|manha");
  });
  it("sem vaga possível devolve null", () => {
    expect(melhorVaga({})).toBeNull();
  });
});
