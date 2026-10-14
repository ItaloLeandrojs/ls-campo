import { describe, it, expect } from "vitest";
import { montarConcluidos, calcularPrazo, ESTADO_INICIAL } from "../src/estudo/prazo.js";

describe("peça do estudo de caso: no prazo", () => {
  it("começa com 12 serviços e 3 atrasados (75%)", () => {
    expect(ESTADO_INICIAL).toHaveLength(12);
    expect(calcularPrazo(ESTADO_INICIAL)).toEqual({ total: 12, noPrazo: 9, pct: 75 });
  });

  it("recalcula quando um serviço muda de atrasado para no prazo", () => {
    const e = ESTADO_INICIAL.map((x) => x);
    e[e.indexOf(false)] = true;
    expect(calcularPrazo(e)).toEqual({ total: 12, noPrazo: 10, pct: 83.3 });
  });

  it("usa datas reais: no prazo conclui no dia do prazo, atrasado conclui depois", () => {
    const [ok, atrasado] = montarConcluidos([true, false]);
    expect(ok.retorno.concluidoEm.slice(0, 10) <= ok.prazo).toBe(true);
    expect(atrasado.retorno.concluidoEm.slice(0, 10) > atrasado.prazo).toBe(true);
  });

  it("todos atrasados dá 0% e todos no prazo dá 100%", () => {
    expect(calcularPrazo(Array(12).fill(false)).pct).toBe(0);
    expect(calcularPrazo(Array(12).fill(true)).pct).toBe(100);
  });
});
