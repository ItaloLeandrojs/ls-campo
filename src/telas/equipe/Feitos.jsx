import { Link } from "react-router";
import { useLoja } from "../../dados/loja.js";
import { useMapas, useServicos } from "../../dados/seletores.js";
import { reservas } from "../../dominio/indicadores.js";
import { TIPO, MOTIVO } from "../../dominio/tipos.js";
import { formatar } from "../../dominio/datas.js";
import "./equipe.css";

export default function Feitos() {
  const servicos = useServicos();
  const equipeAtual = useLoja((s) => s.equipeAtual);
  const { clientes } = useMapas();
  const itens = [];
  for (const s of servicos) {
    if (s.etapa === "concluido" && s.agendamento?.equipeId === equipeAtual) itens.push({ s, quando: s.retorno.concluidoEm, tipo: "concluido" });
    for (const r of reservas(s)) if (r.reagendado && r.equipeId === equipeAtual) itens.push({ s, quando: r.em, tipo: "reagendado", motivo: r.motivo });
  }
  itens.sort((a, b) => b.quando.localeCompare(a.quando));

  return (
    <div>
      <h1 className="equipe-h1">Feitos</h1>
      {itens.length === 0 && <div className="vazio"><b>Nada por aqui ainda</b><p>Os serviços concluídos e reagendados pela equipe aparecem aqui.</p></div>}
      <ol className="feitos">
        {itens.slice(0, 30).map(({ s, quando, tipo, motivo }) => (
          <li key={`${s.id}-${quando}`}>
            <Link to={`/equipe/servico/${s.id}`}>
              <span className="num feito-data">{formatar(quando.slice(0, 10), "curto")}</span>
              <span className="feito-txt"><b>{clientes[s.clienteId]?.nome}</b><small>{TIPO[s.tipo].nome} · {s.id}</small></span>
              <span className={`selo selo-${tipo === "concluido" ? "concluido" : "reagendar"}`}>{tipo === "concluido" ? "Concluído" : `Reagendado: ${MOTIVO[motivo]?.nome.toLowerCase()}`}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
