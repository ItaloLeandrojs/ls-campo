import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Camera, Trash, CheckCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { useMapas, useServicos, useHoje } from "../../dados/seletores.js";
import { reduzirImagem, salvarFoto, lerFoto, apagarFoto } from "../../dados/fotos.js";
import { TIPO, MOTIVOS } from "../../dominio/tipos.js";
import Carimbo from "../../ui/Carimbo.jsx";
import { ServicoCampo } from "./Hoje.jsx";
import "./equipe.css";

const MAX_FOTOS = 4;

function Miniatura({ id, aoRemover, rotulo }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { let vivo = true; lerFoto(id).then((u) => vivo && setUrl(u)); return () => { vivo = false; }; }, [id]);
  return (
    <div className="mini">
      {url ? <img src={url} alt={rotulo} /> : <span className="mini-vazia">…</span>}
      {aoRemover && <button type="button" className="mini-remover" aria-label={`Remover ${rotulo}`} onClick={aoRemover}><Trash size={16} /></button>}
    </div>
  );
}

function CampoFotos({ titulo, ids, setIds }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const adicionar = async (e) => {
    const arquivos = [...e.target.files].slice(0, MAX_FOTOS - ids.length);
    e.target.value = "";
    if (!arquivos.length) return;
    setOcupado(true); setErro("");
    const novos = [];
    for (const a of arquivos) {
      try { novos.push(await salvarFoto(await reduzirImagem(a))); } catch (err) { setErro(err.message); }
    }
    setIds((atual) => [...atual, ...novos]);
    setOcupado(false);
  };
  return (
    <div className="campo-fotos">
      <span className="campo-fotos-titulo">{titulo} <small>{ids.length}/{MAX_FOTOS}</small></span>
      <div className="minis">
        {ids.map((id, i) => <Miniatura key={id} id={id} rotulo={`${titulo} ${i + 1}`} aoRemover={() => { apagarFoto(id); setIds((atual) => atual.filter((x) => x !== id)); }} />)}
        {ids.length < MAX_FOTOS && (
          <label className={`mini mini-add${ocupado ? " ocupado" : ""}`}>
            <Camera size={24} aria-hidden="true" />
            <span>{ocupado ? "Preparando…" : "Adicionar"}</span>
            <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={adicionar} disabled={ocupado} aria-label={`Adicionar foto: ${titulo}`} />
          </label>
        )}
      </div>
      {erro && <span className="erro" role="alert">{erro}</span>}
    </div>
  );
}

export default function Retorno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hoje = useHoje();
  const s = useServicos().find((x) => x.id === id);
  const { clientes } = useMapas();
  const retornar = useLoja((st) => st.retornar);
  const [resultado, setResultado] = useState("concluido");
  const [checklist, setChecklist] = useState({});
  const [motivo, setMotivo] = useState("");
  const [obs, setObs] = useState("");
  const [antes, setAntes] = useState([]);
  const [depois, setDepois] = useState([]);
  const [enviado, setEnviado] = useState(null);
  const [erro, setErro] = useState("");

  if (!s) return <div className="vazio"><b>Serviço não encontrado</b></div>;
  const tipo = TIPO[s.tipo];
  const obrig = tipo.checklist.filter((i) => i.obrigatorio);
  const faltam = obrig.filter((i) => !checklist[i.id]).length;
  const pronto = resultado === "concluido" ? faltam === 0 : !!motivo;
  const falta = resultado === "concluido"
    ? (faltam ? `Falta marcar ${faltam} ${faltam === 1 ? "item obrigatório" : "itens obrigatórios"}.` : "")
    : (!motivo ? "Escolha o motivo do reagendamento." : "");

  const enviar = () => {
    const r = retornar(s.id, { resultado, checklist, observacao: obs.trim(), fotosAntes: antes, fotosDepois: depois, motivo });
    if (!r.ok) { setErro(r.motivo); return; }
    setEnviado(resultado);
  };

  if (enviado === "concluido") {
    return (
      <div className="retorno-fim">
        <Carimbo />
        <p>{s.id} · {clientes[s.clienteId]?.nome}</p>
        <p className="vazio-curto">O planejador já vê o retorno, com checklist e fotos.</p>
        <button type="button" className="btn btn-primario btn-grande" onClick={() => navigate("/equipe")}>Voltar para hoje</button>
      </div>
    );
  }
  if (enviado === "reagendar") {
    return (
      <div className="retorno-fim neutro" role="status">
        <ArrowCounterClockwise size={48} aria-hidden="true" />
        <b>Serviço devolvido ao planejador</b>
        <p className="vazio-curto">Ele volta para a lista A agendar, com o motivo registrado.</p>
        <button type="button" className="btn btn-primario btn-grande" onClick={() => navigate("/equipe")}>Voltar para hoje</button>
      </div>
    );
  }

  return (
    <div className="retorno">
      <button type="button" className="btn btn-fantasma" onClick={() => navigate("/equipe")}><ArrowLeft size={18} /> Hoje</button>
      {s.agendamento && <ServicoCampo s={s} cliente={clientes[s.clienteId]} hoje={hoje} acoes={s.etapa !== "execucao"} />}

      {s.etapa === "concluido" && s.retorno && (
        <section className="retorno-resumo">
          <h2 className="equipe-h2"><CheckCircle size={20} weight="fill" /> Retorno enviado</h2>
          <ul className="check-lista">{tipo.checklist.map((i) => <li key={i.id} className={s.retorno.checklist?.[i.id] ? "feito" : ""}>{i.texto}</li>)}</ul>
          {s.retorno.observacao && <p className="ficha-obs">“{s.retorno.observacao}”</p>}
          <div className="minis">{[...(s.retorno.fotosAntes || []), ...(s.retorno.fotosDepois || [])].map((f, i) => <Miniatura key={f} id={f} rotulo={`Foto ${i + 1}`} />)}</div>
        </section>
      )}

      {s.etapa === "execucao" && (
        <section className="retorno-form" aria-label="Retorno do serviço">
          <h2 className="equipe-h2">Como terminou?</h2>
          <div className="resultado-opcoes" role="radiogroup" aria-label="Resultado">
            {[["concluido", "Concluído", "Serviço feito"], ["reagendar", "Reagendar", "Não deu para fazer"]].map(([v, t, d]) => (
              <label key={v} className={`resultado-opcao${resultado === v ? " ativo" : ""}`}>
                <input type="radio" name="resultado" value={v} checked={resultado === v} onChange={() => { setResultado(v); setErro(""); }} />
                <b>{t}</b><span>{d}</span>
              </label>
            ))}
          </div>

          {resultado === "concluido" ? (
            <>
              <fieldset className="checklist">
                <legend>Checklist de {tipo.nome.toLowerCase()}</legend>
                {tipo.checklist.map((i) => (
                  <label key={i.id} className="check-item">
                    <input type="checkbox" checked={!!checklist[i.id]} onChange={(e) => { const v = e.target.checked; setChecklist((c) => ({ ...c, [i.id]: v })); }} />
                    <span>{i.texto}{i.obrigatorio && <small> · obrigatório</small>}</span>
                  </label>
                ))}
              </fieldset>
              <CampoFotos titulo="Fotos de antes" ids={antes} setIds={setAntes} />
              <CampoFotos titulo="Fotos de depois" ids={depois} setIds={setDepois} />
            </>
          ) : (
            <div className="campo">
              <label htmlFor="ret-motivo">Motivo</label>
              <select id="ret-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Escolha o motivo</option>
                {MOTIVOS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          )}
          <div className="campo">
            <label htmlFor="ret-obs">Observação <small>(opcional)</small></label>
            <textarea id="ret-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder={resultado === "concluido" ? "Ex.: cliente pediu retoque na porta" : "Ex.: chuva forte desde as 8h"} />
          </div>
          {erro && <p className="erro-regra" role="alert">{erro}</p>}
          <div className="enviar-barra">
            {falta && <span className="falta" aria-live="polite">{falta}</span>}
            <button type="button" className="btn btn-primario btn-grande" disabled={!pronto} onClick={enviar}>Enviar retorno</button>
          </div>
        </section>
      )}
    </div>
  );
}
