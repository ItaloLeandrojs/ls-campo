import { useMemo, useState } from "react";
import { useMapas, useServicos, useEquipes, useHoje } from "../../dados/seletores.js";
import { concluidos, noPrazo, ocupacao, reagendamentos, porTipo, topClientes, serieMensalPrazo } from "../../dominio/indicadores.js";
import { TIPO, MOTIVO } from "../../dominio/tipos.js";
import { BarrasV, BarrasH, Numero, useChaveAnimacao } from "../../ui/Grafico.jsx";
import "./indicadores.css";

const NOME_MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const pad = (n) => String(n).padStart(2, "0");
const META = 85;

function mesesAte(hoje, n) {
  const [a, m] = hoje.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => { const t = new Date(a, m - 1 - (n - 1 - i), 1); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}`; });
}

export default function Indicadores() {
  const servicos = useServicos();
  const equipes = useEquipes();
  const { clientes, equipes: mapaEq } = useMapas();
  const hoje = useHoje();
  const [periodo, setPeriodo] = useState("3m");
  const [equipeId, setEquipeId] = useState("");
  const chave = useChaveAnimacao(periodo, equipeId);

  const ind = useMemo(() => {
    const meses4 = mesesAte(hoje, 4);
    const inicio = periodo === "mes" ? `${hoje.slice(0, 7)}-01` : `${meses4[0]}-01`;
    const opts = { inicio, fim: hoje, equipeId: equipeId || undefined, equipes, hoje };
    const serie = serieMensalPrazo(servicos, meses4, equipeId || undefined);
    return {
      concl: concluidos(servicos, opts),
      prazo: noPrazo(servicos, opts),
      ocup: ocupacao(servicos, opts),
      ocupTodas: ocupacao(servicos, { ...opts, equipeId: undefined }),
      reag: reagendamentos(servicos, opts),
      tipos: porTipo(servicos, opts),
      top: topClientes(servicos, opts, 5),
      serie,
    };
  }, [servicos, equipes, hoje, periodo, equipeId]);

  const s = ind.serie;
  const cheios = s.slice(0, 3).filter((x) => x.pct !== null);
  let tituloPrazo = "Prazo cumprido por mês";
  if (cheios.length >= 2) {
    const ini = cheios[0].pct, fim = cheios.at(-1).pct;
    tituloPrazo = fim > ini ? `O prazo melhorou de ${Math.round(ini)}% para ${Math.round(fim)}% em ${cheios.length} meses` : fim < ini ? `O prazo caiu de ${Math.round(ini)}% para ${Math.round(fim)}%` : "O prazo ficou estável";
  }
  const ocupOrd = [...ind.ocupTodas.porEquipe].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  const maisOcup = ocupOrd[0];
  const motivoTop = ind.reag.porMotivo[0];
  const tipoTop = ind.tipos[0];
  const rotPeriodo = periodo === "mes" ? "neste mês" : "nos últimos 3 meses";

  return (
    <div className="indicadores">
      <div className="topo-tela">
        <div><h1>Indicadores</h1><p>Calculados a partir dos serviços da agenda. Mudou a agenda, mudam os números.</p></div>
      </div>
      <div className="filtros-ind" role="group" aria-label="Filtros">
        <div className="seg" role="radiogroup" aria-label="Período">
          {[["mes", "Mês atual"], ["3m", "Últimos 3 meses"]].map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={periodo === v} className={periodo === v ? "ativo" : ""} onClick={() => setPeriodo(v)}>{t}</button>
          ))}
        </div>
        <select aria-label="Equipe" value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
          <option value="">Todas as equipes</option>
          {equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>

      <div className="kpis">
        <div className="kpi cartao"><span>Concluídos {rotPeriodo}</span><b><Numero valor={ind.concl} /></b></div>
        <div className="kpi cartao"><span>No prazo</span><b><Numero valor={ind.prazo.pct} casas={1} sufixo="%" /></b><small>{ind.prazo.noPrazo} de {ind.prazo.total} concluídos</small></div>
        <div className="kpi cartao"><span>Ocupação média</span><b><Numero valor={ind.ocup.geral} casas={1} sufixo="%" /></b><small>turnos reservados até hoje</small></div>
        <div className="kpi cartao"><span>Reagendamentos</span><b><Numero valor={ind.reag.total} /></b><small>{motivoTop ? `${MOTIVO[motivoTop.motivo].nome} lidera` : "nenhum no período"}</small></div>
      </div>

      <div className="paineis">
        <section className="painel cartao painel-largo">
          <h2>{tituloPrazo}</h2>
          <p className="painel-sub">Serviços concluídos até o prazo, por mês{equipeId ? `, equipe ${mapaEq[equipeId].nome}` : ""}. O mês atual ainda está em andamento.</p>
          <BarrasV titulo="Percentual no prazo por mês" chave={chave} meta={META}
            dados={s.map((x, i) => ({ rotulo: `${NOME_MES[Number(x.mes.slice(5)) - 1]}${i === s.length - 1 ? " (até hoje)" : ""}`, valor: x.pct, casas: 1, fraco: i === s.length - 1, dica: `${x.total} concluídos` }))} />
        </section>

        <section className="painel cartao">
          <h2>{maisOcup ? `${mapaEq[maisOcup.equipeId].nome} é a equipe mais ocupada` : "Ocupação por equipe"}</h2>
          <p className="painel-sub">Turnos reservados {rotPeriodo}, sobre a capacidade (manhã e tarde, segunda a sábado).</p>
          <BarrasH titulo="Ocupação por equipe" chave={chave} max={100} unidade="%" destaque={equipeId || undefined}
            dados={ocupOrd.map((o) => ({ id: o.equipeId, rotulo: mapaEq[o.equipeId].nome, valor: o.pct, casas: 1, dica: `${o.reservados} de ${o.capacidade} turnos` }))} />
        </section>

        <section className="painel cartao">
          <h2>{motivoTop ? `${MOTIVO[motivoTop.motivo].nome} é o motivo mais comum de reagendar` : "Nenhum reagendamento no período"}</h2>
          <p className="painel-sub">Quantas vezes cada motivo tirou um serviço da agenda {rotPeriodo}.</p>
          {ind.reag.total > 0 ? (
            <BarrasH titulo="Motivos de reagendamento" chave={chave}
              dados={ind.reag.porMotivo.map((m) => ({ rotulo: MOTIVO[m.motivo].nome, valor: m.n, dica: `${Math.round((m.n / ind.reag.total) * 100)}% dos reagendamentos` }))} />
          ) : <p className="vazio-curto">Sem reagendamentos neste recorte.</p>}
        </section>

        <section className="painel cartao painel-largo painel-duplo">
          <div>
            <h2>{tipoTop ? `${TIPO[tipoTop.tipo].nome} é o serviço mais pedido` : "Serviços por tipo"}</h2>
            <p className="painel-sub">Pedidos criados {rotPeriodo}.</p>
            <BarrasH titulo="Serviços por tipo" chave={chave} dados={ind.tipos.map((t) => ({ rotulo: TIPO[t.tipo].nome, valor: t.n }))} />
          </div>
          <div>
            <h2>Clientes que mais pedem</h2>
            <p className="painel-sub">Os 5 com mais pedidos {rotPeriodo}.</p>
            <ol className="top-clientes">
              {ind.top.map((t) => <li key={t.clienteId}><span>{clientes[t.clienteId]?.nome}</span><b className="num">{t.n}</b></li>)}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
