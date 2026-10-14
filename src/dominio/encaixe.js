// Sugestão de encaixe: para cada vaga que a regra aceita, quantos km o serviço acrescenta ao dia da equipe.
// A vaga mais econômica dentro do prazo é a sugestão (empate: a mais cedo). Vagas depois do prazo só entram se não houver outra.
import { podeAgendar } from "./regras.js";
import { custoEncaixe } from "./rotas.js";

export function custosDasVagas({ servico, equipes, dias, servicos, hoje, geo }) {
  const custos = {};
  if (!servico || !geo.clientes[servico.clienteId]) return custos;
  const turnos = servico.duracao === "dia" ? ["dia"] : ["manha", "tarde"];
  for (const equipe of equipes) {
    for (const data of dias) {
      for (const turno of turnos) {
        const r = podeAgendar({ servico, equipe, data, turno, servicos, hoje });
        if (!r.ok) continue;
        const c = custoEncaixe({ servico, equipeId: equipe.id, data, turno, servicos, geo });
        custos[`${equipe.id}|${data}|${turno}`] = r.aviso ? { ...c, aviso: true } : c;
      }
    }
  }
  return custos;
}

export function melhorVaga(custos) {
  let melhor = null;
  for (const [chave, c] of Object.entries(custos)) {
    const [equipeId, data, turno] = chave.split("|");
    const ordem = `${data}|${turno === "tarde" ? 1 : 0}`;
    const fora = c.aviso ? 1 : 0;
    if (!melhor || fora < melhor.fora || (fora === melhor.fora && (c.extraKm < melhor.extraKm || (c.extraKm === melhor.extraKm && ordem < melhor.ordem)))) {
      melhor = { chave, equipeId, data, turno, extraKm: c.extraKm, ordem, fora };
    }
  }
  if (!melhor) return null;
  const { ordem, fora, ...resto } = melhor;
  return resto;
}
