import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useLoja } from "../dados/loja.js";
import { useMapas } from "../dados/seletores.js";
import { lerFoto } from "../dados/fotos.js";
import { TIPO, MOTIVOS, MOTIVO, ROTULO_TURNO } from "../dominio/tipos.js";
import { formatar } from "../dominio/datas.js";
import { Selo } from "./base.jsx";
import { ICONE_TIPO } from "../telas/agenda/CardServico.jsx";

const POR = { planejador: "Planejador", equipe: "Equipe" };

export function descreverEvento(e, equipes) {
  const quando = `${formatar(e.em.slice(0, 10), "curto")} ${e.em.slice(11, 16)}`;
  let texto;
  if (e.para === "agendado") {
    const a = e.agendamento;
    texto = `${e.de === "agendado" ? "moveu para" : "agendou para"} ${equipes[a.equipeId]?.nome}, ${formatar(a.data)}, ${ROTULO_TURNO[a.turno].toLowerCase()}`;
  } else if (e.para === "novo") texto = "tirou da agenda";
  else if (e.para === "reagendar") texto = `pediu reagendamento: ${MOTIVO[e.motivo]?.nome.toLowerCase()}`;
  else if (e.para === "execucao") texto = "iniciou o serviço";
  else if (e.para === "concluido") texto = "concluiu o serviço";
  return { quando, texto: `${POR[e.por]} ${texto}` };
}

function Foto({ id, alt }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { let vivo = true; lerFoto(id).then((u) => vivo && setUrl(u)); return () => { vivo = false; }; }, [id]);
  if (!url) return <span className="foto-mini vazia">Foto indisponível</span>;
  return <img className="foto-mini" src={url} alt={alt} />;
}

/** Conteúdo da ficha do serviço (usado na gaveta da agenda e na página do serviço). */
export default function FichaServico({ servico, aoAgendar, comLinkPagina = false }) {
  const { clientes, equipes } = useMapas();
  const desagendar = useLoja((s) => s.desagendar);
  const reagendar = useLoja((s) => s.reagendar);
  const [motivo, setMotivo] = useState("");
  const [pedindoMotivo, setPedindoMotivo] = useState(false);
  const [msg, setMsg] = useState("");
  if (!servico) return null;
  const c = clientes[servico.clienteId];
  const a = servico.agendamento;
  const Icone = ICONE_TIPO[servico.tipo];
  const r = servico.retorno;

  const fazer = (res, ok) => { setMsg(res.ok ? ok : res.motivo); setPedindoMotivo(false); setMotivo(""); };

  return (
    <div className="ficha">
      <div className="ficha-cab">
        <span className="ficha-tipo"><Icone size={18} weight="duotone" aria-hidden="true" /> {TIPO[servico.tipo].nome}</span>
        <Selo etapa={servico.etapa} />
        {servico.prioridade === "urgente" && <span className="tag-urgente">Urgente</span>}
      </div>
      <p className="ficha-desc">{servico.descricao}</p>
      <dl className="ficha-dados">
        <div><dt>Cliente</dt><dd><Link to={`/clientes/${c?.id}`}>{c?.nome}</Link><small>{c?.endereco} · {c?.bairro}</small></dd></div>
        <div><dt>Prazo</dt><dd className="num">{formatar(servico.prazo)}</dd></div>
        <div><dt>Duração</dt><dd>{servico.duracao === "dia" ? "Dia inteiro" : "Um turno"}</dd></div>
        <div><dt>Agenda</dt><dd>{a ? `${equipes[a.equipeId]?.nome} · ${formatar(a.data)} · ${ROTULO_TURNO[a.turno]}` : "Sem agendamento"}</dd></div>
        <div><dt>Criado em</dt><dd className="num">{formatar(servico.criadoEm)}</dd></div>
      </dl>

      {servico.etapa !== "concluido" && servico.etapa !== "execucao" && (
        <div className="ficha-acoes">
          <button type="button" className="btn btn-primario" onClick={() => aoAgendar?.(servico)}>{a ? "Mover…" : "Agendar…"}</button>
          {servico.etapa === "agendado" && <>
            <button type="button" className="btn btn-secundario" onClick={() => fazer(desagendar(servico.id), "Serviço voltou para a lista A agendar.")}>Tirar da agenda</button>
            <button type="button" className="btn btn-secundario" onClick={() => setPedindoMotivo(true)}>Reagendar…</button>
          </>}
        </div>
      )}
      {pedindoMotivo && (
        <div className="ficha-motivo">
          <div className="campo">
            <label htmlFor="ficha-motivo">Motivo do reagendamento</label>
            <select id="ficha-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option value="">Escolha…</option>
              {MOTIVOS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-primario" disabled={!motivo} onClick={() => fazer(reagendar(servico.id, motivo), "Serviço voltou para a lista A agendar, com o motivo registrado.")}>Confirmar</button>
        </div>
      )}
      <p className="ficha-msg" role="status" aria-live="polite">{msg}</p>

      {r?.concluidoEm && (
        <section className="ficha-retorno">
          <h3>Retorno da equipe</h3>
          <ul className="check-lista">
            {TIPO[servico.tipo].checklist.map((i) => <li key={i.id} className={r.checklist?.[i.id] ? "feito" : ""}>{i.texto}</li>)}
          </ul>
          {r.observacao && <p className="ficha-obs">“{r.observacao}”</p>}
          {(r.fotosAntes?.length > 0 || r.fotosDepois?.length > 0) && (
            <div className="ficha-fotos">
              {r.fotosAntes?.map((f, i) => <Foto key={f} id={f} alt={`Antes ${i + 1}`} />)}
              {r.fotosDepois?.map((f, i) => <Foto key={f} id={f} alt={`Depois ${i + 1}`} />)}
            </div>
          )}
        </section>
      )}

      <section className="ficha-hist">
        <h3>Histórico</h3>
        <ol>
          {[...servico.historico].reverse().map((e, i) => {
            const d = descreverEvento(e, equipes);
            return <li key={i}><span className="num">{d.quando}</span>{d.texto}</li>;
          })}
          <li><span className="num">{formatar(servico.criadoEm, "curto")}</span>Pedido registrado</li>
        </ol>
      </section>
      {comLinkPagina && <Link className="btn btn-fantasma" to={`/servicos/${servico.id}`}>Abrir em página</Link>}
    </div>
  );
}
