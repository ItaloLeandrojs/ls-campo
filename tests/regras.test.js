import { describe, it, expect } from "vitest";
import { ocupados, podeAgendar, transicionar } from "../src/dominio/regras.js";

const HOJE = "2026-10-07"; // quarta
const ipe = { id: "ipe", nome: "Ipê", lider: "Rosana", especialidades: ["pintura", "reparos"] };
const jatoba = { id: "jatoba", nome: "Jatobá", lider: "Cláudio", especialidades: ["hidraulica", "reparos"] };

const sv = (o = {}) => ({
  id: "SV-0001", clienteId: "c1", tipo: "pintura", descricao: "Pintar hall", prioridade: "normal",
  prazo: "2026-10-20", duracao: "turno", etapa: "novo", agendamento: null, criadoEm: "2026-10-01",
  historico: [], retorno: null, ...o,
});
const agendado = (id, equipeId, data, turno, extra = {}) => sv({ id, etapa: "agendado", agendamento: { equipeId, data, turno }, ...extra });

describe("ocupados", () => {
  it("serviço de dia ocupa manhã e tarde; ignora o próprio serviço", () => {
    const lista = [agendado("A", "ipe", "2026-10-08", "dia"), agendado("B", "ipe", "2026-10-09", "tarde")];
    expect(ocupados(lista, "ipe", "2026-10-08")).toEqual({ manha: "A", tarde: "A" });
    expect(ocupados(lista, "ipe", "2026-10-09")).toEqual({ manha: null, tarde: "B" });
    expect(ocupados(lista, "ipe", "2026-10-08", "A")).toEqual({ manha: null, tarde: null });
  });
});

describe("podeAgendar", () => {
  const base = { servico: sv(), equipe: ipe, data: "2026-10-08", turno: "manha", servicos: [], hoje: HOJE };

  it("aceita turno livre de equipe com a especialidade", () => {
    expect(podeAgendar(base)).toEqual({ ok: true });
  });
  it("1. recusa dia passado", () => {
    expect(podeAgendar({ ...base, data: "2026-10-06" })).toEqual({ ok: false, motivo: "Não dá para agendar em dia que já passou." });
  });
  it("aceita hoje", () => expect(podeAgendar({ ...base, data: HOJE }).ok).toBe(true));
  it("2. recusa domingo", () => {
    expect(podeAgendar({ ...base, data: "2026-10-11" })).toEqual({ ok: false, motivo: "Agendamos de segunda a sábado." });
  });
  it("3. recusa turno ocupado", () => {
    const servicos = [agendado("X", "ipe", "2026-10-08", "manha")];
    expect(podeAgendar({ ...base, servicos })).toEqual({ ok: false, motivo: "A equipe Ipê já tem serviço nesta manhã." });
    expect(podeAgendar({ ...base, servicos, turno: "tarde" }).ok).toBe(true);
  });
  it("4. dia inteiro precisa dos dois turnos livres", () => {
    const servico = sv({ duracao: "dia" });
    const servicos = [agendado("X", "ipe", "2026-10-08", "tarde")];
    expect(podeAgendar({ ...base, servico, turno: "dia", servicos })).toEqual({ ok: false, motivo: "Serviço de dia inteiro precisa da manhã e da tarde livres." });
    expect(podeAgendar({ ...base, servico, turno: "manha" }).ok).toBe(true); // turno ignorado: vira dia
  });
  it("5. bloqueia equipe sem a especialidade", () => {
    expect(podeAgendar({ ...base, equipe: jatoba })).toEqual({ ok: false, motivo: "A equipe Jatobá não faz pintura." });
  });
  it("6. avisa (sem bloquear) quando fica depois do prazo", () => {
    expect(podeAgendar({ ...base, data: "2026-10-22" })).toEqual({ ok: true, aviso: "Fica depois do prazo (20/10)." });
  });
  it("mover dentro da mesma equipe não colide consigo mesmo", () => {
    const servico = agendado("A", "ipe", "2026-10-08", "manha");
    expect(podeAgendar({ ...base, servico, servicos: [servico], turno: "manha" }).ok).toBe(true);
  });
});

describe("transicionar", () => {
  const em = "2026-10-07T09:30";
  it("novo → agendado grava agendamento e histórico", () => {
    const s = transicionar(sv(), "agendado", { por: "planejador", agendamento: { equipeId: "ipe", data: "2026-10-08", turno: "manha" }, em });
    expect(s.etapa).toBe("agendado");
    expect(s.agendamento.equipeId).toBe("ipe");
    expect(s.historico).toHaveLength(1);
    expect(s.historico[0]).toMatchObject({ de: "novo", para: "agendado", por: "planejador", em });
  });
  it("não muda o objeto original", () => {
    const original = sv();
    transicionar(original, "agendado", { por: "planejador", agendamento: { equipeId: "ipe", data: "2026-10-08", turno: "manha" }, em });
    expect(original.etapa).toBe("novo");
    expect(original.historico).toHaveLength(0);
  });
  it("recusa transição fora da tabela e quem não pode", () => {
    expect(() => transicionar(sv(), "concluido", { por: "equipe", em })).toThrow("Transição não permitida: Novo → Concluído");
    expect(() => transicionar(agendado("A", "ipe", HOJE, "manha"), "execucao", { por: "planejador", em, hoje: HOJE })).toThrow("Transição não permitida");
  });
  it("agendado → execucao só no dia", () => {
    expect(() => transicionar(agendado("A", "ipe", "2026-10-08", "manha"), "execucao", { por: "equipe", em, hoje: HOJE })).toThrow("Só dá para iniciar no dia agendado.");
    const s = transicionar(agendado("A", "ipe", HOJE, "manha"), "execucao", { por: "equipe", em, hoje: HOJE });
    expect(s.etapa).toBe("execucao");
    expect(s.retorno.iniciadoEm).toBe(em);
  });
  it("execucao → concluido exige checklist obrigatório completo", () => {
    const emExec = transicionar(agendado("A", "ipe", HOJE, "manha"), "execucao", { por: "equipe", em, hoje: HOJE });
    expect(() => transicionar(emExec, "concluido", { por: "equipe", em, retorno: { checklist: { protecao: true } } }))
      .toThrow("Falta marcar: Superfície preparada, Duas demãos aplicadas, Limpeza final");
    const ok = transicionar(emExec, "concluido", { por: "equipe", em: "2026-10-07T11:40", retorno: { checklist: { protecao: true, preparo: true, demaos: true, limpeza: true }, observacao: "ok", fotosAntes: [], fotosDepois: [] } });
    expect(ok.etapa).toBe("concluido");
    expect(ok.retorno.concluidoEm).toBe("2026-10-07T11:40");
    expect(ok.retorno.iniciadoEm).toBe(em);
    expect(ok.agendamento.data).toBe(HOJE); // concluído mantém onde foi feito
  });
  it("reagendar exige motivo e libera o turno", () => {
    const a = agendado("A", "ipe", "2026-10-08", "manha");
    expect(() => transicionar(a, "reagendar", { por: "planejador", em })).toThrow("Informe o motivo do reagendamento.");
    const r = transicionar(a, "reagendar", { por: "planejador", em, motivo: "chuva" });
    expect(r.etapa).toBe("reagendar");
    expect(r.agendamento).toBeNull();
    expect(r.historico.at(-1)).toMatchObject({ para: "reagendar", motivo: "chuva" });
  });
  it("concluído é final", () => {
    const c = sv({ etapa: "concluido" });
    expect(() => transicionar(c, "reagendar", { por: "planejador", em, motivo: "chuva" })).toThrow("Transição não permitida");
  });
  it("histórico cresce 1 por transição e guarda o agendamento", () => {
    let s = transicionar(sv(), "agendado", { por: "planejador", agendamento: { equipeId: "ipe", data: "2026-10-08", turno: "manha" }, em });
    s = transicionar(s, "agendado", { por: "planejador", agendamento: { equipeId: "ipe", data: "2026-10-09", turno: "tarde" }, em });
    s = transicionar(s, "novo", { por: "planejador", em });
    expect(s.historico.map((h) => h.para)).toEqual(["agendado", "agendado", "novo"]);
    expect(s.historico[1].agendamento.data).toBe("2026-10-09");
    expect(s.agendamento).toBeNull();
  });
});
