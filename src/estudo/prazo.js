// Peça viva do estudo de caso: serviços concluídos no mês, cada um no prazo ou atrasado.
// O cálculo é a mesma função do painel de Indicadores (noPrazo), sobre serviços montados aqui.
import { noPrazo } from "../dominio/indicadores.js";
import { somarDias } from "../dominio/datas.js";

const INICIO = "2026-09-01";
const FIM = "2026-09-30";

// true = concluído até o prazo; false = depois do prazo. Três atrasados para começar.
export const ESTADO_INICIAL = [true, true, false, true, true, true, false, true, true, true, false, true];

export function montarConcluidos(estados) {
  return estados.map((ok, i) => {
    const prazo = somarDias(INICIO, 2 + i * 2);
    const fim = ok ? prazo : somarDias(prazo, 2);
    return {
      id: `p${i + 1}`,
      etapa: "concluido",
      prazo,
      historico: [],
      retorno: { concluidoEm: `${fim}T16:00:00` },
    };
  });
}

export const calcularPrazo = (estados) => noPrazo(montarConcluidos(estados), { inicio: INICIO, fim: FIM });
