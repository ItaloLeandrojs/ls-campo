import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, pointerWithin } from "@dnd-kit/core";
import { motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useLoja } from "../../dados/loja.js";
import { useMapas, useServicos, useEquipes, useHoje } from "../../dados/seletores.js";
import { podeAgendar, ocupados } from "../../dominio/regras.js";
import { diasDaSemana, inicioSemana, somarDias, formatar, diaSemana, ehPassado } from "../../dominio/datas.js";
import { TIPOS, TIPO, ROTULO_TURNO, ESTADOS_ABERTOS } from "../../dominio/tipos.js";
import CardServico, { ICONE_TIPO } from "./CardServico.jsx";
import DialogoAgendar from "./DialogoAgendar.jsx";
import FichaServico from "../../ui/FichaServico.jsx";
import Gaveta from "../../ui/Gaveta.jsx";
import "./agenda.css";

const MOLA = { type: "spring", duration: 0.4, bounce: 0.2 };

function useLarga() {
  const q = "(min-width: 1024px)";
  const [larga, setLarga] = useState(() => matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => setLarga(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return larga;
}

function Arrastavel({ servico, cliente, hoje, compacto, recem, treme, aoAbrir, bloqueado }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: servico.id, disabled: bloqueado });
  const reduz = useReducedMotion();
  const card = (
    <CardServico
      ref={setNodeRef} servico={servico} cliente={cliente} hoje={hoje} compacto={compacto} mostrarEtapa={!compacto || servico.etapa !== "agendado"}
      className={`${isDragging ? "arrastando" : ""}${treme ? " treme" : ""}${bloqueado ? " fixo" : " arrastavel"}${compacto && servico.duracao === "dia" ? " ocupa-dia" : ""}`}
      {...(bloqueado ? {} : listeners)} {...(bloqueado ? {} : attributes)}
      role="button" tabIndex={0} aria-label={`${servico.id}, ${cliente?.nome}, ${TIPO[servico.tipo].nome}. Abrir ficha`}
      onClick={() => aoAbrir(servico)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aoAbrir(servico); } }}
    />
  );
  if (recem && !reduz) {
    return <motion.div className={compacto && servico.duracao === "dia" ? "mola ocupa-dia-mola" : "mola"} initial={{ scale: 0.94, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={MOLA}>{card}</motion.div>;
  }
  return card;
}

function Vaga({ equipe, data, turno, ativo, servicos, hoje, children }) {
  const passado = ehPassado(data, hoje);
  const { setNodeRef, isOver } = useDroppable({ id: `vaga|${equipe.id}|${data}|${turno}`, data: { equipeId: equipe.id, data, turno }, disabled: passado });
  let estado = "";
  if (ativo && !passado) {
    const r = podeAgendar({ servico: ativo, equipe, data, turno, servicos, hoje });
    estado = r.ok ? (r.aviso ? " aceita-aviso" : " aceita") : " recusa";
  }
  return (
    <div ref={setNodeRef} className={`vaga${passado ? " passada" : ""}${estado}${isOver ? " sobre" : ""}`} data-turno={turno} aria-label={`${equipe.nome}, ${formatar(data)}, ${ROTULO_TURNO[turno]}`}>
      {children}
    </div>
  );
}

function ListaAgendar({ abertos, clientes, hoje, filtro, setFiltro, ativo, aoAbrir, recem, treme }) {
  const { setNodeRef, isOver } = useDroppable({ id: "lista" });
  return (
    <aside ref={setNodeRef} className={`a-agendar${isOver && ativo?.agendamento ? " sobre" : ""}`} aria-label="Serviços a agendar">
      <div className="a-agendar-cab">
        <h2>A agendar <span className="num">{abertos.length}</span></h2>
        <select aria-label="Filtrar por tipo" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>
      {ativo?.agendamento && <p className="solte-aqui">Solte aqui para tirar da agenda</p>}
      <div className="a-agendar-lista">
        {abertos.length === 0 && <p className="vazio-curto">Nada a agendar{filtro ? " deste tipo" : ""}. Novos pedidos entram em Serviços.</p>}
        {abertos.map((s) => (
          <Arrastavel key={s.id} servico={s} cliente={clientes[s.clienteId]} hoje={hoje} aoAbrir={aoAbrir} recem={recem === s.id} treme={treme === s.id} />
        ))}
      </div>
    </aside>
  );
}

export default function Agenda() {
  const hoje = useHoje();
  const servicos = useServicos();
  const equipes = useEquipes();
  const { clientes, equipes: mapaEq } = useMapas();
  const agendar = useLoja((s) => s.agendar);
  const desagendar = useLoja((s) => s.desagendar);
  const navigate = useNavigate();
  const larga = useLarga();
  const reduz = useReducedMotion();

  const inicial = diaSemana(hoje) === 0 ? somarDias(hoje, 1) : inicioSemana(hoje);
  const [semana, setSemana] = useState(inicial);
  const [filtro, setFiltro] = useState("");
  const [ativoId, setAtivoId] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [agendando, setAgendando] = useState(null);
  const [recem, setRecem] = useState(null);
  const [treme, setTreme] = useState(null);
  const [msg, setMsg] = useState(null);
  const [diaMovel, setDiaMovel] = useState(hoje);
  const tempo = useRef();

  const dias = diasDaSemana(semana);
  const porId = useMemo(() => Object.fromEntries(servicos.map((s) => [s.id, s])), [servicos]);
  const ativo = ativoId ? porId[ativoId] : null;
  const abertos = useMemo(() => servicos
    .filter((s) => ESTADOS_ABERTOS.includes(s.etapa) && (!filtro || s.tipo === filtro))
    .sort((a, b) => (a.prioridade === "urgente" ? 0 : 1) - (b.prioridade === "urgente" ? 0 : 1) || a.prazo.localeCompare(b.prazo)), [servicos, filtro]);
  const daSemana = useMemo(() => servicos.filter((s) => s.agendamento && s.agendamento.data >= dias[0] && s.agendamento.data <= dias[5]), [servicos, dias]);

  const avisar = (m) => { setMsg(m); clearTimeout(tempo.current); tempo.current = setTimeout(() => setMsg(null), 6000); };
  const ocupacaoEquipe = (eqId) => {
    let n = 0;
    for (const s of daSemana) if (s.agendamento.equipeId === eqId) n += s.agendamento.turno === "dia" ? 2 : 1;
    return Math.round((n / 12) * 100);
  };
  const totalOcup = Math.round((daSemana.reduce((a, s) => a + (s.agendamento.turno === "dia" ? 2 : 1), 0) / (equipes.length * 12)) * 100);

  const sensores = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }));

  const aoSoltar = ({ active, over }) => {
    setAtivoId(null);
    const s = porId[active.id];
    if (!over || !s) return;
    if (over.id === "lista") {
      if (s.etapa !== "agendado") return;
      const r = desagendar(s.id);
      avisar(r.ok ? { tipo: "ok", texto: `${s.id} voltou para A agendar.` } : { tipo: "erro", texto: r.motivo });
      return;
    }
    const { equipeId, data, turno } = over.data.current;
    if (s.agendamento && s.agendamento.equipeId === equipeId && s.agendamento.data === data && (s.agendamento.turno === turno || s.agendamento.turno === "dia")) return;
    const r = agendar(s.id, { equipeId, data, turno });
    if (!r.ok) {
      setTreme(s.id); setTimeout(() => setTreme(null), 400);
      avisar({ tipo: "erro", texto: r.motivo });
      return;
    }
    setRecem(s.id); setTimeout(() => setRecem(null), 700);
    const quando = `${mapaEq[equipeId].nome}, ${formatar(data)}, ${s.duracao === "dia" ? "dia inteiro" : ROTULO_TURNO[turno].toLowerCase()}`;
    avisar({ tipo: r.aviso ? "aviso" : "ok", texto: `${s.id} agendado: ${quando}.${r.aviso ? ` ${r.aviso}` : ""}` });
  };

  const aposDialogo = (id, r) => avisar({ tipo: r.aviso ? "aviso" : "ok", texto: `${id} agendado.${r.aviso ? ` ${r.aviso}` : ""}` });

  const resumo = (
    <div className="agenda-resumo">
      <span><b className="num">{daSemana.filter((s) => s.etapa !== "concluido").length}</b> agendados na semana</span>
      <span><b className="num">{abertos.length}</b> a agendar</span>
      <span><b className="num">{totalOcup}%</b> de ocupação</span>
    </div>
  );

  const navSemana = (
    <div className="nav-semana">
      <button type="button" className="btn btn-secundario btn-icone" aria-label="Semana anterior" onClick={() => setSemana(somarDias(semana, -7))}><CaretLeft size={18} /></button>
      <button type="button" className="btn btn-secundario" onClick={() => { setSemana(inicial); setDiaMovel(hoje); }}>Hoje</button>
      <button type="button" className="btn btn-secundario btn-icone" aria-label="Próxima semana" onClick={() => setSemana(somarDias(semana, 7))}><CaretRight size={18} /></button>
      <span className="semana-rotulo">{formatar(dias[0], "curto")} a {formatar(dias[5], "curto")}</span>
    </div>
  );

  return (
    <div className="agenda">
      <div className="topo-tela">
        <div><h1>Agenda das equipes</h1>{resumo}</div>
        <div className="topo-acoes">
          {navSemana}
          <button type="button" className="btn btn-primario" onClick={() => navigate("/servicos/novo")}><Plus size={18} /> Novo serviço</button>
        </div>
      </div>
      <div className={`agenda-msg${msg ? ` ${msg.tipo}` : ""}`} role="status" aria-live="polite">{msg?.texto}</div>

      <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragStart={({ active }) => setAtivoId(active.id)} onDragCancel={() => setAtivoId(null)} onDragEnd={aoSoltar}>
        <div className={`agenda-corpo${larga ? "" : " estreita"}`}>
          <ListaAgendar abertos={abertos} clientes={clientes} hoje={hoje} filtro={filtro} setFiltro={setFiltro} ativo={ativo} aoAbrir={setAberto} recem={recem} treme={treme} />

          {larga ? (
            <div className="grade-rolagem">
              <div className="grade" role="grid" aria-label="Agenda da semana por equipe">
                <div className="grade-canto" />
                {dias.map((d) => (
                  <div key={d} className={`grade-dia${d === hoje ? " hoje" : ""}${ehPassado(d, hoje) ? " passado" : ""}`} role="columnheader">
                    <b>{formatar(d).split(",")[0]}</b><span className="num">{formatar(d, "curto")}</span>
                  </div>
                ))}
                {equipes.map((eq) => {
                  const pct = ocupacaoEquipe(eq.id);
                  return [
                    <div key={`${eq.id}-n`} className="grade-equipe" role="rowheader">
                      <b>{eq.nome}</b>
                      <span className="grade-lider">{eq.lider}</span>
                      <span className="grade-esp">{eq.especialidades.map((t) => { const I = ICONE_TIPO[t]; return <I key={t} size={15} weight="duotone" aria-label={TIPO[t].nome} />; })}</span>
                      <span className="ocupacao" aria-label={`Ocupação da semana ${pct}%`}><span className="ocupacao-barra"><i style={{ transform: `scaleX(${Math.min(pct, 100) / 100})` }} /></span><span className="num">{pct}%</span></span>
                    </div>,
                    ...dias.map((d) => {
                      const o = ocupados(daSemana, eq.id, d);
                      const sm = o.manha ? porId[o.manha] : null;
                      const st = o.tarde ? porId[o.tarde] : null;
                      const bloqueado = (s) => !s || ["concluido", "execucao"].includes(s.etapa) || ehPassado(d, hoje);
                      return (
                        <div key={`${eq.id}-${d}`} className={`grade-celula${d === hoje ? " hoje" : ""}`} role="gridcell">
                          <Vaga equipe={eq} data={d} turno="manha" ativo={ativo} servicos={servicos} hoje={hoje}>
                            {sm && <Arrastavel servico={sm} cliente={clientes[sm.clienteId]} hoje={hoje} compacto aoAbrir={setAberto} recem={recem === sm.id} treme={treme === sm.id} bloqueado={bloqueado(sm)} />}
                          </Vaga>
                          <Vaga equipe={eq} data={d} turno="tarde" ativo={ativo} servicos={servicos} hoje={hoje}>
                            {st && st !== sm && <Arrastavel servico={st} cliente={clientes[st.clienteId]} hoje={hoje} compacto aoAbrir={setAberto} recem={recem === st.id} treme={treme === st.id} bloqueado={bloqueado(st)} />}
                          </Vaga>
                        </div>
                      );
                    }),
                  ];
                })}
              </div>
            </div>
          ) : (
            <div className="lista-dia">
              <div className="dias-chips" role="tablist" aria-label="Dia">
                {dias.map((d) => (
                  <button key={d} type="button" role="tab" aria-selected={d === diaMovel} className={`chip-dia${d === diaMovel ? " ativo" : ""}${d === hoje ? " hoje" : ""}`} onClick={() => setDiaMovel(d)}>
                    <b>{formatar(d).split(",")[0]}</b><span className="num">{formatar(d, "curto")}</span>
                  </button>
                ))}
              </div>
              {!dias.includes(diaMovel) && <p className="vazio-curto">Escolha um dia da semana acima.</p>}
              {dias.includes(diaMovel) && equipes.map((eq) => {
                const o = ocupados(daSemana, eq.id, diaMovel);
                const itens = [...new Set([o.manha, o.tarde].filter(Boolean))].map((id) => porId[id]);
                return (
                  <section key={eq.id} className="dia-equipe">
                    <h3>{eq.nome} <span>{eq.lider}</span></h3>
                    {itens.length === 0 && <p className="vazio-curto">Livre {ehPassado(diaMovel, hoje) ? "neste dia" : "o dia todo"}.</p>}
                    {itens.map((s) => (
                      <div key={s.id} className="dia-item">
                        <span className="dia-turno">{ROTULO_TURNO[s.agendamento.turno]}</span>
                        <CardServico servico={s} cliente={clientes[s.clienteId]} hoje={hoje} role="button" tabIndex={0} onClick={() => setAberto(s)} onKeyDown={(e) => { if (e.key === "Enter") setAberto(s); }} />
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          )}
        </div>
        <DragOverlay dropAnimation={reduz ? null : { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }}>
          {ativo ? <CardServico servico={ativo} cliente={clientes[ativo.clienteId]} hoje={hoje} compacto className="no-ar" /> : null}
        </DragOverlay>
      </DndContext>

      <Gaveta aberto={!!aberto && !agendando} aoFechar={() => setAberto(null)} titulo={aberto ? `Serviço ${aberto.id}` : ""}>
        {aberto && <FichaServico servico={porId[aberto.id]} aoAgendar={(s) => setAgendando(s)} comLinkPagina />}
      </Gaveta>
      <DialogoAgendar servico={agendando ? porId[agendando.id] : null} aoFechar={() => setAgendando(null)} aoAgendar={aposDialogo} />
    </div>
  );
}
