// Dados de exemplo determinísticos e relativos a "hoje": 3 meses de histórico, a semana atual,
// a próxima semana e a lista "A agendar". Mesma data de entrada = mesmos dados.
import { EQUIPES, BAIRROS, RUAS, CLIENTES_BASE, CONTATOS, DESCRICOES } from "./nomes.js";
import { TIPO } from "../dominio/tipos.js";
import { somarDias, diaSemana, inicioSemana, mesDe } from "../dominio/datas.js";

export const VERSAO_DADOS = 1;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, "0");

export function gerarSemente(hoje) {
  const r = mulberry32(2026);
  const rand = (n) => Math.floor(r() * n);
  const pick = (a) => a[rand(a.length)];
  const chance = (p) => r() < p;
  const hora = (h) => `${pad(h)}:${pad(rand(50) + 5)}`;
  const embaralhar = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Clientes com "peso": alguns pedem bem mais que outros.
  const clientes = CLIENTES_BASE.map(([nome, tipo], i) => ({
    id: `c${pad(i + 1)}`, nome, tipo, bairro: pick(BAIRROS),
    endereco: `${pick(RUAS)}, ${100 + rand(1900)}`, contato: pick(CONTATOS),
    telefone: `(85) 9${8000 + rand(1999)}-${1000 + rand(8999)}`,
  }));
  const pesos = clientes.map((_, i) => (i % 6 === 0 ? 4 : i % 4 === 0 ? 2.2 : 0.6 + r()));
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  const clienteSorteado = () => { let x = r() * somaPesos; for (let i = 0; i < pesos.length; i++) { x -= pesos[i]; if (x <= 0) return clientes[i].id; } return clientes.at(-1).id; };

  const [ano, mes] = hoje.split("-").map(Number);
  const t0 = new Date(ano, mes - 1 - 3, 1);
  const inicio = `${t0.getFullYear()}-${pad(t0.getMonth() + 1)}-01`;
  const segAtual = inicioSemana(hoje);
  const segProxima = somarDias(segAtual, 7);
  const fimGrade = somarDias(segProxima, 5);
  const hojeUtil = diaSemana(hoje) !== 0;

  const ocupado = new Set(); // `${equipe}|${data}|${turno}`
  const chave = (e, d, t) => `${e}|${d}|${t}`;
  const livre = (e, d, turno) => (turno === "dia" ? !ocupado.has(chave(e, d, "manha")) && !ocupado.has(chave(e, d, "tarde")) : !ocupado.has(chave(e, d, turno)));
  const reservar = (e, d, turno) => { if (turno === "dia") { ocupado.add(chave(e, d, "manha")); ocupado.add(chave(e, d, "tarde")); } else ocupado.add(chave(e, d, turno)); };

  // 1) Grade: quais turnos cada equipe teve (ou terá) serviço.
  const vagas = [];
  for (let d = inicio; d <= fimGrade; d = somarDias(d, 1)) {
    if (diaSemana(d) === 0) continue;
    const p = d < hoje ? 0.58 : d === hoje ? 0.72 : d < segProxima ? 0.66 : 0.3;
    for (const eq of EQUIPES) {
      if (chance(0.2)) { if (chance(p)) { vagas.push({ equipe: eq, data: d, turno: "dia" }); reservar(eq.id, d, "dia"); } continue; }
      for (const turno of ["manha", "tarde"]) if (chance(p)) { vagas.push({ equipe: eq, data: d, turno }); reservar(eq.id, d, turno); }
    }
  }
  // Hoje a equipe Aroeira começa a manhã com um serviço em execução.
  if (hojeUtil && !vagas.some((v) => v.equipe.id === "aroeira" && v.data === hoje && v.turno !== "tarde")) {
    vagas.push({ equipe: EQUIPES[0], data: hoje, turno: "manha" }); reservar("aroeira", hoje, "manha");
  }

  const motivoSorteado = (data) => {
    const m = Number(data.slice(5, 7));
    const chuva = m >= 3 && m <= 5 ? 0.45 : 0.14;
    const resto = [["ausente", 0.27], ["material", 0.23], ["acesso", 0.18], ["maior", 0.18]];
    if (r() < chuva) return "chuva";
    let x = r() * resto.reduce((a, [, w]) => a + w, 0);
    for (const [id, w] of resto) { x -= w; if (x <= 0) return id; }
    return "maior";
  };
  // Procura um turno livre da mesma equipe alguns dias antes (a tentativa que foi reagendada).
  const tentativaAntes = (eq, data, duracao, limite) => {
    for (let k = 1 + rand(3); k <= 8; k++) {
      const d = somarDias(data, -k);
      if (d < limite) return null;
      if (diaSemana(d) === 0) continue;
      const turno = duracao === "dia" ? "dia" : pick(["manha", "tarde"]);
      if (livre(eq.id, d, turno)) { reservar(eq.id, d, turno); return { equipeId: eq.id, data: d, turno }; }
    }
    return null;
  };

  // 2) Um serviço por vaga.
  const servicos = vagas.map((v) => {
    const tipo = pick(v.equipe.especialidades);
    const duracao = v.turno === "dia" ? "dia" : "turno";
    const final = { equipeId: v.equipe.id, data: v.data, turno: v.turno };
    const passado = v.data < hoje;
    const tentativa = passado && chance(0.13) ? tentativaAntes(v.equipe, v.data, duracao, inicio) : null;
    const primeiro = tentativa ? tentativa.data : v.data;
    const criadoEm = somarDias(primeiro, -(2 + rand(7)));
    const s = {
      id: "", clienteId: clienteSorteado(), tipo, descricao: pick(DESCRICOES[tipo]),
      prioridade: chance(0.06) ? "urgente" : "normal", prazo: somarDias(v.data, 1 + rand(6)), duracao,
      etapa: "agendado", agendamento: final, criadoEm, historico: [], retorno: null,
    };
    const h = s.historico;
    h.push({ em: `${somarDias(criadoEm, 1) > primeiro ? criadoEm : somarDias(criadoEm, 1)}T${hora(9)}`, de: "novo", para: "agendado", por: "planejador", agendamento: tentativa || final });
    if (tentativa) {
      h.push({ em: `${tentativa.data}T${hora(10)}`, de: "agendado", para: "reagendar", por: "equipe", motivo: motivoSorteado(tentativa.data) });
      h.push({ em: `${tentativa.data}T${hora(16)}`, de: "reagendar", para: "agendado", por: "planejador", agendamento: final });
    }
    const inicioT = v.turno === "tarde" ? hora(13) : hora(7);
    if (passado || (v.data === hoje && v.equipe.id === "aroeira" && v.turno !== "tarde")) {
      h.push({ em: `${v.data}T${inicioT}`, de: "agendado", para: "execucao", por: "equipe" });
      s.etapa = "execucao";
      s.retorno = { iniciadoEm: `${v.data}T${inicioT}` };
    }
    if (passado) {
      const fim = `${v.data}T${v.turno === "manha" ? hora(11) : hora(16)}`;
      const checklist = Object.fromEntries(TIPO[tipo].checklist.map((i) => [i.id, i.obrigatorio || chance(0.6)]));
      h.push({ em: fim, de: "execucao", para: "concluido", por: "equipe" });
      s.etapa = "concluido";
      s.retorno = { ...s.retorno, resultado: "concluido", checklist, observacao: "", fotosAntes: [], fotosDepois: [], concluidoEm: fim };
    }
    return s;
  });

  // 3) Calibra o "no prazo" por mês: 78%, 84%, 89% nos 3 meses anteriores; 90% no mês atual.
  const meses = [0, 1, 2].map((k) => { const t = new Date(ano, mes - 1 - 3 + k, 1); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}`; });
  const taxa = { [meses[0]]: 0.78, [meses[1]]: 0.84, [meses[2]]: 0.89 };
  const porMes = {};
  for (const s of servicos) if (s.etapa === "concluido") (porMes[mesDe(s.retorno.concluidoEm)] ||= []).push(s);
  for (const [m, lista] of Object.entries(porMes)) {
    embaralhar(lista);
    const k = Math.round((taxa[m] ?? 0.9) * lista.length);
    lista.forEach((s, i) => {
      const feito = s.retorno.concluidoEm.slice(0, 10);
      s.prazo = i < k ? somarDias(feito, rand(5)) : somarDias(feito, -(1 + rand(4)));
      if (s.prazo < s.criadoEm) {
        s.criadoEm = somarDias(s.prazo, -3);
        s.historico[0].em = `${s.criadoEm}T${hora(9)}`;
      }
    });
  }

  // 4) Lista "A agendar": 7 novos (2 urgentes) e 3 que voltaram para reagendar.
  const abertos = [];
  for (let i = 0; i < 10; i++) {
    const tipo = pick(Object.keys(TIPO));
    const criadoEm = somarDias(hoje, -(1 + rand(5)));
    const s = {
      id: "", clienteId: clienteSorteado(), tipo, descricao: pick(DESCRICOES[tipo]),
      prioridade: i < 2 ? "urgente" : "normal", prazo: somarDias(hoje, i < 2 ? 2 + rand(2) : 4 + rand(9)),
      duracao: chance(0.2) ? "dia" : "turno", etapa: "novo", agendamento: null, criadoEm, historico: [], retorno: null,
    };
    if (i >= 7) {
      const eq = pick(EQUIPES.filter((e) => e.especialidades.includes(tipo)));
      const t = tentativaAntes(eq, hoje, s.duracao, somarDias(hoje, -10));
      if (t) {
        const motivo = motivoSorteado(t.data);
        s.criadoEm = somarDias(t.data, -3);
        s.historico.push({ em: `${s.criadoEm}T${hora(9)}`, de: "novo", para: "agendado", por: "planejador", agendamento: t });
        s.historico.push({ em: `${t.data}T${hora(10)}`, de: "agendado", para: "reagendar", por: "equipe", motivo });
        s.etapa = "reagendar";
      }
    }
    abertos.push(s);
  }

  const todos = [...servicos, ...abertos].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm) || a.prazo.localeCompare(b.prazo));
  todos.forEach((s, i) => { s.id = `SV-${String(i + 1).padStart(4, "0")}`; });

  return { versao: VERSAO_DADOS, geradoEm: hoje, equipes: EQUIPES.map((e) => ({ ...e })), clientes, servicos: todos };
}
