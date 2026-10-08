// Atalhos para ler os dados nas telas.
import { useMemo } from "react";
import { useLoja } from "./loja.js";

export function useMapas() {
  const dados = useLoja((s) => s.dados);
  return useMemo(() => ({
    clientes: Object.fromEntries(dados.clientes.map((c) => [c.id, c])),
    equipes: Object.fromEntries(dados.equipes.map((e) => [e.id, e])),
  }), [dados.clientes, dados.equipes]);
}

export const useServicos = () => useLoja((s) => s.dados.servicos);
export const useEquipes = () => useLoja((s) => s.dados.equipes);
export const useHoje = () => useLoja((s) => s.hoje)();
