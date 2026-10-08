import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { useMapas, useServicos, useEquipes, useHoje } from "../../dados/seletores.js";
import { TIPOS, TIPO, ETAPAS, ROTULO_ETAPA, ROTULO_TURNO } from "../../dominio/tipos.js";
import { formatar, somarDias, mesDe } from "../../dominio/datas.js";
import { Selo } from "../../ui/base.jsx";
import { ICONE_TIPO } from "../agenda/CardServico.jsx";
import "./listas.css";

const POR_PAGINA = 40;
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Servicos() {
  const servicos = useServicos();
  const equipes = useEquipes();
  const { clientes, equipes: mapaEq } = useMapas();
  const hoje = useHoje();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState("");
  const [tipo, setTipo] = useState("");
  const [equipe, setEquipe] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [qtd, setQtd] = useState(POR_PAGINA);

  const lista = useMemo(() => {
    const q = semAcento(busca.trim());
    const mesAtual = mesDe(hoje);
    const [a, m] = hoje.split("-").map(Number);
    const mesAnterior = mesDe(`${m === 1 ? a - 1 : a}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}-01`);
    const dataRef = (s) => s.agendamento?.data || s.criadoEm;
    return servicos.filter((s) => {
      if (etapa && s.etapa !== etapa) return false;
      if (tipo && s.tipo !== tipo) return false;
      if (equipe && s.agendamento?.equipeId !== equipe) return false;
      if (periodo === "proximos" && !(s.agendamento && s.agendamento.data >= hoje && s.agendamento.data <= somarDias(hoje, 7))) return false;
      if (periodo === "mes" && mesDe(dataRef(s)) !== mesAtual) return false;
      if (periodo === "anterior" && mesDe(dataRef(s)) !== mesAnterior) return false;
      if (q && !semAcento(`${s.id} ${clientes[s.clienteId]?.nome} ${s.descricao}`).includes(q)) return false;
      return true;
    }).sort((x, y) => y.criadoEm.localeCompare(x.criadoEm) || y.id.localeCompare(x.id));
  }, [servicos, busca, etapa, tipo, equipe, periodo, clientes, hoje]);

  const limpar = () => { setBusca(""); setEtapa(""); setTipo(""); setEquipe(""); setPeriodo(""); };
  const filtrando = busca || etapa || tipo || equipe || periodo;

  return (
    <div className="lista-tela">
      <div className="topo-tela">
        <div><h1>Serviços</h1><p><span className="num">{lista.length}</span> de <span className="num">{servicos.length}</span> pedidos</p></div>
        <button type="button" className="btn btn-primario" onClick={() => navigate("/servicos/novo")}><Plus size={18} /> Novo serviço</button>
      </div>

      <div className="filtros" role="search">
        <label className="busca"><MagnifyingGlass size={18} aria-hidden="true" /><span className="sr-only">Buscar</span>
          <input type="search" placeholder="Código, cliente ou descrição" value={busca} onChange={(e) => { setBusca(e.target.value); setQtd(POR_PAGINA); }} />
        </label>
        <select aria-label="Etapa" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
          <option value="">Todas as etapas</option>{ETAPAS.map((x) => <option key={x} value={x}>{ROTULO_ETAPA[x]}</option>)}
        </select>
        <select aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos os tipos</option>{TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <select aria-label="Equipe" value={equipe} onChange={(e) => setEquipe(e.target.value)}>
          <option value="">Todas as equipes</option>{equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select aria-label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="">Qualquer data</option><option value="proximos">Próximos 7 dias</option><option value="mes">Este mês</option><option value="anterior">Mês anterior</option>
        </select>
        {filtrando && <button type="button" className="btn btn-fantasma" onClick={limpar}>Limpar filtros</button>}
      </div>

      {lista.length === 0 ? (
        <div className="vazio"><b>Nenhum serviço encontrado</b><p>Mude os filtros ou crie um novo serviço.</p></div>
      ) : (
        <div className="tabela" role="table" aria-label="Serviços">
          <div className="tabela-cab" role="row">
            <span role="columnheader">Serviço</span><span role="columnheader">Cliente</span><span role="columnheader">Etapa</span><span role="columnheader">Agenda</span><span role="columnheader">Prazo</span>
          </div>
          {lista.slice(0, qtd).map((s) => {
            const Icone = ICONE_TIPO[s.tipo];
            const a = s.agendamento;
            const atrasado = s.etapa !== "concluido" && s.prazo < hoje;
            return (
              <Link key={s.id} to={`/servicos/${s.id}`} className="tabela-linha" role="row">
                <span role="cell" className="t-servico"><Icone size={18} weight="duotone" aria-hidden="true" /><span><b className="num">{s.id}</b><small>{TIPO[s.tipo].nome}{s.prioridade === "urgente" && <em className="tag-urgente"> · Urgente</em>}</small></span></span>
                <span role="cell" className="t-cliente"><b>{clientes[s.clienteId]?.nome}</b><small>{s.descricao}</small></span>
                <span role="cell"><Selo etapa={s.etapa} /></span>
                <span role="cell" className="t-agenda">{a ? <><b>{mapaEq[a.equipeId]?.nome}</b><small>{formatar(a.data)} · {ROTULO_TURNO[a.turno]}</small></> : <small>Sem agendamento</small>}</span>
                <span role="cell" className={`num t-prazo${atrasado ? " atrasado" : ""}`}>{formatar(s.prazo, "curto")}</span>
              </Link>
            );
          })}
        </div>
      )}
      {qtd < lista.length && <button type="button" className="btn btn-secundario mais" onClick={() => setQtd(qtd + POR_PAGINA)}>Mostrar mais {Math.min(POR_PAGINA, lista.length - qtd)}</button>}
    </div>
  );
}
