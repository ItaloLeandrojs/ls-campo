// Mini-demo da apresentação: agenda pequena com as regras reais do sistema (podeAgendar).
import { useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, pointerWithin } from "@dnd-kit/core";
import { motion, useReducedMotion } from "motion/react";
import { PaintRoller, Drop, Lightning, ArrowRight, ArrowCounterClockwise } from "@phosphor-icons/react";
import { podeAgendar } from "../dominio/regras.js";
import { hojeISO, somarDias, diaSemana, formatar } from "../dominio/datas.js";

const EQUIPES = [
  { id: "aroeira", nome: "Aroeira", especialidades: ["pintura", "reparos"] },
  { id: "carnauba", nome: "Carnaúba", especialidades: ["hidraulica", "impermeabilizacao"] },
  { id: "mandacaru", nome: "Mandacaru", especialidades: ["eletrica", "pintura"] },
];
const ICONE = { pintura: PaintRoller, hidraulica: Drop, eletrica: Lightning };
const NOME = { pintura: "Pintura", hidraulica: "Hidráulica", eletrica: "Elétrica predial" };

function proximosDias(hoje, n) {
  const r = [];
  for (let d = somarDias(hoje, 1); r.length < n; d = somarDias(d, 1)) if (diaSemana(d) !== 0) r.push(d);
  return r;
}

function Cartao({ s, arrastando, treme }) {
  const I = ICONE[s.tipo];
  return (
    <div className={`demo-card${arrastando ? " fantasma" : ""}${treme ? " treme" : ""}`}>
      <I size={18} weight="duotone" aria-hidden="true" />
      <span><b>{NOME[s.tipo]}</b><small>{s.cliente}</small></span>
    </div>
  );
}

function Arrastavel({ s, treme }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: s.id });
  return <div ref={setNodeRef} {...listeners} {...attributes} className="demo-arrastavel" aria-label={`${NOME[s.tipo]}, ${s.cliente}. Arraste para uma equipe ou use o menu abaixo.`}><Cartao s={s} arrastando={isDragging} treme={treme} /></div>;
}

function Celula({ equipe, data, ativo, servicos, hoje, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${equipe.id}|${data}` });
  let estado = "";
  if (ativo) estado = podeAgendar({ servico: ativo, equipe, data, turno: "manha", servicos, hoje }).ok ? " aceita" : " recusa";
  return <div ref={setNodeRef} className={`demo-celula${estado}${isOver ? " sobre" : ""}`} aria-label={`${equipe.nome}, ${formatar(data)}`}>{children}</div>;
}

const inicial = (dias) => [
  { id: "d1", tipo: "pintura", cliente: "Residencial Bem-te-vi", duracao: "turno", prazo: dias[2], etapa: "novo", agendamento: null },
  { id: "d2", tipo: "hidraulica", cliente: "Padaria Trigo de Ouro", duracao: "turno", prazo: dias[2], etapa: "novo", agendamento: null },
  { id: "d3", tipo: "eletrica", cliente: "Clínica Sorriso Pleno", duracao: "turno", prazo: dias[2], etapa: "novo", agendamento: null },
];

// hojeBuild: a data em que a página foi gerada. A primeira pintura usa essa data (igual ao HTML
// estático); depois de montar, troca para a data de quem visita.
export default function MiniDemo({ linkDemo, hojeBuild }) {
  const [hoje, setHoje] = useState(() => hojeBuild ?? hojeISO());
  const dias = useMemo(() => proximosDias(hoje, 3), [hoje]);
  const [servicos, setServicos] = useState(() => inicial(dias));
  useEffect(() => {
    const h = hojeISO();
    if (h !== hoje) { setHoje(h); setServicos(inicial(proximosDias(h, 3))); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [ativo, setAtivo] = useState(null);
  const [msg, setMsg] = useState({ tipo: "", texto: "Arraste um serviço para a equipe e o dia." });
  const [treme, setTreme] = useState(null);
  const reduz = useReducedMotion();
  const sensores = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }));

  const agendar = (id, equipeId, data) => {
    const s = servicos.find((x) => x.id === id);
    const eq = EQUIPES.find((e) => e.id === equipeId);
    let r = podeAgendar({ servico: s, equipe: eq, data, turno: "manha", servicos, hoje });
    let turno = "manha";
    if (!r.ok && /manhã/.test(r.motivo)) { r = podeAgendar({ servico: s, equipe: eq, data, turno: "tarde", servicos, hoje }); turno = "tarde"; }
    if (!r.ok) {
      setTreme(id); setTimeout(() => setTreme(null), 400);
      setMsg({ tipo: "erro", texto: r.motivo });
      return;
    }
    const novos = servicos.map((x) => (x.id === id ? { ...x, etapa: "agendado", agendamento: { equipeId, data, turno } } : x));
    setServicos(novos);
    const faltam = novos.filter((x) => !x.agendamento).length;
    setMsg(faltam ? { tipo: "ok", texto: `Agendado para ${eq.nome}, ${formatar(data)}. Falta${faltam > 1 ? "m" : ""} ${faltam}.` } : { tipo: "fim", texto: "Pronto. É assim o dia inteiro, com mais equipes e regras." });
  };

  const aoSoltar = ({ active, over }) => {
    setAtivo(null);
    if (!over) return;
    const [equipeId, data] = over.id.split("|");
    agendar(active.id, equipeId, data);
  };

  const pendentes = servicos.filter((s) => !s.agendamento);
  const ativoObj = servicos.find((s) => s.id === ativo);

  return (
    <div className="demo">
      <DndContext id="mini-demo" sensors={sensores} collisionDetection={pointerWithin} onDragStart={({ active }) => setAtivo(active.id)} onDragCancel={() => setAtivo(null)} onDragEnd={aoSoltar}>
        <div className="demo-lista" aria-label="Serviços a agendar">
          <span className="demo-rotulo">A agendar</span>
          {pendentes.map((s) => <Arrastavel key={s.id} s={s} treme={treme === s.id} />)}
          {pendentes.length === 0 && (
            <button type="button" className="demo-recomecar" onClick={() => { setServicos(inicial(dias)); setMsg({ tipo: "", texto: "Arraste um serviço para a equipe e o dia." }); }}>
              <ArrowCounterClockwise size={16} /> De novo
            </button>
          )}
        </div>
        <div className="demo-grade" role="grid" aria-label="Mini agenda">
          <span />
          {dias.map((d) => <span key={d} className="demo-dia" role="columnheader">{formatar(d)}</span>)}
          {EQUIPES.map((eq) => [
            <span key={eq.id} className="demo-equipe" role="rowheader"><b>{eq.nome}</b><small>{eq.especialidades.map((t) => NOME[t] || "Reparos").join(" · ")}</small></span>,
            ...dias.map((d) => (
              <Celula key={`${eq.id}${d}`} equipe={eq} data={d} ativo={ativoObj} servicos={servicos} hoje={hoje}>
                {servicos.filter((s) => s.agendamento?.equipeId === eq.id && s.agendamento.data === d).map((s) => (
                  reduz ? <Cartao key={s.id} s={s} /> : (
                    <motion.div key={s.id} initial={{ scale: 0.94, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}><Cartao s={s} /></motion.div>
                  )
                ))}
              </Celula>
            )),
          ])}
        </div>
        <DragOverlay dropAnimation={reduz ? null : { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }}>{ativoObj ? <div className="demo-no-ar"><Cartao s={ativoObj} /></div> : null}</DragOverlay>
      </DndContext>

      <div className="demo-teclado">
        <span>Sem arrastar:</span>
        {pendentes.slice(0, 1).map((s) => (
          <label key={s.id}>{NOME[s.tipo]} para
            <select defaultValue="" onChange={(e) => { if (e.target.value) { const [eq, d] = e.target.value.split("|"); agendar(s.id, eq, d); e.target.value = ""; } }}>
              <option value="">escolha equipe e dia</option>
              {EQUIPES.flatMap((eq) => dias.map((d) => <option key={`${eq.id}|${d}`} value={`${eq.id}|${d}`}>{eq.nome}, {formatar(d)}</option>))}
            </select>
          </label>
        ))}
      </div>
      <p className={`demo-msg ${msg.tipo}`} role="status" aria-live="polite">
        {msg.texto}
        {msg.tipo === "fim" && <a href={linkDemo}>Abrir a demonstração completa <ArrowRight size={16} /></a>}
      </p>
    </div>
  );
}
