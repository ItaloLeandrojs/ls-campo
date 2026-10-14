// Relatório dos Indicadores para exportar: as mesmas contas da tela (painel), organizadas em abas e colunas.
// Cada célula é um valor simples (o tipo vem da coluna) ou { valor, tipo } quando a linha mistura tipos.
import { painel } from "./indicadores.js";
import { TIPO, MOTIVO } from "./tipos.js";

const NOME_MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dataBR = (iso) => iso.split("-").reverse().join("/");
const fracao = (pct) => (pct === null || pct === undefined ? null : Math.round(pct * 10) / 1000);
const diasEntre = (a, b) => Math.round((Date.UTC(...b.split("-").map((x, i) => (i === 1 ? x - 1 : +x))) - Date.UTC(...a.split("-").map((x, i) => (i === 1 ? x - 1 : +x)))) / 86400000);

export function montarRelatorio({ servicos, equipes, clientes, hoje, periodo, equipeId, geradoEm }) {
  const p = painel(servicos, { hoje, periodo, equipeId, equipes });
  const nomeEq = Object.fromEntries(equipes.map((e) => [e.id, e.nome]));
  const rotPeriodo = periodo === "mes" ? "Mês atual" : "Últimos 3 meses";
  const rotEquipe = equipeId ? `equipe ${nomeEq[equipeId]}` : "todas as equipes";
  const filtros = `${rotPeriodo} (${dataBR(p.inicio)} a ${dataBR(hoje)}), ${rotEquipe}`;
  const motivoTop = p.reag.porMotivo[0];

  const resumo = {
    nome: "Resumo",
    colunas: [{ titulo: "Indicador", tipo: "texto", largura: 26 }, { titulo: "Valor", tipo: "numero", largura: 14 }, { titulo: "Detalhe", tipo: "texto", largura: 44 }],
    linhas: [
      ["Concluídos", p.concl, "serviços concluídos no período"],
      ["No prazo", { valor: fracao(p.prazo.pct), tipo: "pct" }, `${p.prazo.noPrazo} de ${p.prazo.total} concluídos até o prazo`],
      ["Ocupação média", { valor: fracao(p.ocup.geral), tipo: "pct" }, "turnos reservados até hoje, sobre a capacidade"],
      ["Reagendamentos", p.reag.total, motivoTop ? `${MOTIVO[motivoTop.motivo].nome} é o motivo mais comum` : "nenhum no período"],
      ["Período", { valor: filtros, tipo: "texto" }, ""],
      ["Gerado em", { valor: geradoEm.slice(0, 10), tipo: "data" }, `às ${geradoEm.slice(11, 16)}, pelo LS Campo (dados fictícios)`],
    ],
  };

  const ultimo = p.serie.length - 1;
  const prazoMes = {
    nome: "Prazo por mês",
    colunas: [{ titulo: "Mês", tipo: "texto", largura: 12 }, { titulo: "Concluídos", tipo: "numero", largura: 12 }, { titulo: "No prazo", tipo: "pct", largura: 12 }, { titulo: "Meta", tipo: "pct", largura: 10 }, { titulo: "Observação", tipo: "texto", largura: 26 }],
    linhas: p.serie.map((x, i) => [`${NOME_MES[Number(x.mes.slice(5)) - 1]}/${x.mes.slice(0, 4)}`, x.total, fracao(x.pct), 0.85, i === ultimo ? "mês em andamento" : ""]),
  };

  const ocupacao = {
    nome: "Ocupação",
    colunas: [{ titulo: "Equipe", tipo: "texto", largura: 16 }, { titulo: "Turnos reservados", tipo: "numero", largura: 18 }, { titulo: "Capacidade (turnos)", tipo: "numero", largura: 20 }, { titulo: "Ocupação", tipo: "pct", largura: 12 }],
    linhas: [...p.ocupTodas.porEquipe].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0)).map((o) => [nomeEq[o.equipeId], o.reservados, o.capacidade, fracao(o.pct)]),
  };

  const reag = {
    nome: "Reagendamentos",
    colunas: [{ titulo: "Motivo", tipo: "texto", largura: 30 }, { titulo: "Quantidade", tipo: "numero", largura: 12 }, { titulo: "% do total", tipo: "pct", largura: 12 }],
    linhas: p.reag.porMotivo.map((m) => [MOTIVO[m.motivo].nome, m.n, p.reag.total ? Math.round((m.n / p.reag.total) * 1000) / 1000 : null]),
  };

  const tipos = {
    nome: "Por tipo",
    colunas: [{ titulo: "Tipo de serviço", tipo: "texto", largura: 24 }, { titulo: "Pedidos", tipo: "numero", largura: 10 }],
    linhas: p.tipos.map((t) => [TIPO[t.tipo].nome, t.n]),
  };

  const top = {
    nome: "Clientes",
    colunas: [{ titulo: "Cliente", tipo: "texto", largura: 34 }, { titulo: "Pedidos", tipo: "numero", largura: 10 }],
    linhas: p.top.map((t) => [clientes[t.clienteId]?.nome ?? t.clienteId, t.n]),
  };

  const lista = [...p.concluidosLista].sort((a, b) => a.retorno.concluidoEm.localeCompare(b.retorno.concluidoEm));
  const servicosAba = {
    nome: "Serviços",
    colunas: [
      { titulo: "Código", tipo: "texto", largura: 10 }, { titulo: "Cliente", tipo: "texto", largura: 32 }, { titulo: "Tipo", tipo: "texto", largura: 20 },
      { titulo: "Equipe", tipo: "texto", largura: 12 }, { titulo: "Prazo", tipo: "data", largura: 12 }, { titulo: "Concluído em", tipo: "data", largura: 14 },
      { titulo: "No prazo", tipo: "texto", largura: 10 }, { titulo: "Dias de atraso", tipo: "numero", largura: 15 },
    ],
    linhas: lista.map((s) => {
      const fim = s.retorno.concluidoEm.slice(0, 10);
      const atraso = s.prazo ? Math.max(0, diasEntre(s.prazo, fim)) : 0;
      return [s.id, clientes[s.clienteId]?.nome ?? "", TIPO[s.tipo].nome, nomeEq[s.agendamento?.equipeId] ?? "", s.prazo ?? null, fim, s.prazo && fim <= s.prazo ? "Sim" : "Não", atraso]; // mesma regra do noPrazo: sem prazo não conta como no prazo
    }),
  };

  return { titulo: "LS Campo · Indicadores", filtros, abas: [resumo, prazoMes, ocupacao, reag, tipos, top, servicosAba] };
}
