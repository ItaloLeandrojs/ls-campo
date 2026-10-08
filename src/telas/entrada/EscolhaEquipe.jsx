import { lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { TIPO } from "../../dominio/tipos.js";
import { navegar } from "../../app/vt.js";
import CrachaParado from "../cracha/CrachaParado.jsx";
import { podeCracha3D } from "../cracha/arte.js";
import "../cracha/cracha.css";

// O 3D (three, física, modelo) só é baixado aqui, depois da escolha.
const Cracha = lazy(() => import("../cracha/Cracha.jsx"));

function TelaCracha({ equipe, aoEntrar }) {
  const tresD = useMemo(() => podeCracha3D(), []);
  return (
    <main className="tela-cracha">
      <div className="tela-cracha-texto">
        <h1>Equipe {equipe.nome}</h1>
        <p>{tresD ? "Este é o crachá da equipe. Dá para puxar com o dedo." : "Este é o crachá da equipe."}</p>
        <button type="button" className="btn btn-primario btn-grande" onClick={aoEntrar}>Entrar <ArrowRight size={20} /></button>
      </div>
      {tresD ? (
        <Suspense fallback={<div className="cracha-palco carregando"><CrachaParado equipe={equipe} /></div>}>
          <Cracha equipe={equipe} />
        </Suspense>
      ) : <div className="cracha-palco"><CrachaParado equipe={equipe} /></div>}
    </main>
  );
}

export default function EscolhaEquipe() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const equipes = useLoja((s) => s.dados.equipes);
  const crachaVisto = useLoja((s) => s.crachaVisto);
  const setEquipe = useLoja((s) => s.setEquipe);
  const setPapel = useLoja((s) => s.setPapel);
  const marcarCracha = useLoja((s) => s.marcarCracha);
  const mostrar = equipes.find((e) => e.id === params.get("cracha"));

  const escolher = (id) => {
    setEquipe(id);
    setPapel("equipe");
    if (crachaVisto[id]) navegar(navigate, "/equipe");
    else navigate(`/equipe/escolher?cracha=${id}`);
  };

  if (mostrar) {
    return <TelaCracha equipe={mostrar} aoEntrar={() => { marcarCracha(mostrar.id); navegar(navigate, "/equipe"); }} />;
  }

  return (
    <main className="entrada" style={{ viewTransitionName: "papel-equipe" }}>
      <div className="entrada-miolo">
        <button type="button" className="btn btn-fantasma" onClick={() => navegar(navigate, "/")}><ArrowLeft size={18} /> Voltar</button>
        <h1>Qual é a sua equipe?</h1>
        <p className="sub">Cada equipe vê só os próprios serviços. Dá para trocar depois.</p>
        <div className="equipes-escolha">
          {equipes.map((e) => (
            <button key={e.id} type="button" className="equipe-opcao" onClick={() => escolher(e.id)}>
              <b>{e.nome}</b>
              <span>Líder {e.lider}</span>
              <span>{e.especialidades.map((t) => TIPO[t].nome).join(" · ")}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
