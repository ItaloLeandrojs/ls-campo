import { describe, it, expect } from "vitest";
import { trecho, rotaDoDia, custoEncaixe, decodificar, tracado } from "../src/dominio/rotas.js";

// Mapa de mentira: sede e três clientes, com distâncias conhecidas (km, min).
const GEO = {
  sede: { nome: "Sede", p: [0, 0] },
  clientes: { c1: [1, 0], c2: [2, 0], c3: [0, 5] },
  dist: { "sede|c1": [2, 6], "sede|c2": [4, 10], "sede|c3": [10, 25], "c1|c2": [2, 5], "c1|c3": [9, 22], "c2|c3": [8, 20] },
};
const sv = (id, clienteId, equipeId, data, turno, extra = {}) => ({ id, clienteId, agendamento: { equipeId, data, turno }, etapa: "agendado", duracao: turno === "dia" ? "dia" : "turno", ...extra });

describe("trecho", () => {
  it("acha a distância nos dois sentidos", () => {
    expect(trecho(GEO, "c1", "sede")).toEqual({ km: 2, min: 6 });
    expect(trecho(GEO, "sede", "c1")).toEqual({ km: 2, min: 6 });
  });
  it("mesmo lugar é zero", () => {
    expect(trecho(GEO, "c2", "c2")).toEqual({ km: 0, min: 0 });
  });
});

describe("rotaDoDia", () => {
  it("sai da sede, faz manhã, depois tarde, e volta", () => {
    const servicos = [sv("s2", "c2", "e1", "2026-10-15", "tarde"), sv("s1", "c1", "e1", "2026-10-15", "manha"), sv("x", "c3", "e2", "2026-10-15", "manha")];
    const r = rotaDoDia({ servicos, equipeId: "e1", data: "2026-10-15", geo: GEO });
    expect(r.paradas.map((p) => p.id)).toEqual(["sede", "s1", "s2", "sede"]);
    expect(r.trechos.map((t) => t.km)).toEqual([2, 2, 4]);
    expect(r.totalKm).toBe(8);
    expect(r.totalMin).toBe(21);
  });
  it("serviço de dia inteiro é uma visita só", () => {
    const r = rotaDoDia({ servicos: [sv("s3", "c3", "e1", "2026-10-15", "dia")], equipeId: "e1", data: "2026-10-15", geo: GEO });
    expect(r.paradas.map((p) => p.id)).toEqual(["sede", "s3", "sede"]);
    expect(r.totalKm).toBe(20);
  });
  it("dia sem visitas não tem rota", () => {
    const r = rotaDoDia({ servicos: [], equipeId: "e1", data: "2026-10-15", geo: GEO });
    expect(r.paradas).toHaveLength(0);
    expect(r.totalKm).toBe(0);
  });
  it("ignora serviço que voltou para reagendar", () => {
    const servicos = [sv("s1", "c1", "e1", "2026-10-15", "manha", { etapa: "reagendar" })];
    expect(rotaDoDia({ servicos, equipeId: "e1", data: "2026-10-15", geo: GEO }).paradas).toHaveLength(0);
  });
});

describe("custoEncaixe", () => {
  it("dia vazio: ida e volta da sede", () => {
    const r = custoEncaixe({ servico: { id: "n", clienteId: "c1", duracao: "turno" }, equipeId: "e1", data: "2026-10-15", turno: "manha", servicos: [], geo: GEO });
    expect(r.extraKm).toBe(4);
  });
  it("encaixar perto de quem já está no dia custa pouco; longe custa muito", () => {
    const servicos = [sv("s1", "c1", "e1", "2026-10-15", "manha")];
    const perto = custoEncaixe({ servico: { id: "n", clienteId: "c2", duracao: "turno" }, equipeId: "e1", data: "2026-10-15", turno: "tarde", servicos, geo: GEO });
    const longe = custoEncaixe({ servico: { id: "n", clienteId: "c3", duracao: "turno" }, equipeId: "e1", data: "2026-10-15", turno: "tarde", servicos, geo: GEO });
    // antes: sede-c1-sede = 4 km. Com c2: sede-c1-c2-sede = 2+2+4 = 8 (+4). Com c3: 2+9+10 = 21 (+17).
    expect(perto.extraKm).toBe(4);
    expect(longe.extraKm).toBe(17);
  });
  it("respeita a ordem dos turnos ao inserir de manhã", () => {
    const servicos = [sv("s2", "c2", "e1", "2026-10-15", "tarde")];
    const r = custoEncaixe({ servico: { id: "n", clienteId: "c1", duracao: "turno" }, equipeId: "e1", data: "2026-10-15", turno: "manha", servicos, geo: GEO });
    // antes: sede-c2-sede = 8. Depois: sede-c1-c2-sede = 2+2+4 = 8 (+0).
    expect(r.extraKm).toBe(0);
  });
});

describe("decodificar", () => {
  it("lê o formato polyline (exemplo oficial do Google)", () => {
    const c = decodificar("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(c).toEqual([[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
  });
});

describe("dados de geo (gerados uma vez pelas ruas)", async () => {
  const { gerarSemente } = await import("../src/dados/semente.js");
  const geo = (await import("../src/dados/geo-pontos.json")).default;
  const linhas = (await import("../src/dados/geo-linhas.json")).default;
  const clientes = gerarSemente("2026-10-14").clientes;
  const ids = ["sede", ...clientes.map((c) => c.id)];

  it("todo cliente da demonstração tem ponto no mapa", () => {
    for (const c of clientes) expect(geo.clientes[c.id], c.id).toHaveLength(2);
    expect(geo.sede.bairro).toBe("Fátima");
  });
  it("existe distância e traçado entre quaisquer dois pontos", () => {
    let pares = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const t = trecho(geo, ids[i], ids[j]);
      expect(t.km, `${ids[i]}|${ids[j]}`).toBeGreaterThan(0);
      expect(tracado(linhas, ids[j], ids[i]).length).toBeGreaterThan(1);
      pares++;
    }
    expect(pares).toBe(465);
  });
});
