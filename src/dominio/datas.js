// Datas sempre como texto 'AAAA-MM-DD' no horário local. Nunca usar new Date('AAAA-MM-DD'),
// que o JavaScript lê como UTC e pode virar o dia anterior no Brasil.

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const pad = (n) => String(n).padStart(2, "0");

export function paraData(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function hojeISO(agora = new Date()) {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

export function somarDias(iso, n) {
  const d = paraData(iso);
  d.setDate(d.getDate() + n);
  return hojeISO(d);
}

export function diaSemana(iso) {
  return paraData(iso).getDay();
}

/** Segunda-feira da semana. Domingo pertence à semana que termina nele. */
export function inicioSemana(iso) {
  const dia = diaSemana(iso);
  return somarDias(iso, dia === 0 ? -6 : 1 - dia);
}

/** Segunda a sábado da semana de `iso`. */
export function diasDaSemana(iso) {
  const ini = inicioSemana(iso);
  return Array.from({ length: 6 }, (_, i) => somarDias(ini, i));
}

export function ehPassado(iso, hoje) {
  return iso < hoje;
}

export function formatar(iso, estilo = "dia") {
  const [, m, d] = iso.split("-");
  return estilo === "curto" ? `${d}/${m}` : `${DIAS[diaSemana(iso)]}, ${d}/${m}`;
}

export function mesDe(iso) {
  return iso.slice(0, 7);
}

/** Quantos dias de segunda a sábado existem de `inicio` até `fim`, inclusive. */
export function diasUteisEntre(inicio, fim) {
  let n = 0;
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) if (diaSemana(d) !== 0) n++;
  return n;
}

/** Data e hora locais: 'AAAA-MM-DDTHH:MM'. */
export function agoraLocal(agora = new Date()) {
  return `${hojeISO(agora)}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
}
