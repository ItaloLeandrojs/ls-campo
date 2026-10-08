import { forwardRef } from "react";
import { PaintRoller, Lightning, Drop, Umbrella, Wrench, Warning } from "@phosphor-icons/react";
import { TIPO } from "../../dominio/tipos.js";
import { formatar } from "../../dominio/datas.js";
import { Selo } from "../../ui/base.jsx";

export const ICONE_TIPO = { pintura: PaintRoller, eletrica: Lightning, hidraulica: Drop, impermeabilizacao: Umbrella, reparos: Wrench };

/** Card de serviço. `compacto` para dentro da grade. */
const CardServico = forwardRef(function CardServico({ servico, cliente, compacto, hoje, mostrarEtapa = true, className = "", ...resto }, ref) {
  const Icone = ICONE_TIPO[servico.tipo];
  const atrasado = servico.etapa !== "concluido" && servico.prazo < (servico.agendamento?.data || hoje);
  return (
    <div ref={ref} className={`card-sv${compacto ? " compacto" : ""} etapa-${servico.etapa} ${className}`.trim()} {...resto}>
      <div className="card-sv-topo">
        <Icone size={16} weight="duotone" aria-hidden="true" />
        <span className="card-sv-cod num">{servico.id}</span>
        {servico.prioridade === "urgente" && (compacto ? <Warning size={14} weight="fill" className="card-sv-urg" aria-label="Urgente" /> : <span className="tag-urgente">Urgente</span>)}
        {servico.duracao === "dia" && !compacto && <span className="card-sv-dia">Dia inteiro</span>}
      </div>
      <b className="card-sv-cliente">{cliente?.nome}</b>
      {!compacto && <span className="card-sv-desc">{servico.descricao}</span>}
      <div className="card-sv-pe">
        <span className="card-sv-tipo">{TIPO[servico.tipo].nome}</span>
        {mostrarEtapa && <Selo etapa={servico.etapa} />}
        {!compacto && (
          <span className={`card-sv-prazo${atrasado ? " atrasado" : ""}`}>
            {atrasado && <Warning size={14} weight="fill" aria-hidden="true" />}Prazo {formatar(servico.prazo, "curto")}
          </span>
        )}
      </div>
    </div>
  );
});

export default CardServico;
