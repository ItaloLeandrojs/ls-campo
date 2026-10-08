import { useMemo } from "react";
import { useServicos, useEquipes, useHoje } from "../../dados/seletores.js";
import { diasDaSemana, inicioSemana, diaSemana, somarDias, mesDe } from "../../dominio/datas.js";
import { TIPO } from "../../dominio/tipos.js";
import { ICONE_TIPO } from "../agenda/CardServico.jsx";
import "../servicos/listas.css";

export default function Equipes() {
  const servicos = useServicos();
  const equipes = useEquipes();
  const hoje = useHoje();
  const dias = diasDaSemana(diaSemana(hoje) === 0 ? somarDias(hoje, 1) : inicioSemana(hoje));
  const dados = useMemo(() => equipes.map((eq) => {
    let turnos = 0;
    for (const s of servicos) if (s.agendamento?.equipeId === eq.id && dias.includes(s.agendamento.data)) turnos += s.agendamento.turno === "dia" ? 2 : 1;
    const concluidosMes = servicos.filter((s) => s.etapa === "concluido" && s.agendamento?.equipeId === eq.id && mesDe(s.retorno.concluidoEm) === mesDe(hoje)).length;
    const hojeN = servicos.filter((s) => s.agendamento?.equipeId === eq.id && s.agendamento.data === hoje).length;
    return { eq, pct: Math.round((turnos / 12) * 100), concluidosMes, hojeN };
  }), [equipes, servicos, dias, hoje]);

  return (
    <div className="lista-tela">
      <div className="topo-tela"><div><h1>Equipes</h1><p>Seis equipes de campo. Cada uma atende só os tipos da sua especialidade.</p></div></div>
      <div className="equipes-grade">
        {dados.map(({ eq, pct, concluidosMes, hojeN }) => (
          <article key={eq.id} className="cartao equipe-cartao">
            <header><b>{eq.nome}</b><span>Líder {eq.lider}</span></header>
            <ul className="esp-lista">
              {eq.especialidades.map((t) => { const I = ICONE_TIPO[t]; return <li key={t}><I size={16} weight="duotone" aria-hidden="true" />{TIPO[t].nome}</li>; })}
            </ul>
            <div className="equipe-ocup"><span>Ocupação da semana</span><div className="ocupacao"><span className="ocupacao-barra"><i style={{ transform: `scaleX(${Math.min(pct, 100) / 100})` }} /></span><span className="num">{pct}%</span></div></div>
            <dl className="equipe-nums">
              <div><dt>Serviços hoje</dt><dd className="num">{hojeN}</dd></div>
              <div><dt>Concluídos no mês</dt><dd className="num">{concluidosMes}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
