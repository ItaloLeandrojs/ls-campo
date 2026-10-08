import { describe, it, expect, beforeEach } from "vitest";
import { criarLoja, CHAVE } from "../src/dados/loja.js";
import { ocupados } from "../src/dominio/regras.js";

const AGORA = () => new Date(2026, 9, 7, 9, 30); // quarta 07/10, 09:30
const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};

let st, loja;
beforeEach(() => { st = memoria(); loja = criarLoja({ storage: st, agora: AGORA }); });

const g = () => loja.getState();
const aberto = () => g().dados.servicos.find((s) => s.etapa === "novo" && s.duracao === "turno");
const equipeQueFaz = (tipo) => g().dados.equipes.find((e) => e.especialidades.includes(tipo));
// primeiro dia futuro em que a equipe tem a manhã livre
const manhaLivre = (equipeId) => {
  for (const d of ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"]) {
    if (!ocupados(g().dados.servicos, equipeId, d).manha) return d;
  }
  throw new Error("sem manhã livre");
};

describe("loja", () => {
  it("começa com a semente de hoje e sem papel escolhido", () => {
    expect(g().dados.versao).toBe(1);
    expect(g().dados.geradoEm).toBe("2026-10-07");
    expect(g().papel).toBeNull();
  });

  it("agendar num turno livre muda a etapa e registra quem fez", () => {
    const s = aberto();
    const eq = equipeQueFaz(s.tipo);
    const data = manhaLivre(eq.id);
    const r = g().agendar(s.id, { equipeId: eq.id, data, turno: "manha" });
    expect(r.ok).toBe(true);
    const depois = g().dados.servicos.find((x) => x.id === s.id);
    expect(depois.etapa).toBe("agendado");
    expect(depois.historico.at(-1)).toMatchObject({ para: "agendado", por: "planejador", em: "2026-10-07T09:30" });
  });

  it("agendar em turno ocupado devolve a frase da regra e não muda nada", () => {
    const s = aberto();
    const ocupado = g().dados.servicos.find((x) => x.etapa === "agendado" && x.agendamento.turno === "manha" && x.agendamento.data > "2026-10-07"
      && g().dados.equipes.find((e) => e.id === x.agendamento.equipeId).especialidades.includes(s.tipo));
    expect(ocupado, "a semente deve ter um turno ocupado futuro para este teste").toBeTruthy();
    const eq = g().dados.equipes.find((e) => e.id === ocupado.agendamento.equipeId);
    const r = g().agendar(s.id, { equipeId: eq.id, data: ocupado.agendamento.data, turno: "manha" });
    expect(r).toEqual({ ok: false, motivo: `A equipe ${eq.nome} já tem serviço nesta manhã.` });
    expect(g().dados.servicos.find((x) => x.id === s.id).etapa).toBe("novo");
  });

  it("iniciar e retornar concluído grava concluidoEm", () => {
    const exec = g().dados.servicos.find((s) => s.etapa === "execucao");
    const checklist = Object.fromEntries((require_checklist(exec.tipo)).map((i) => [i, true]));
    const r = g().retornar(exec.id, { resultado: "concluido", checklist, observacao: "Tudo certo", fotosAntes: ["f1"], fotosDepois: ["f2"] });
    expect(r.ok).toBe(true);
    const s = g().dados.servicos.find((x) => x.id === exec.id);
    expect(s.etapa).toBe("concluido");
    expect(s.retorno).toMatchObject({ concluidoEm: "2026-10-07T09:30", observacao: "Tudo certo", fotosAntes: ["f1"] });
  });

  it("retornar concluído sem checklist devolve o que falta", () => {
    const exec = g().dados.servicos.find((s) => s.etapa === "execucao");
    const r = g().retornar(exec.id, { resultado: "concluido", checklist: {} });
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/^Falta marcar: /);
  });

  it("retornar reagendar exige motivo e volta para a lista", () => {
    const exec = g().dados.servicos.find((s) => s.etapa === "execucao");
    expect(g().retornar(exec.id, { resultado: "reagendar" }).ok).toBe(false);
    const r = g().retornar(exec.id, { resultado: "reagendar", motivo: "material", observacao: "Faltou tinta" });
    expect(r.ok).toBe(true);
    const s = g().dados.servicos.find((x) => x.id === exec.id);
    expect(s.etapa).toBe("reagendar");
    expect(s.agendamento).toBeNull();
  });

  it("criarServico valida campos e cria com código novo", () => {
    expect(g().criarServico({ clienteId: "", tipo: "pintura", descricao: "curta", prazo: "2026-10-01", duracao: "turno", prioridade: "normal" }))
      .toEqual({ ok: false, erros: { clienteId: "Escolha o cliente.", descricao: "Descreva o serviço com pelo menos 10 letras.", prazo: "O prazo não pode ser antes de hoje." } });
    const n = g().dados.servicos.length;
    const r = g().criarServico({ clienteId: "c01", tipo: "pintura", descricao: "Pintar a guarita", prazo: "2026-10-20", duracao: "turno", prioridade: "urgente" });
    expect(r.ok).toBe(true);
    expect(r.id).toBe(`SV-${String(n + 1).padStart(4, "0")}`);
    expect(g().dados.servicos.at(-1)).toMatchObject({ etapa: "novo", criadoEm: "2026-10-07", prioridade: "urgente" });
  });

  it("recomecar restaura a semente", () => {
    const s = aberto();
    g().desagendar; // existe
    g().criarServico({ clienteId: "c01", tipo: "pintura", descricao: "Pintar a guarita", prazo: "2026-10-20", duracao: "turno", prioridade: "normal" });
    const antes = g().dados.servicos.length;
    g().recomecar();
    expect(g().dados.servicos.length).toBe(antes - 1);
    expect(g().dados.servicos.find((x) => x.id === s.id).etapa).toBe("novo");
  });

  it("persiste e recarrega do armazenamento", () => {
    g().setPapel("planejador");
    g().criarServico({ clienteId: "c01", tipo: "pintura", descricao: "Pintar a guarita", prazo: "2026-10-20", duracao: "turno", prioridade: "normal" });
    const outra = criarLoja({ storage: st, agora: AGORA });
    expect(outra.getState().papel).toBe("planejador");
    expect(outra.getState().dados.servicos.at(-1).descricao).toBe("Pintar a guarita");
  });

  it("armazenamento que falha não quebra e liga o aviso", () => {
    const ruim = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("cheio"); }, removeItem: () => {} };
    const l = criarLoja({ storage: ruim, agora: AGORA });
    expect(l.getState().dados.servicos.length).toBeGreaterThan(0);
    l.getState().setPapel("equipe");
    expect(l.getState().papel).toBe("equipe");
    expect(l.getState().avisoArmazenamento).toBe(true);
  });

  it("dado salvo de outra versão ou corrompido vira a semente", () => {
    st.setItem(CHAVE, JSON.stringify({ state: { dados: { versao: 0, servicos: [] }, papel: "planejador" }, version: 1 }));
    expect(criarLoja({ storage: st, agora: AGORA }).getState().dados.versao).toBe(1);
    st.setItem(CHAVE, "{isso não é json");
    expect(criarLoja({ storage: st, agora: AGORA }).getState().dados.servicos.length).toBeGreaterThan(0);
  });
});

import { TIPO } from "../src/dominio/tipos.js";
function require_checklist(tipo) { return TIPO[tipo].checklist.filter((i) => i.obrigatorio).map((i) => i.id); }
