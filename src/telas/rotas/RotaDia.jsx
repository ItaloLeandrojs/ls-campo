// Rota do dia de uma equipe: resumo, roteiro (lista acessível) e mapa. Usada pelo planejador e pela equipe.
import { useCallback, useMemo, useState } from "react";
import { House, Car } from "@phosphor-icons/react";
import { useMapas, useServicos } from "../../dados/seletores.js";
import { rotaDoDia, textoKm as km, textoTempo as tempo } from "../../dominio/rotas.js";
import { TIPO, ROTULO_TURNO } from "../../dominio/tipos.js";
import { formatar } from "../../dominio/datas.js";
import geo from "../../dados/geo-pontos.json";
import MapaRota from "./MapaRota.jsx";
import "./rotas.css";

export default function RotaDia({ equipe, data }) {
  const servicos = useServicos();
  const { clientes } = useMapas();
  const rota = useMemo(() => rotaDoDia({ servicos, equipeId: equipe.id, data, geo }), [servicos, equipe.id, data]);
  const [sel, setSel] = useState(null);
  const escolher = useCallback((i) => setSel(i), []);

  const pontos = useMemo(() => {
    let n = 0;
    return rota.paradas.map((p) => {
      if (p.lugar === "sede") return { lugar: "sede", p: geo.sede.p, rotulo: `Sede, ${geo.sede.bairro}` };
      n += 1;
      const c = clientes[p.lugar];
      return { lugar: p.lugar, p: geo.clientes[p.lugar], n, rotulo: `${n}. ${c?.nome}, ${c?.bairro}` };
    });
  }, [rota, clientes]);

  if (!rota.paradas.length) {
    return <p className="vazio-curto rota-vazia">A equipe {equipe.nome} não tem visitas em {formatar(data)}.</p>;
  }
  const visitas = rota.paradas.length - 2;

  return (
    <div className="rota-dia">
      <p className="rota-resumo">
        <span><b>{visitas}</b> {visitas === 1 ? "visita" : "visitas"}</span>
        <span><b>{km(rota.totalKm)}</b> rodados</span>
        <span><b>{tempo(rota.totalMin)}</b> de deslocamento</span>
      </p>
      <div className="rota-grade">
        <ol className="rota-lista" aria-label={`Roteiro da equipe ${equipe.nome}`}>
          {rota.paradas.map((p, i) => {
            const t = rota.trechos[i];
            const sede = p.lugar === "sede";
            const c = clientes[p.lugar];
            return (
              <li key={`${p.id}-${i}`} className={`rota-item${sede ? " sede" : ""}${sel === i ? " ativo" : ""}`}>
                <button type="button" className="rota-parada" onClick={() => escolher(i)} aria-pressed={sel === i}>
                  <span className="rota-marca" aria-hidden="true">{sede ? <House size={14} weight="fill" /> : pontos[i].n}</span>
                  {sede ? (
                    <span className="rota-texto"><b>{i === 0 ? "Saída da sede" : "Volta para a sede"}</b><small>{geo.sede.bairro}</small></span>
                  ) : (
                    <span className="rota-texto">
                      <b>{c?.nome}</b>
                      <small>{c?.bairro} · {ROTULO_TURNO[p.turno]} · {TIPO[p.servico.tipo].nome}</small>
                    </span>
                  )}
                </button>
                {t && (
                  <span className="rota-trecho"><Car size={14} aria-hidden="true" /> {t.km === 0 ? "Mesmo endereço" : `${km(t.km)}, ${tempo(t.min)}`}</span>
                )}
              </li>
            );
          })}
        </ol>
        <MapaRota pontos={pontos} selecionado={sel} aoSelecionar={escolher} />
      </div>
      <p className="rota-fonte">Mapa: OpenFreeMap, dados © OpenStreetMap. Rotas de carro calculadas com o OSRM. Endereços aproximados (empresa fictícia).</p>
    </div>
  );
}
