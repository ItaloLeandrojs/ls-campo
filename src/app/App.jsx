import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { CalendarDots, ClipboardText, Buildings, UsersThree, ChartBar, ArrowsClockwise, HardHat, List, X, ListChecks, House, IdentificationBadge } from "@phosphor-icons/react";
import "../styles/app.css";
import { useLoja } from "../dados/loja.js";
import { BotaoTema, recomecarTudo } from "../ui/controles.jsx";
import { navegar } from "./vt.js";
import { base } from "../ui/base.jsx";
import Entrada from "../telas/entrada/Entrada.jsx";
import EscolhaEquipe from "../telas/entrada/EscolhaEquipe.jsx";
import Agenda from "../telas/agenda/Agenda.jsx";
import Servicos from "../telas/servicos/Servicos.jsx";
import NovoServico from "../telas/servicos/NovoServico.jsx";
import FichaServicoPagina from "../telas/servicos/FichaServicoPagina.jsx";
import Clientes from "../telas/clientes/Clientes.jsx";
import FichaCliente from "../telas/clientes/FichaCliente.jsx";
import Equipes from "../telas/equipes/Equipes.jsx";
import Indicadores from "../telas/indicadores/Indicadores.jsx";
import Hoje from "../telas/equipe/Hoje.jsx";
import Retorno from "../telas/equipe/Retorno.jsx";
import Feitos from "../telas/equipe/Feitos.jsx";

function Tema() {
  const tema = useLoja((s) => s.tema);
  useEffect(() => {
    if (tema === "escuro") document.documentElement.dataset.tema = "escuro";
    else delete document.documentElement.dataset.tema;
    try { localStorage.setItem("ls-campo:tema", tema); } catch {}
  }, [tema]);
  return null;
}

function AvisoArmazenamento() {
  const aviso = useLoja((s) => s.avisoArmazenamento);
  if (!aviso) return null;
  return <div className="aviso aviso-armazenamento" role="status">Não foi possível salvar neste navegador. A demonstração funciona, mas as mudanças somem ao fechar a página.</div>;
}


const MENU = [
  ["/agenda", "Agenda", CalendarDots],
  ["/servicos", "Serviços", ClipboardText],
  ["/clientes", "Clientes", Buildings],
  ["/equipes", "Equipes", UsersThree],
  ["/indicadores", "Indicadores", ChartBar],
];

function LayoutPlanejador() {
  const papel = useLoja((s) => s.papel);
  const setPapel = useLoja((s) => s.setPapel);
  const navigate = useNavigate();
  const local = useLocation();
  const [aberta, setAberta] = useState(false);
  useEffect(() => { if (papel !== "planejador") setPapel("planejador"); }, [papel, setPapel]);
  useEffect(() => setAberta(false), [local.pathname]);

  return (
    <div className="planejador" style={{ viewTransitionName: "papel-planejador" }}>
      <div className="barra-movel">
        <button type="button" className="btn btn-fantasma btn-icone" aria-label="Abrir menu" onClick={() => setAberta(true)}><List size={22} /></button>
        <b>LS Campo</b>
      </div>
      {aberta && <div className="veu" onClick={() => setAberta(false)} />}
      <aside className={`lateral${aberta ? " aberta" : ""}`} aria-label="Menu do planejador">
        <a className="lateral-marca" href={`${base}`}>
          <img src={`${base}favicon.svg`} alt="" />
          <span><b>LS Campo</b><small>Arremate Serviços Prediais</small></span>
        </a>
        {aberta && <button type="button" className="btn btn-fantasma btn-icone" style={{ position: "absolute", top: 14, right: 10 }} aria-label="Fechar menu" onClick={() => setAberta(false)}><X size={20} /></button>}
        <nav className="menu">
          {MENU.map(([to, nome, Icone]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "ativo" : "")}><Icone size={20} weight="duotone" />{nome}</NavLink>
          ))}
        </nav>
        <div className="lateral-pe">
          <button type="button" className="btn btn-fantasma" onClick={() => navegar(navigate, "/equipe")}><HardHat size={18} /> Ver como equipe</button>
          <BotaoTema />
          <button type="button" className="btn btn-fantasma" onClick={recomecarTudo}><ArrowsClockwise size={18} /> Recomeçar dados</button>
          <p className="demo-nota">Demonstração com empresa e dados fictícios. Tudo fica salvo só neste navegador.</p>
        </div>
      </aside>
      <main className="conteudo" id="conteudo">
        <Outlet />
      </main>
    </div>
  );
}

function LayoutEquipe() {
  const equipeAtual = useLoja((s) => s.equipeAtual);
  const equipes = useLoja((s) => s.dados.equipes);
  const papel = useLoja((s) => s.papel);
  const setPapel = useLoja((s) => s.setPapel);
  const navigate = useNavigate();
  useEffect(() => { if (papel !== "equipe") setPapel("equipe"); }, [papel, setPapel]);
  const eq = equipes.find((e) => e.id === equipeAtual);
  if (!eq) return <Navigate to="/equipe/escolher" replace />;

  return (
    <div className="app-equipe" style={{ viewTransitionName: "papel-equipe" }}>
      <header className="equipe-topo">
        <span className="quem"><b>Equipe {eq.nome}</b><small>Líder {eq.lider}</small></span>
        <button type="button" className="btn btn-fantasma btn-icone" aria-label="Ver crachá" onClick={() => navigate(`/equipe/escolher?cracha=${eq.id}`)}><IdentificationBadge size={22} /></button>
        <button type="button" className="btn btn-secundario" onClick={() => navegar(navigate, "/agenda")}>Planejador</button>
      </header>
      <main className="equipe-conteudo" id="conteudo"><Outlet /></main>
      <nav className="abas" aria-label="Navegação da equipe">
        <NavLink to="/equipe" end className={({ isActive }) => (isActive ? "ativo" : "")}><House size={24} weight="duotone" />Hoje</NavLink>
        <NavLink to="/equipe/feitos" className={({ isActive }) => (isActive ? "ativo" : "")}><ListChecks size={24} weight="duotone" />Feitos</NavLink>
      </nav>
    </div>
  );
}

/** Recalcula "hoje" quando a pessoa volta para a aba (ex.: deixou aberto e passou da meia-noite). */
function useVirada() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const f = () => { if (document.visibilityState === "visible") setTick((t) => t + 1); };
    window.addEventListener("focus", f);
    document.addEventListener("visibilitychange", f);
    return () => { window.removeEventListener("focus", f); document.removeEventListener("visibilitychange", f); };
  }, []);
}

export default function App() {
  useVirada();
  return (
    <HashRouter>
      <Tema />
      <AvisoArmazenamento />
      <Routes>
        <Route path="/" element={<Entrada />} />
        <Route path="/equipe/escolher" element={<EscolhaEquipe />} />
        <Route element={<LayoutPlanejador />}>
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/servicos/novo" element={<NovoServico />} />
          <Route path="/servicos/:id" element={<FichaServicoPagina />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<FichaCliente />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/indicadores" element={<Indicadores />} />
        </Route>
        <Route element={<LayoutEquipe />}>
          <Route path="/equipe" element={<Hoje />} />
          <Route path="/equipe/servico/:id" element={<Retorno />} />
          <Route path="/equipe/feitos" element={<Feitos />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
