import { useEffect, useMemo, useState } from "react";
import Dialogo from "../../ui/Dialogo.jsx";
import { useLoja } from "../../dados/loja.js";
import { useMapas, useServicos, useEquipes, useHoje } from "../../dados/seletores.js";
import { podeAgendar } from "../../dominio/regras.js";
import { formatar, somarDias, diaSemana } from "../../dominio/datas.js";
import { TIPO, ROTULO_TURNO } from "../../dominio/tipos.js";

/** Agendar ou mover sem arrastar. Só oferece equipes com a especialidade e dias a partir de hoje. */
export default function DialogoAgendar({ servico, aoFechar, aoAgendar }) {
  const agendar = useLoja((s) => s.agendar);
  const equipes = useEquipes();
  const servicos = useServicos();
  const hoje = useHoje();
  const { clientes } = useMapas();

  const aptas = useMemo(() => (servico ? equipes.filter((e) => e.especialidades.includes(servico.tipo)) : []), [servico, equipes]);
  const dias = useMemo(() => {
    const lista = [];
    for (let d = hoje; lista.length < 12; d = somarDias(d, 1)) if (diaSemana(d) !== 0) lista.push(d);
    return lista;
  }, [hoje]);

  const [equipeId, setEquipeId] = useState("");
  const [data, setData] = useState("");
  const [turno, setTurno] = useState("manha");
  useEffect(() => {
    if (!servico) return;
    setEquipeId(servico.agendamento?.equipeId || aptas[0]?.id || "");
    setData(servico.agendamento?.data && servico.agendamento.data >= hoje ? servico.agendamento.data : dias[0]);
    setTurno(servico.agendamento?.turno && servico.agendamento.turno !== "dia" ? servico.agendamento.turno : "manha");
  }, [servico, aptas, dias, hoje]);

  if (!servico) return <Dialogo aberto={false} aoFechar={aoFechar} />;
  const equipe = equipes.find((e) => e.id === equipeId);
  const dia = servico.duracao === "dia";
  const regra = equipe && data ? podeAgendar({ servico, equipe, data, turno: dia ? "dia" : turno, servicos, hoje }) : { ok: false, motivo: "Escolha equipe e dia." };

  const confirmar = () => {
    const r = agendar(servico.id, { equipeId, data, turno: dia ? "dia" : turno });
    if (r.ok) { aoAgendar?.(servico.id, r); aoFechar(); }
  };

  return (
    <Dialogo aberto aoFechar={aoFechar} titulo={servico.agendamento ? `Mover ${servico.id}` : `Agendar ${servico.id}`}
      rodape={<>
        <button type="button" className="btn btn-secundario" onClick={aoFechar}>Cancelar</button>
        <button type="button" className="btn btn-primario" disabled={!regra.ok} onClick={confirmar}>{servico.agendamento ? "Mover" : "Agendar"}</button>
      </>}>
      <p className="dialogo-resumo"><b>{clientes[servico.clienteId]?.nome}</b> · {TIPO[servico.tipo].nome} · {dia ? "dia inteiro" : "um turno"} · prazo {formatar(servico.prazo, "curto")}</p>
      <div className="campo">
        <label htmlFor="ag-equipe">Equipe</label>
        <select id="ag-equipe" value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
          {aptas.map((e) => <option key={e.id} value={e.id}>{e.nome} (líder {e.lider})</option>)}
        </select>
        <span className="ajuda">Só aparecem equipes que fazem {TIPO[servico.tipo].nome.toLowerCase()}.</span>
      </div>
      <div className="campo">
        <label htmlFor="ag-dia">Dia</label>
        <select id="ag-dia" value={data} onChange={(e) => setData(e.target.value)}>
          {dias.map((d) => <option key={d} value={d}>{formatar(d)}{d === hoje ? " (hoje)" : ""}</option>)}
        </select>
      </div>
      {!dia && (
        <fieldset className="campo turnos">
          <legend>Turno</legend>
          {["manha", "tarde"].map((t) => (
            <label key={t} className="opcao-turno"><input type="radio" name="ag-turno" value={t} checked={turno === t} onChange={() => setTurno(t)} /> {ROTULO_TURNO[t]}</label>
          ))}
        </fieldset>
      )}
      <p className={regra.ok ? (regra.aviso ? "aviso" : "ok-regra") : "erro-regra"} role="status" aria-live="polite">
        {regra.ok ? regra.aviso || "Turno livre. Pode agendar." : regra.motivo}
      </p>
    </Dialogo>
  );
}
