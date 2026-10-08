// Estado do app (Zustand) com persistência segura no navegador.
// Se o armazenamento falhar (modo privado, cheio), o app segue em memória e liga um aviso.
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { gerarSemente, VERSAO_DADOS } from "./semente.js";
import { podeAgendar, transicionar } from "../dominio/regras.js";
import { hojeISO, agoraLocal } from "../dominio/datas.js";
import { TIPO, PRIORIDADES, DURACOES } from "../dominio/tipos.js";

export const CHAVE = "ls-campo:dados:v1";
const SALVOS = ["dados", "papel", "equipeAtual", "tema", "crachaVisto"];

function ler(storage) {
  try {
    const bruto = storage?.getItem(CHAVE);
    if (!bruto) return { ok: true, valor: null };
    const v = JSON.parse(bruto);
    const estado = v?.state ?? v;
    if (estado?.dados?.versao !== VERSAO_DADOS) return { ok: true, valor: null };
    return { ok: true, valor: estado };
  } catch (e) {
    return { ok: !(e instanceof Error && !(e instanceof SyntaxError)), valor: null };
  }
}

export function criarLoja({ storage = typeof localStorage !== "undefined" ? localStorage : null, agora = () => new Date() } = {}) {
  const hoje = () => hojeISO(agora());
  const salvo = ler(storage);

  const loja = createStore((set, get) => {
    const atualizar = (id, fn) => {
      const servicos = get().dados.servicos;
      const i = servicos.findIndex((s) => s.id === id);
      if (i < 0) return { ok: false, motivo: "Serviço não encontrado." };
      try {
        const novo = fn(servicos[i]);
        const lista = servicos.slice();
        lista[i] = novo;
        set({ dados: { ...get().dados, servicos: lista } });
        return { ok: true };
      } catch (e) {
        return { ok: false, motivo: e.message };
      }
    };
    const equipe = (id) => get().dados.equipes.find((e) => e.id === id);

    return {
      dados: salvo.valor?.dados ?? gerarSemente(hoje()),
      papel: salvo.valor?.papel ?? null,
      equipeAtual: salvo.valor?.equipeAtual ?? null,
      tema: salvo.valor?.tema ?? "claro",
      crachaVisto: salvo.valor?.crachaVisto ?? {},
      avisoArmazenamento: !salvo.ok,
      hoje,

      /** Agenda ou move. Mesma função: a regra decide. */
      agendar(id, { equipeId, data, turno }) {
        const s = get().dados.servicos.find((x) => x.id === id);
        const eq = equipe(equipeId);
        if (!s || !eq) return { ok: false, motivo: "Serviço ou equipe não encontrado." };
        const regra = podeAgendar({ servico: s, equipe: eq, data, turno, servicos: get().dados.servicos, hoje: hoje() });
        if (!regra.ok) return regra;
        const r = atualizar(id, (x) => transicionar(x, "agendado", { por: "planejador", em: agoraLocal(agora()), agendamento: { equipeId, data, turno } }));
        return r.ok ? regra : r;
      },
      desagendar: (id) => atualizar(id, (x) => transicionar(x, "novo", { por: "planejador", em: agoraLocal(agora()) })),
      reagendar: (id, motivo, por = "planejador") => atualizar(id, (x) => transicionar(x, "reagendar", { por, motivo, em: agoraLocal(agora()) })),
      iniciar: (id) => atualizar(id, (x) => transicionar(x, "execucao", { por: "equipe", em: agoraLocal(agora()), hoje: hoje() })),
      retornar(id, { resultado, checklist = {}, observacao = "", fotosAntes = [], fotosDepois = [], motivo }) {
        const em = agoraLocal(agora());
        if (resultado === "concluido") {
          return atualizar(id, (x) => transicionar(x, "concluido", { por: "equipe", em, retorno: { checklist, observacao, fotosAntes, fotosDepois } }));
        }
        return atualizar(id, (x) => transicionar(x, "reagendar", { por: "equipe", em, motivo, retorno: { resultado: "reagendar", observacao, fotosAntes, fotosDepois } }));
      },
      criarServico(c) {
        const erros = {};
        if (!c.clienteId) erros.clienteId = "Escolha o cliente.";
        if (!TIPO[c.tipo]) erros.tipo = "Escolha o tipo de serviço.";
        if (!c.descricao || c.descricao.trim().length < 10) erros.descricao = "Descreva o serviço com pelo menos 10 letras.";
        if (!c.prazo) erros.prazo = "Informe o prazo.";
        else if (c.prazo < hoje()) erros.prazo = "O prazo não pode ser antes de hoje.";
        if (!DURACOES.includes(c.duracao)) erros.duracao = "Escolha a duração.";
        if (!PRIORIDADES.includes(c.prioridade)) erros.prioridade = "Escolha a prioridade.";
        if (Object.keys(erros).length) return { ok: false, erros };
        const servicos = get().dados.servicos;
        const maior = servicos.reduce((m, s) => Math.max(m, Number(s.id.slice(3))), 0);
        const id = `SV-${String(maior + 1).padStart(4, "0")}`;
        const novo = { id, clienteId: c.clienteId, tipo: c.tipo, descricao: c.descricao.trim(), prioridade: c.prioridade, prazo: c.prazo, duracao: c.duracao, etapa: "novo", agendamento: null, criadoEm: hoje(), historico: [], retorno: null };
        set({ dados: { ...get().dados, servicos: [...servicos, novo] } });
        return { ok: true, id };
      },
      recomecar: () => set({ dados: gerarSemente(hoje()), crachaVisto: {} }),
      setPapel: (papel) => set({ papel }),
      setEquipe: (equipeAtual) => set({ equipeAtual }),
      setTema: (tema) => set({ tema }),
      marcarCracha: (equipeId) => set({ crachaVisto: { ...get().crachaVisto, [equipeId]: true } }),
    };
  });

  // Salva a cada mudança do que importa. Falhou: segue em memória e avisa.
  let anterior = null;
  loja.subscribe((estado) => {
    const parte = Object.fromEntries(SALVOS.map((k) => [k, estado[k]]));
    if (anterior && SALVOS.every((k) => anterior[k] === parte[k])) return;
    anterior = parte;
    try {
      storage?.setItem(CHAVE, JSON.stringify({ state: parte, version: 1 }));
    } catch {
      if (!loja.getState().avisoArmazenamento) loja.setState({ avisoArmazenamento: true });
    }
  });

  return loja;
}

let lojaPadrao = null;
export const lojaApp = () => (lojaPadrao ||= criarLoja());
export const useLoja = (seletor) => useStore(lojaApp(), seletor);
