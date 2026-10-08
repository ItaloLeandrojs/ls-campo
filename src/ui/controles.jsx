// Controles usados em várias telas: tema e recomeçar dados.
import { Moon, Sun } from "@phosphor-icons/react";
import { useLoja, lojaApp } from "../dados/loja.js";
import { apagarTodas } from "../dados/fotos.js";

export function BotaoTema() {
  const tema = useLoja((s) => s.tema);
  const setTema = useLoja((s) => s.setTema);
  const escuro = tema === "escuro";
  return (
    <button type="button" className="btn btn-fantasma" onClick={() => setTema(escuro ? "claro" : "escuro")} aria-pressed={escuro}>
      {escuro ? <Sun size={18} /> : <Moon size={18} />} {escuro ? "Tema claro" : "Tema escuro"}
    </button>
  );
}

export function recomecarTudo() {
  apagarTodas();
  lojaApp().getState().recomecar();
}
