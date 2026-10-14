// Equipe: a rota de hoje, da saída da sede até a volta.
import { useNavigate } from "react-router";
import { CaretLeft } from "@phosphor-icons/react";
import { useLoja } from "../../dados/loja.js";
import { useEquipes, useHoje } from "../../dados/seletores.js";
import { formatar } from "../../dominio/datas.js";
import RotaDia from "./RotaDia.jsx";
import "./rotas.css";

export default function RotaEquipe() {
  const navigate = useNavigate();
  const hoje = useHoje();
  const equipeAtual = useLoja((s) => s.equipeAtual);
  const eq = useEquipes().find((e) => e.id === equipeAtual);
  if (!eq) return null;
  return (
    <div className="rota-equipe-tela">
      <button type="button" className="btn btn-fantasma voltar" onClick={() => navigate("/equipe")}><CaretLeft size={18} /> Hoje</button>
      <h1 className="equipe-h1">Rota de hoje <span className="num">{formatar(hoje)}</span></h1>
      <RotaDia equipe={eq} data={hoje} />
    </div>
  );
}
