import { describe, it, expect } from "vitest";
import { responder, normalizar, ASSUNTOS, buscarNaPagina } from "../src/ajuda/base.js";

describe("buscarNaPagina", () => {
  const textos = ["Agenda das equipes", "Antes e depois do retorno.", "Clientes que mais pedem"];
  it("acha o título que tem a palavra da pergunta", () => {
    expect(buscarNaPagina("cadê o antes e depois?", textos)).toBe(1);
    expect(buscarNaPagina("clientes que pedem mais", textos)).toBe(2);
  });
  it("devolve -1 quando nada bate", () => {
    expect(buscarNaPagina("previsão do tempo", textos)).toBe(-1);
  });
});

const achou = (p) => responder(p).melhor?.id;

describe("normalizar", () => {
  it("tira acento, pontuação e caixa", () => {
    expect(normalizar("Onde vejo os INDICADORES?!")).toBe("onde vejo os indicadores");
    expect(normalizar("Execução, Elétrica")).toBe("execucao eletrica");
  });
});

describe("responder", () => {
  it.each([
    ["Como agendo um serviço?", "agendar"],
    ["como agendar servico para uma equipe", "agendar"],
    ["arrastar o pedido para a equipe", "agendar"],
    ["por que não consigo agendar?", "regras"],
    ["nao deixa colocar o servico nessa equipe", "regras"],
    ["como tiro um serviço da agenda", "desagendar"],
    ["ver a próxima semana", "semana"],
    ["como cadastro um pedido novo", "novo-servico"],
    ["criar servico", "novo-servico"],
    ["filtrar serviços por equipe", "filtros"],
    ["o que significa reagendar", "etapas"],
    ["onde vejo os indicadores", "indicadores"],
    ["onde vejo os indicadroes", "indicadores"], // erro de digitação
    ["quantos serviços ficaram no prazo", "prazo"],
    ["quais os motivos de reagendamento", "motivos"],
    ["como a equipe fecha um serviço", "retorno"],
    ["dar retorno com foto", "retorno"],
    ["checklist do serviço", "retorno"],
    ["como iniciar o serviço", "iniciar"],
    ["ver como equipe no celular", "equipe-celular"],
    ["lista de clientes", "clientes"],
    ["quais equipes existem", "equipes"],
    ["que tipos de serviço vocês fazem", "especialidades"],
    ["tem modo escuro?", "tema"],
    ["apagar meus dados e começar de novo", "recomecar"],
    ["onde ficam salvos os dados", "dados"],
    ["quem fez esse site", "autor"],
    ["o que é o LS Campo", "o-que-e"],
    ["onde está o código", "codigo"],
    ["ver o crachá da equipe", "cracha"],
    ["quero fazer o tour", "tour"],
    ["como exporto os indicadores para o excel", "exportar"],
    ["baixar relatório em pdf", "exportar"],
    ["imprimir o painel", "exportar"],
    ["me mostra o passo a passo do sistema", "tour"],
    ["ver a rota da equipe no mapa", "rotas"],
    ["qual o melhor horário para não perder tempo no trânsito", "rotas"],
    ["quantos km a equipe roda por dia", "rotas"],
  ])("%s → %s", (pergunta, id) => {
    expect(achou(pergunta)).toBe(id);
  });

  it("não inventa resposta para pergunta fora do assunto", () => {
    const r = responder("qual a previsão do tempo amanhã em Fortaleza");
    expect(r.melhor).toBeNull();
    expect(r.sugestoes.length).toBeGreaterThan(0);
  });

  it("o título de cada assunto (usado nas sugestões) leva ao próprio assunto", () => {
    for (const a of ASSUNTOS) expect(achou(a.titulo), a.titulo).toBe(a.id);
  });

  it("pergunta vazia não quebra", () => {
    expect(responder("   ").melhor).toBeNull();
  });

  it("todo assunto tem resposta sem travessão e um destino ou alvo", () => {
    for (const a of ASSUNTOS) {
      expect(a.resposta).not.toMatch(/[—–]/);
      expect(a.rota || a.alvo || a.alvoLanding || a.link).toBeTruthy();
    }
  });
});
