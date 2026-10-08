// Crachá em HTML, sem 3D: para "reduzir movimento", aparelho fraco, economia de dados ou sem WebGL.
import { TIPO } from "../../dominio/tipos.js";

export default function CrachaParado({ equipe }) {
  return (
    <div className="cracha-parado" role="img" aria-label={`Crachá da equipe ${equipe.nome}, líder ${equipe.lider}`}>
      <span className="cracha-presilha" aria-hidden="true" />
      <div className="cracha-cartao">
        <div className="cracha-faixa"><b>ARREMATE</b><span>Serviços Prediais</span></div>
        <div className="cracha-corpo">
          <b>{equipe.nome}</b>
          <span>Líder {equipe.lider}</span>
          <ul>{equipe.especialidades.map((t) => <li key={t}>{TIPO[t].nome}</li>)}</ul>
        </div>
        <small className="num">LS CAMPO · DEMONSTRAÇÃO</small>
      </div>
    </div>
  );
}
