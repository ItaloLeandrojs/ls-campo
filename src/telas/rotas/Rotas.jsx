// Planejador: rota de cada equipe no dia escolhido, saindo e voltando pela sede.
import { useMemo, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useServicos, useEquipes, useHoje } from "../../dados/seletores.js";
import { rotaDoDia, textoKm } from "../../dominio/rotas.js";
import { diasDaSemana, inicioSemana, somarDias, formatar, diaSemana } from "../../dominio/datas.js";
import geo from "../../dados/geo-pontos.json";
import RotaDia from "./RotaDia.jsx";
import "../agenda/agenda.css";
import "./rotas.css";

export default function Rotas() {
  const hoje = useHoje();
  const servicos = useServicos();
  const equipes = useEquipes();
  const util = diaSemana(hoje) === 0 ? somarDias(hoje, 1) : hoje;
  const [semana, setSemana] = useState(inicioSemana(util));
  const [dia, setDia] = useState(util);
  const [escolhida, setEscolhida] = useState(null);
  const dias = diasDaSemana(semana);

  const resumo = useMemo(() => equipes.map((eq) => {
    const r = rotaDoDia({ servicos, equipeId: eq.id, data: dia, geo });
    return { eq, visitas: Math.max(r.paradas.length - 2, 0), km: r.totalKm };
  }), [equipes, servicos, dia]);
  const comVisita = resumo.filter((r) => r.visitas > 0);
  const atual = resumo.find((r) => r.eq.id === escolhida && r.visitas > 0) ?? comVisita[0];
  const totalKm = Math.round(comVisita.reduce((a, r) => a + r.km, 0) * 10) / 10;

  const trocarSemana = (n) => { const s = somarDias(semana, n); setSemana(s); setDia(s); };

  return (
    <div className="rotas-tela">
      <div className="topo-tela">
        <div>
          <h1>Rotas das equipes</h1>
          <p>Cada equipe sai da sede, em {geo.sede.bairro}, faz as visitas na ordem dos turnos e volta. {comVisita.length > 0 && <>Neste dia: <b>{textoKm(totalKm)}</b> no total.</>}</p>
        </div>
      </div>
      <div className="rotas-controles">
        <div className="nav-semana">
          <button type="button" className="btn btn-secundario btn-icone" aria-label="Semana anterior" onClick={() => trocarSemana(-7)}><CaretLeft size={18} /></button>
          <button type="button" className="btn btn-secundario" onClick={() => { setSemana(inicioSemana(util)); setDia(util); }}>Hoje</button>
          <button type="button" className="btn btn-secundario btn-icone" aria-label="Próxima semana" onClick={() => trocarSemana(7)}><CaretRight size={18} /></button>
        </div>
        <div className="dias-chips" role="tablist" aria-label="Dia">
          {dias.map((d) => (
            <button key={d} type="button" role="tab" aria-selected={d === dia} className={`chip-dia${d === dia ? " ativo" : ""}${d === hoje ? " hoje" : ""}`} onClick={() => setDia(d)}>
              <b>{formatar(d).split(",")[0]}</b><span className="num">{formatar(d, "curto")}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rotas-equipes" aria-label="Equipes">
        {resumo.map(({ eq, visitas, km }) => (
          <button key={eq.id} type="button" className="rota-equipe" aria-pressed={atual?.eq.id === eq.id} disabled={!visitas} onClick={() => setEscolhida(eq.id)}>
            <b>{eq.nome}</b>
            <span>{visitas ? `${visitas} ${visitas === 1 ? "visita" : "visitas"} · ${textoKm(km)}` : "Sem visitas"}</span>
          </button>
        ))}
      </div>
      {atual ? (
        <RotaDia key={`${atual.eq.id}-${dia}`} equipe={atual.eq} data={dia} />
      ) : (
        <p className="vazio-curto rota-vazia">Nenhuma equipe tem visita em {formatar(dia)}. Agende serviços na Agenda para ver as rotas.</p>
      )}
    </div>
  );
}
