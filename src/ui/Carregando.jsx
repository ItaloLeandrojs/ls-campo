// Logo com os tijolos sendo assentados: o "carregando" do LS Campo (estilos em styles/carregando.css).
import { TIJOLOS } from "./tijolos.js";

export function LogoTijolos({ className = "" }) {
  return (
    <svg className={`logo-tijolos ${className}`.trim()} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <rect className="fundo" width="256" height="256" rx="56" />
      {TIJOLOS.map(([x, y, w], i) => <rect key={i} className={`t t${i}`} x={x} y={y} width={w} height="40" rx="5" />)}
    </svg>
  );
}

/** Pedaço carregando no próprio lugar. rotulo é lido pelo leitor de tela; mostrarTexto exibe também na tela. */
export default function Carregando({ rotulo = "Carregando", tam = 44, mostrarTexto = false, className = "" }) {
  return (
    <div className={`carregando-logo ${className}`.trim()} role="status" style={{ "--tam": `${tam}px` }}>
      <LogoTijolos />
      <span className={mostrarTexto ? "" : "sr-only"}>{rotulo}</span>
    </div>
  );
}
