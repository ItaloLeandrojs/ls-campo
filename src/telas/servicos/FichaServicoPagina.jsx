import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { useServicos } from "../../dados/seletores.js";
import FichaServico from "../../ui/FichaServico.jsx";
import DialogoAgendar from "../agenda/DialogoAgendar.jsx";
import "./listas.css";

export default function FichaServicoPagina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const local = useLocation();
  const servico = useServicos().find((s) => s.id === id);
  const [agendando, setAgendando] = useState(null);
  const [msg, setMsg] = useState(local.state?.criado ? "Serviço criado. Ele já está na lista A agendar." : "");

  if (!servico) return <div className="vazio"><b>Serviço não encontrado</b><p>Ele pode ter sido apagado ao recomeçar os dados.</p></div>;
  return (
    <div className="form-tela">
      <button type="button" className="btn btn-fantasma" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Voltar</button>
      <div className="topo-tela"><div><h1>Serviço <span className="num">{servico.id}</span></h1></div></div>
      {msg && <p className="aviso-ok" role="status">{msg}</p>}
      <div className="cartao ficha-pagina">
        <FichaServico servico={servico} aoAgendar={(s) => { setMsg(""); setAgendando(s); }} />
      </div>
      <DialogoAgendar servico={agendando} aoFechar={() => setAgendando(null)} aoAgendar={(sid, r) => setMsg(`${sid} agendado.${r.aviso ? ` ${r.aviso}` : ""}`)} />
    </div>
  );
}
