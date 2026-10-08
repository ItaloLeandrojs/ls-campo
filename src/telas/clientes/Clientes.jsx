import { useMemo, useState } from "react";
import { Link } from "react-router";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { useServicos } from "../../dados/seletores.js";
import "../servicos/listas.css";

export const TIPO_CLIENTE = { condominio: "Condomínio", loja: "Loja", escritorio: "Escritório", clinica: "Clínica" };
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** % no prazo de todos os serviços concluídos de um cliente (null sem concluídos). */
export function prazoDoCliente(servicos, clienteId) {
  const c = servicos.filter((s) => s.clienteId === clienteId && s.etapa === "concluido");
  if (!c.length) return null;
  return Math.round((c.filter((s) => s.retorno.concluidoEm.slice(0, 10) <= s.prazo).length / c.length) * 100);
}

export default function Clientes() {
  const clientes = useLoja((s) => s.dados.clientes);
  const servicos = useServicos();
  const [busca, setBusca] = useState("");
  const linhas = useMemo(() => {
    const q = semAcento(busca.trim());
    return clientes
      .filter((c) => !q || semAcento(`${c.nome} ${c.bairro} ${c.contato}`).includes(q))
      .map((c) => ({ c, n: servicos.filter((s) => s.clienteId === c.id).length, prazo: prazoDoCliente(servicos, c.id) }))
      .sort((a, b) => b.n - a.n || a.c.nome.localeCompare(b.c.nome));
  }, [clientes, servicos, busca]);

  return (
    <div className="lista-tela">
      <div className="topo-tela"><div><h1>Clientes</h1><p><span className="num">{clientes.length}</span> clientes atendidos pela Arremate</p></div></div>
      <div className="filtros" role="search">
        <label className="busca"><MagnifyingGlass size={18} aria-hidden="true" /><span className="sr-only">Buscar cliente</span>
          <input type="search" placeholder="Nome, bairro ou contato" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>
      {linhas.length === 0 ? <div className="vazio"><b>Nenhum cliente encontrado</b><p>Tente outro nome ou bairro.</p></div> : (
        <div className="tabela tabela-clientes" role="table" aria-label="Clientes">
          <div className="tabela-cab" role="row"><span role="columnheader">Cliente</span><span role="columnheader">Contato</span><span role="columnheader">Serviços</span><span role="columnheader">No prazo</span></div>
          {linhas.map(({ c, n, prazo }) => (
            <Link key={c.id} to={`/clientes/${c.id}`} className="tabela-linha" role="row">
              <span role="cell" className="t-cliente"><b>{c.nome}</b><small>{TIPO_CLIENTE[c.tipo]} · {c.bairro}</small></span>
              <span role="cell" className="t-cliente"><b>{c.contato}</b><small className="num">{c.telefone}</small></span>
              <span role="cell" className="num">{n}</span>
              <span role="cell" className="num">{prazo === null ? "Sem histórico" : `${prazo}%`}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
