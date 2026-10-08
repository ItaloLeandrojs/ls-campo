import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { useServicos, useHoje } from "../../dados/seletores.js";
import CardServico from "../agenda/CardServico.jsx";
import { TIPO_CLIENTE, prazoDoCliente } from "./Clientes.jsx";
import "../servicos/listas.css";

export default function FichaCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hoje = useHoje();
  const cliente = useLoja((s) => s.dados.clientes.find((c) => c.id === id));
  const servicos = useServicos();
  if (!cliente) return <div className="vazio"><b>Cliente não encontrado</b></div>;
  const deles = servicos.filter((s) => s.clienteId === id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const abertos = deles.filter((s) => s.etapa !== "concluido");
  const prazo = prazoDoCliente(servicos, id);

  return (
    <div className="form-tela larga">
      <button type="button" className="btn btn-fantasma" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Voltar</button>
      <div className="topo-tela"><div><h1>{cliente.nome}</h1><p>{TIPO_CLIENTE[cliente.tipo]} · {cliente.endereco} · {cliente.bairro}</p></div></div>
      <div className="numeros">
        <div className="cartao"><span>Contato</span><b>{cliente.contato}</b><small className="num">{cliente.telefone}</small></div>
        <div className="cartao"><span>Serviços pedidos</span><b className="num">{deles.length}</b><small>{abertos.length} em aberto</small></div>
        <div className="cartao"><span>Concluídos no prazo</span><b className="num">{prazo === null ? "Sem histórico" : `${prazo}%`}</b><small>de todos os concluídos</small></div>
      </div>
      <h2 className="sec-titulo">Serviços</h2>
      <div className="cards-grade">
        {deles.slice(0, 24).map((s) => (
          <CardServico key={s.id} servico={s} cliente={cliente} hoje={hoje} role="link" tabIndex={0} onClick={() => navigate(`/servicos/${s.id}`)} onKeyDown={(e) => { if (e.key === "Enter") navigate(`/servicos/${s.id}`); }} />
        ))}
      </div>
      {deles.length > 24 && <p className="vazio-curto">Mostrando os 24 mais recentes de {deles.length}.</p>}
    </div>
  );
}
