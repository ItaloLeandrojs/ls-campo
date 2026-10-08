import { useNavigate } from "react-router";
import { Desktop, DeviceMobile, ArrowsClockwise } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { navegar } from "../../app/vt.js";
import { base } from "../../ui/base.jsx";
import { BotaoTema, recomecarTudo } from "../../ui/controles.jsx";

export default function Entrada() {
  const navigate = useNavigate();
  const setPapel = useLoja((s) => s.setPapel);
  const equipeAtual = useLoja((s) => s.equipeAtual);

  const entrar = (papel) => {
    setPapel(papel);
    navegar(navigate, papel === "planejador" ? "/agenda" : equipeAtual ? "/equipe" : "/equipe/escolher");
  };

  return (
    <main className="entrada">
      <div className="entrada-miolo">
        <a className="entrada-marca" href={base} style={{ textDecoration: "none" }}>
          <img src={`${base}favicon.svg`} alt="" />
          LS Campo <small>· Arremate Serviços Prediais</small>
        </a>
        <h1>Como você quer ver a demonstração?</h1>
        <p className="sub">A Arremate é uma empresa fictícia de manutenção predial em Fortaleza. Escolha um papel; dá para trocar a qualquer momento.</p>
        <div className="papeis">
          <button type="button" className="papel" style={{ viewTransitionName: "papel-planejador" }} onClick={() => entrar("planejador")}>
            <span className="icone"><Desktop size={26} weight="duotone" /></span>
            <b>Sou planejador</b>
            <span>Cadastro os pedidos, monto a agenda das equipes e acompanho os indicadores.</span>
            <em>Melhor no computador</em>
          </button>
          <button type="button" className="papel" style={{ viewTransitionName: "papel-equipe" }} onClick={() => entrar("equipe")}>
            <span className="icone"><DeviceMobile size={26} weight="duotone" /></span>
            <b>Sou da equipe</b>
            <span>Vejo os serviços do dia, inicio e dou o retorno com checklist e fotos.</span>
            <em>Feito para o celular</em>
          </button>
        </div>
        <div className="entrada-rodape">
          <span>Os dados ficam salvos só neste navegador.</span>
          <button type="button" className="btn btn-fantasma" onClick={recomecarTudo}><ArrowsClockwise size={16} /> Recomeçar com os dados de exemplo</button>
          <BotaoTema />
        </div>
      </div>
    </main>
  );
}
