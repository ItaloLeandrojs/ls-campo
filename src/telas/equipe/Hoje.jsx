import { useNavigate } from "react-router";
import { MapPin, Play, ClipboardText } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { useMapas, useServicos, useHoje } from "../../dados/seletores.js";
import { TIPO, ROTULO_TURNO } from "../../dominio/tipos.js";
import { formatar, somarDias, diaSemana } from "../../dominio/datas.js";
import { Selo } from "../../ui/base.jsx";
import { ICONE_TIPO } from "../agenda/CardServico.jsx";
import "./equipe.css";

const ORDEM = { dia: 0, manha: 1, tarde: 2 };

export function ServicoCampo({ s, cliente, hoje, acoes = true }) {
  const navigate = useNavigate();
  const iniciar = useLoja((st) => st.iniciar);
  const Icone = ICONE_TIPO[s.tipo];
  return (
    <article className={`sv-campo etapa-${s.etapa}`}>
      <header>
        <span className="sv-turno">{ROTULO_TURNO[s.agendamento.turno]}</span>
        <Selo etapa={s.etapa} />
        {s.prioridade === "urgente" && <span className="tag-urgente">Urgente</span>}
      </header>
      <b className="sv-cliente">{cliente?.nome}</b>
      <span className="sv-end"><MapPin size={16} aria-hidden="true" />{cliente?.endereco} · {cliente?.bairro}</span>
      <p className="sv-desc"><Icone size={18} weight="duotone" aria-hidden="true" /> <span><b>{TIPO[s.tipo].nome}.</b> {s.descricao}</span></p>
      <span className="sv-cod num">{s.id} · prazo {formatar(s.prazo, "curto")}</span>
      {acoes && s.agendamento.data === hoje && s.etapa === "agendado" && (
        <button type="button" className="btn btn-primario btn-grande" onClick={() => iniciar(s.id)}><Play size={20} weight="fill" /> Iniciar serviço</button>
      )}
      {acoes && s.etapa === "execucao" && (
        <button type="button" className="btn btn-primario btn-grande" onClick={() => navigate(`/equipe/servico/${s.id}`)}><ClipboardText size={20} /> Dar retorno</button>
      )}
      {acoes && s.etapa === "concluido" && (
        <button type="button" className="btn btn-secundario" onClick={() => navigate(`/equipe/servico/${s.id}`)}>Ver retorno</button>
      )}
    </article>
  );
}

export default function Hoje() {
  const hoje = useHoje();
  const servicos = useServicos();
  const equipeAtual = useLoja((s) => s.equipeAtual);
  const { clientes } = useMapas();
  const meus = servicos.filter((s) => s.agendamento?.equipeId === equipeAtual);
  const doDia = meus.filter((s) => s.agendamento.data === hoje).sort((a, b) => ORDEM[a.agendamento.turno] - ORDEM[b.agendamento.turno]);
  const proximos = [];
  for (let d = somarDias(hoje, 1); proximos.length < 3; d = somarDias(d, 1)) if (diaSemana(d) !== 0) proximos.push(d);

  return (
    <div className="hoje">
      <h1 className="equipe-h1">Hoje <span className="num">{formatar(hoje)}</span></h1>
      {doDia.length === 0 ? (
        <div className="vazio"><b>{diaSemana(hoje) === 0 ? "Domingo, sem serviços." : "Nenhum serviço para hoje."}</b><p>Os próximos aparecem abaixo quando o planejador agendar.</p></div>
      ) : (
        <div className="sv-lista">{doDia.map((s) => <ServicoCampo key={s.id} s={s} cliente={clientes[s.clienteId]} hoje={hoje} />)}</div>
      )}
      <h2 className="equipe-h2">Próximos dias</h2>
      {proximos.map((d) => {
        const lista = meus.filter((s) => s.agendamento.data === d).sort((a, b) => ORDEM[a.agendamento.turno] - ORDEM[b.agendamento.turno]);
        return (
          <section key={d} className="prox-dia">
            <h3>{formatar(d)}</h3>
            {lista.length === 0 ? <p className="vazio-curto">Livre.</p> : lista.map((s) => (
              <p key={s.id} className="prox-item"><span className="sv-turno">{ROTULO_TURNO[s.agendamento.turno]}</span>{clientes[s.clienteId]?.nome} · {TIPO[s.tipo].nome}</p>
            ))}
          </section>
        );
      })}
    </div>
  );
}
