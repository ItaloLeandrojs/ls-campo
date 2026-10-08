import { describe, it, expect } from "vitest";
import { hojeISO, somarDias, diaSemana, inicioSemana, diasDaSemana, ehPassado, formatar, mesDe, diasUteisEntre, paraData } from "../src/dominio/datas.js";

describe("datas (sempre locais, AAAA-MM-DD)", () => {
  it("hojeISO usa a data local, mesmo às 23:59", () => {
    expect(hojeISO(new Date(2026, 9, 7, 23, 59))).toBe("2026-10-07");
    expect(hojeISO(new Date(2026, 9, 8, 0, 1))).toBe("2026-10-08");
  });
  it("somarDias atravessa mês e ano", () => {
    expect(somarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("diaSemana: 0 domingo ... 6 sábado", () => {
    expect(diaSemana("2026-10-11")).toBe(0);
    expect(diaSemana("2026-10-10")).toBe(6);
  });
  it("inicioSemana é a segunda; domingo pertence à semana que termina nele", () => {
    expect(inicioSemana("2026-10-08")).toBe("2026-10-05");
    expect(inicioSemana("2026-10-05")).toBe("2026-10-05");
    expect(inicioSemana("2026-10-11")).toBe("2026-10-05");
  });
  it("diasDaSemana devolve segunda a sábado", () => {
    const d = diasDaSemana("2026-10-08");
    expect(d).toHaveLength(6);
    expect(d[0]).toBe("2026-10-05");
    expect(d[5]).toBe("2026-10-10");
  });
  it("ehPassado compara só a data", () => {
    expect(ehPassado("2026-10-06", "2026-10-07")).toBe(true);
    expect(ehPassado("2026-10-07", "2026-10-07")).toBe(false);
  });
  it("formatar em pt-BR curto", () => {
    expect(formatar("2026-10-08")).toBe("qui, 08/10");
    expect(formatar("2026-10-08", "curto")).toBe("08/10");
  });
  it("mesDe", () => expect(mesDe("2026-10-08")).toBe("2026-10"));
  it("diasUteisEntre conta segunda a sábado, inclusive", () => {
    expect(diasUteisEntre("2026-10-05", "2026-10-11")).toBe(6);
    expect(diasUteisEntre("2026-10-11", "2026-10-11")).toBe(0);
    expect(diasUteisEntre("2026-10-08", "2026-10-07")).toBe(0);
  });
  it("paraData não sofre com fuso (não usa new Date('AAAA-MM-DD'))", () => {
    const d = paraData("2026-10-08");
    expect(d.getDate()).toBe(8);
    expect(d.getMonth()).toBe(9);
  });
});

import { agoraLocal } from "../src/dominio/datas.js";
describe("agoraLocal", () => {
  it("data e hora locais AAAA-MM-DDTHH:MM", () => expect(agoraLocal(new Date(2026, 9, 7, 9, 5))).toBe("2026-10-07T09:05"));
});
