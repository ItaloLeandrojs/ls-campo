import { describe, it, expect } from "vitest";
import { deveIniciarTour, PASSOS } from "../src/ajuda/passos.js";

describe("deveIniciarTour", () => {
  const base = { rota: "/agenda", visto: false, automatizado: false, pedido: false };
  it("abre sozinho na primeira visita à Agenda", () => {
    expect(deveIniciarTour(base)).toBe(true);
  });
  it("não abre de novo depois de visto ou pulado", () => {
    expect(deveIniciarTour({ ...base, visto: true })).toBe(false);
  });
  it("não abre sozinho fora da Agenda", () => {
    expect(deveIniciarTour({ ...base, rota: "/indicadores" })).toBe(false);
    expect(deveIniciarTour({ ...base, rota: "/" })).toBe(false);
  });
  it("não abre sozinho em navegador automatizado (testes)", () => {
    expect(deveIniciarTour({ ...base, automatizado: true })).toBe(false);
  });
  it("abre quando a pessoa pede, mesmo já tendo visto", () => {
    expect(deveIniciarTour({ ...base, visto: true, automatizado: true, rota: "/indicadores", pedido: true })).toBe(true);
  });
});

describe("PASSOS", () => {
  it("tem 6 passos, todos com título, texto, rota e alvo, sem travessão", () => {
    expect(PASSOS).toHaveLength(6);
    for (const p of PASSOS) {
      expect(p.titulo && p.texto && p.rota && p.alvo).toBeTruthy();
      expect(p.titulo + p.texto).not.toMatch(/[—–]/);
    }
  });
});
