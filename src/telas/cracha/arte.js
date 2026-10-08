// Artes do crachá desenhadas em canvas: frente (equipe, líder, especialidades) e textura do cordão.
import { TIPO } from "../../dominio/tipos.js";

const AZUL = "#2F62D6";

async function fontesProntas() {
  try { await document.fonts?.ready; } catch {}
}

export async function frenteDoCracha(equipe) {
  await fontesProntas();
  const W = 600, H = 840;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#F7F8FA"; g.fillRect(0, 0, W, H);
  g.fillStyle = AZUL; g.fillRect(0, 0, W, 210);
  g.fillStyle = "#FFFFFF";
  g.font = "700 30px 'Roboto Flex', 'Segoe UI', sans-serif";
  g.fillText("ARREMATE", 48, 92);
  g.font = "500 22px 'Roboto Flex', 'Segoe UI', sans-serif";
  g.fillText("Serviços Prediais", 48, 128);
  g.font = "600 18px 'Roboto Mono', monospace";
  g.globalAlpha = 0.8; g.fillText("EQUIPE DE CAMPO", 48, 176); g.globalAlpha = 1;

  g.fillStyle = "#14161B";
  g.font = "760 76px 'Roboto Flex', 'Segoe UI', sans-serif";
  g.fillText(equipe.nome, 48, 340);
  g.fillStyle = "#4F5561";
  g.font = "500 30px 'Roboto Flex', 'Segoe UI', sans-serif";
  g.fillText(`Líder ${equipe.lider}`, 48, 396);

  let y = 470;
  for (const t of equipe.especialidades) {
    const txt = TIPO[t].nome;
    g.font = "600 26px 'Roboto Flex', 'Segoe UI', sans-serif";
    const w = g.measureText(txt).width + 44;
    g.fillStyle = "#E6EDFB";
    g.beginPath(); g.roundRect(48, y, w, 52, 26); g.fill();
    g.fillStyle = "#2450B8"; g.fillText(txt, 70, y + 35);
    y += 68;
  }
  g.fillStyle = "#6B717D";
  g.font = "500 22px 'Roboto Mono', monospace";
  g.fillText("LS CAMPO · DEMONSTRAÇÃO", 48, H - 60);
  return c.toDataURL("image/png");
}

export function cordao() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = AZUL; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.font = "700 96px 'Roboto Flex', 'Segoe UI', sans-serif";
  g.textBaseline = "middle";
  g.fillText("ARREMATE", 60, 128);
  g.fillText("·", 640, 128);
  g.font = "700 96px 'Roboto Mono', monospace";
  g.fillText("LS", 760, 128);
  return c.toDataURL("image/png");
}

/** O 3D só entra se o aparelho aguenta e a pessoa não pediu menos movimento. */
export function podeCracha3D() {
  if (typeof window === "undefined") return false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (navigator.connection?.saveData) return false;
  if (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}
