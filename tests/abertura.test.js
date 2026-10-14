import { describe, it, expect } from "vitest";
import { esperaParaSair, CICLO, PAREDE } from "../src/ui/abertura-tempo.js";

describe("esperaParaSair (abertura com os tijolos)", () => {
  it("fica no mínimo 1,5 s, mesmo se a página já carregou", () => {
    expect(esperaParaSair({ agora: 200 })).toBe(1300);
  });
  it("sai na hora se já passou de 1,5 s e a parede está completa", () => {
    expect(esperaParaSair({ agora: CICLO + 1200 })).toBe(0);
  });
  it("se a página demorou, espera a próxima parede completa (nunca sai no meio da montagem)", () => {
    expect(esperaParaSair({ agora: 1600 })).toBe(CICLO + PAREDE[0] - 1600);
    expect(esperaParaSair({ agora: CICLO + 50 })).toBe(PAREDE[0] - 50);
  });
  it("o momento de sair cai sempre dentro da janela da parede completa", () => {
    for (let agora = 0; agora < 6000; agora += 37) {
      const fase = (agora + esperaParaSair({ agora })) % CICLO;
      expect(fase >= PAREDE[0] && fase <= PAREDE[1], `agora ${agora}`).toBe(true);
    }
  });
});
