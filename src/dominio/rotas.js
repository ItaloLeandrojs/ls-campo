// Rotas da equipe: saída da sede, visitas do dia na ordem dos turnos (manhã, depois tarde) e volta à sede.
// As distâncias vêm de geo-pontos.json (rotas de carro calculadas uma vez pelas ruas). Funções puras e testáveis.

const ATIVAS = new Set(["agendado", "execucao", "concluido"]);
const ORDEM_TURNO = { manha: 0, dia: 0, tarde: 1 };
const um = (x) => Math.round(x * 10) / 10;

/** "12,4 km" e "1 h 05 min": como mostrar distância e tempo na tela. */
export const textoKm = (v) => `${String(v).replace(".", ",")} km`;
export const textoTempo = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min` : `${m} min`);

/** Distância e tempo de carro entre dois pontos ("sede" ou id de cliente), nos dois sentidos. */
export function trecho(geo, a, b) {
  if (a === b) return { km: 0, min: 0 };
  const d = geo.dist[`${a}|${b}`] ?? geo.dist[`${b}|${a}`];
  if (!d) return { km: 0, min: 0 };
  return { km: d[0], min: d[1] };
}

const somar = (geo, lugares) => {
  let km = 0, min = 0;
  for (let i = 1; i < lugares.length; i++) { const t = trecho(geo, lugares[i - 1], lugares[i]); km += t.km; min += t.min; }
  return { km: um(km), min };
};

const doDia = (servicos, equipeId, data) => servicos
  .filter((s) => s.agendamento?.equipeId === equipeId && s.agendamento.data === data && ATIVAS.has(s.etapa))
  .sort((a, b) => ORDEM_TURNO[a.agendamento.turno] - ORDEM_TURNO[b.agendamento.turno]);

/**
 * Rota do dia de uma equipe. paradas: [sede, ...serviços, sede] (vazio se não há visita).
 * trechos[i] vai de paradas[i] a paradas[i + 1].
 */
export function rotaDoDia({ servicos, equipeId, data, geo }) {
  const visitas = doDia(servicos, equipeId, data);
  if (!visitas.length) return { paradas: [], trechos: [], totalKm: 0, totalMin: 0 };
  const sede = { id: "sede", lugar: "sede", tipo: "sede" };
  const paradas = [sede, ...visitas.map((s) => ({ id: s.id, lugar: s.clienteId, tipo: "visita", turno: s.agendamento.turno, servico: s })), sede];
  const trechos = paradas.slice(1).map((p, i) => ({ de: paradas[i].lugar, para: p.lugar, ...trecho(geo, paradas[i].lugar, p.lugar) }));
  return { paradas, trechos, totalKm: um(trechos.reduce((a, t) => a + t.km, 0)), totalMin: trechos.reduce((a, t) => a + t.min, 0) };
}

/** Quantos km e minutos a mais o dia da equipe ganha se o serviço entrar neste turno. */
export function custoEncaixe({ servico, equipeId, data, turno, servicos, geo }) {
  const atuais = doDia(servicos.filter((s) => s.id !== servico.id), equipeId, data);
  const antes = atuais.length ? somar(geo, ["sede", ...atuais.map((s) => s.clienteId), "sede"]) : { km: 0, min: 0 };
  const novo = { clienteId: servico.clienteId, agendamento: { turno: servico.duracao === "dia" ? "dia" : turno } };
  const depois = [...atuais, novo].sort((a, b) => ORDEM_TURNO[a.agendamento.turno] - ORDEM_TURNO[b.agendamento.turno]);
  const total = somar(geo, ["sede", ...depois.map((s) => s.clienteId), "sede"]);
  return { extraKm: um(total.km - antes.km), extraMin: total.min - antes.min, totalKm: total.km };
}

/** Lê uma linha no formato polyline (precisão 5) e devolve [[lng, lat], ...]. */
export function decodificar(linha) {
  const coords = [];
  let i = 0, lat = 0, lng = 0;
  const ler = () => { let r = 0, s = 0, b; do { b = linha.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20); return r & 1 ? ~(r >> 1) : r >> 1; };
  while (i < linha.length) { lat += ler(); lng += ler(); coords.push([lng / 1e5, lat / 1e5]); }
  return coords;
}

/** Traçado pelas ruas entre dois pontos, no sentido pedido (as linhas são guardadas num sentido só). */
export function tracado(linhas, a, b) {
  if (linhas[`${a}|${b}`]) return decodificar(linhas[`${a}|${b}`]);
  if (linhas[`${b}|${a}`]) return decodificar(linhas[`${b}|${a}`]).reverse();
  return [];
}
