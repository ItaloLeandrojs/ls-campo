// Indicadores calculados a partir dos serviços. Nada fixo: mudou o dado, mudou o número.
import { TIPOS, MOTIVOS } from "./tipos.js";
import { diaSemana, diasUteisEntre, somarDias } from "./datas.js";

const um = (x) => Math.round(x * 10) / 10;
const dataDe = (em) => (em ? em.slice(0, 10) : null);
const dentro = (d, ini, fim) => d && d >= ini && d <= fim;

/** Turnos que o planejamento de fato reservou: mover e desagendar não contam; reagendado conta. */
export function reservas(servico) {
  const lista = [];
  let atual = null;
  for (const e of servico.historico) {
    if (e.para === "agendado") atual = e.agendamento;
    else if (e.para === "novo") atual = null;
    else if (e.para === "reagendar") { if (atual) lista.push({ ...atual, reagendado: true, motivo: e.motivo, em: e.em }); atual = null; }
  }
  if (atual) lista.push(atual);
  return lista;
}

function concluidosNo(servicos, { inicio, fim, equipeId }) {
  return servicos.filter((s) => s.etapa === "concluido"
    && dentro(dataDe(s.retorno?.concluidoEm), inicio, fim)
    && (!equipeId || s.agendamento?.equipeId === equipeId));
}

export const concluidos = (servicos, opts) => concluidosNo(servicos, opts).length;

export function noPrazo(servicos, opts) {
  const lista = concluidosNo(servicos, opts);
  const ok = lista.filter((s) => dataDe(s.retorno.concluidoEm) <= s.prazo).length;
  return { total: lista.length, noPrazo: ok, pct: lista.length ? um((ok / lista.length) * 100) : null };
}

export function ocupacao(servicos, { inicio, fim, equipeId, equipes, hoje }) {
  const fimEf = fim < hoje ? fim : hoje;
  const dias = fimEf < inicio ? 0 : diasUteisEntre(inicio, fimEf);
  const alvo = equipeId ? equipes.filter((e) => e.id === equipeId) : equipes;
  const conta = Object.fromEntries(alvo.map((e) => [e.id, 0]));
  for (const s of servicos) {
    for (const r of reservas(s)) {
      if (!(r.equipeId in conta) || !dentro(r.data, inicio, fimEf) || diaSemana(r.data) === 0) continue;
      conta[r.equipeId] += r.turno === "dia" ? 2 : 1;
    }
  }
  const porEquipe = alvo.map((e) => {
    const capacidade = dias * 2;
    return { equipeId: e.id, reservados: conta[e.id], capacidade, pct: capacidade ? um((conta[e.id] / capacidade) * 100) : null };
  });
  const tot = porEquipe.reduce((a, e) => a + e.reservados, 0);
  const cap = porEquipe.reduce((a, e) => a + e.capacidade, 0);
  return { geral: cap ? um((tot / cap) * 100) : null, porEquipe };
}

export function reagendamentos(servicos, { inicio, fim, equipeId }) {
  const n = {};
  let total = 0;
  for (const s of servicos) {
    for (const r of reservas(s)) {
      if (!r.reagendado || !dentro(dataDe(r.em), inicio, fim) || (equipeId && r.equipeId !== equipeId)) continue;
      n[r.motivo] = (n[r.motivo] || 0) + 1;
      total++;
    }
  }
  const ordem = MOTIVOS.map((m) => m.id);
  const porMotivo = Object.entries(n).map(([motivo, k]) => ({ motivo, n: k }))
    .sort((a, b) => b.n - a.n || ordem.indexOf(a.motivo) - ordem.indexOf(b.motivo));
  return { total, porMotivo };
}

const criadosNo = (servicos, { inicio, fim, equipeId }) =>
  servicos.filter((s) => dentro(s.criadoEm, inicio, fim) && (!equipeId || s.agendamento?.equipeId === equipeId));

export function porTipo(servicos, opts) {
  const n = {};
  for (const s of criadosNo(servicos, opts)) n[s.tipo] = (n[s.tipo] || 0) + 1;
  const ordem = TIPOS.map((t) => t.id);
  return Object.entries(n).map(([tipo, k]) => ({ tipo, n: k }))
    .sort((a, b) => b.n - a.n || ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo));
}

export function topClientes(servicos, opts, quantos = 5) {
  const n = {};
  for (const s of criadosNo(servicos, opts)) n[s.clienteId] = (n[s.clienteId] || 0) + 1;
  return Object.entries(n).map(([clienteId, k]) => ({ clienteId, n: k }))
    .sort((a, b) => b.n - a.n || a.clienteId.localeCompare(b.clienteId))
    .slice(0, quantos);
}

/** Último dia do mês 'AAAA-MM'. */
export function fimDoMes(mes) {
  const [a, m] = mes.split("-").map(Number);
  const prox = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
  return somarDias(prox, -1);
}

export function serieMensalPrazo(servicos, meses, equipeId) {
  return meses.map((mes) => {
    const r = noPrazo(servicos, { inicio: `${mes}-01`, fim: fimDoMes(mes), equipeId });
    return { mes, pct: r.pct, total: r.total };
  });
}
