// Regras de negócio: quem pode ir para onde, e quando um serviço cabe num turno.
import { TIPO, TRANSICOES, ROTULO_ETAPA } from "./tipos.js";
import { diaSemana, ehPassado, formatar } from "./datas.js";

const NOME_TURNO = { manha: "manhã", tarde: "tarde" };

/** Quais turnos da equipe estão ocupados no dia (id do serviço ou null). */
export function ocupados(servicos, equipeId, data, ignorarId = null) {
  const r = { manha: null, tarde: null };
  for (const s of servicos) {
    const a = s.agendamento;
    if (!a || s.id === ignorarId || a.equipeId !== equipeId || a.data !== data) continue;
    if (a.turno === "dia") { r.manha = s.id; r.tarde = s.id; } else r[a.turno] = s.id;
  }
  return r;
}

/** Verifica se o serviço cabe. Retorna { ok, motivo? } ou { ok: true, aviso? }. */
export function podeAgendar({ servico, equipe, data, turno, servicos, hoje }) {
  if (ehPassado(data, hoje)) return { ok: false, motivo: "Não dá para agendar em dia que já passou." };
  if (diaSemana(data) === 0) return { ok: false, motivo: "Agendamos de segunda a sábado." };
  if (!equipe.especialidades.includes(servico.tipo)) {
    return { ok: false, motivo: `A equipe ${equipe.nome} não faz ${TIPO[servico.tipo].nome.toLowerCase()}.` };
  }
  const livre = ocupados(servicos, equipe.id, data, servico.id);
  if (servico.duracao === "dia") {
    if (livre.manha || livre.tarde) return { ok: false, motivo: "Serviço de dia inteiro precisa da manhã e da tarde livres." };
  } else if (livre[turno]) {
    return { ok: false, motivo: `A equipe ${equipe.nome} já tem serviço nesta ${NOME_TURNO[turno]}.` };
  }
  if (servico.prazo && data > servico.prazo) return { ok: true, aviso: `Fica depois do prazo (${formatar(servico.prazo, "curto")}).` };
  return { ok: true };
}

/** Turno efetivo: serviço de dia inteiro sempre ocupa o dia. */
export const turnoDe = (servico, turno) => (servico.duracao === "dia" ? "dia" : turno);

/**
 * Leva o serviço para outra etapa, sem mudar o original.
 * opcoes: { por: 'planejador'|'equipe', em: 'AAAA-MM-DDTHH:MM', motivo?, agendamento?, retorno?, hoje? }
 */
export function transicionar(servico, para, { por, em, motivo, agendamento, retorno, hoje } = {}) {
  const de = servico.etapa;
  const quem = TRANSICOES[de]?.[para];
  if (!quem || !quem.includes(por)) throw new Error(`Transição não permitida: ${ROTULO_ETAPA[de]} → ${ROTULO_ETAPA[para]}`);

  const s = { ...servico, etapa: para, historico: [...servico.historico] };
  const evento = { em, de, para, por };

  if (para === "agendado") {
    if (!agendamento) throw new Error("Informe equipe, dia e turno.");
    s.agendamento = { ...agendamento, turno: turnoDe(servico, agendamento.turno) };
    evento.agendamento = s.agendamento;
  } else if (para === "novo") {
    s.agendamento = null;
  } else if (para === "reagendar") {
    if (!motivo) throw new Error("Informe o motivo do reagendamento.");
    evento.motivo = motivo;
    s.agendamento = null;
    s.retorno = retorno ? { ...servico.retorno, ...retorno } : servico.retorno;
  } else if (para === "execucao") {
    if (servico.agendamento?.data !== hoje) throw new Error("Só dá para iniciar no dia agendado.");
    s.retorno = { ...(servico.retorno || {}), iniciadoEm: em };
  } else if (para === "concluido") {
    const marcados = retorno?.checklist || {};
    const faltam = TIPO[servico.tipo].checklist.filter((i) => i.obrigatorio && !marcados[i.id]);
    if (faltam.length) throw new Error(`Falta marcar: ${faltam.map((i) => i.texto).join(", ")}`);
    s.retorno = { ...(servico.retorno || {}), ...retorno, resultado: "concluido", concluidoEm: em };
  }

  s.historico.push(evento);
  return s;
}
