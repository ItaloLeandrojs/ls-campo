import { useNavigate } from "react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { TIPO } from "../../dominio/tipos.js";
import { navegar } from "../../app/vt.js";

export default function EscolhaEquipe() {
  const navigate = useNavigate();
  const equipes = useLoja((s) => s.dados.equipes);
  const setEquipe = useLoja((s) => s.setEquipe);
  const setPapel = useLoja((s) => s.setPapel);

  const escolher = (id) => {
    setEquipe(id);
    setPapel("equipe");
    navegar(navigate, "/equipe");
  };

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
