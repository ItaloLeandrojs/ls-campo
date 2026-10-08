// Artes do crachá desenhadas em canvas: frente (equipe, líder, especialidades) e textura do cordão.
import { TIPO } from "../../dominio/tipos.js";

const TERRA = "#B8462A";

async function fontesProntas() {
  try {
    await Promise.all([document.fonts?.load("760 76px 'Schibsted Grotesk'"), document.fonts?.load("500 22px 'IBM Plex Mono'")]);
    await document.fonts?.ready;
  } catch {}
}

export async function frenteDoCracha(equipe) {
  await fontesProntas();
  const W = 600, H = 840;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#FAFAF9"; g.fillRect(0, 0, W, H);
  g.fillStyle = TERRA; g.fillRect(0, 0, W, 210);
  g.fillStyle = "#FFFFFF";
  g.font = "700 30px 'Schibsted Grotesk', 'Segoe UI', sans-serif";
  g.fillText("ARREMATE", 48, 92);
  g.font = "500 22px 'Schibsted Grotesk', 'Segoe UI', sans-serif";
  g.fillText("Serviços Prediais", 48, 128);
  g.font = "500 18px 'IBM Plex Mono', monospace";
  g.globalAlpha = 0.8; g.fillText("EQUIPE DE CAMPO", 48, 176); g.globalAlpha = 1;

  g.fillStyle = "#18181B";
  g.font = "760 76px 'Schibsted Grotesk', 'Segoe UI', sans-serif";
  g.fillText(equipe.nome, 48, 340);
  g.fillStyle = "#52525B";
  g.font = "500 30px 'Schibsted Grotesk', 'Segoe UI', sans-serif";
  g.fillText(`Líder ${equipe.lider}`, 48, 396);

  let y = 470;
  for (const t of equipe.especialidades) {
    const txt = TIPO[t].nome;
    g.font = "600 26px 'Schibsted Grotesk', 'Segoe UI', sans-serif";
    const w = g.measureText(txt).width + 44;
    g.fillStyle = "#F6E6E1";
    g.beginPath(); g.roundRect(48, y, w, 52, 26); g.fill();
    g.fillStyle = "#9A3A22"; g.fillText(txt, 70, y + 35);
    y += 68;
  }
  g.fillStyle = "#71717A";
  g.font = "500 22px 'IBM Plex Mono', monospace";
  g.fillText("LS CAMPO · DEMONSTRAÇÃO", 48, H - 60);
  return c.toDataURL("image/png");
}

export function cordao() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = TERRA; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.font = "700 96px 'Schibsted Grotesk', 'Segoe UI', sans-serif";
  g.textBaseline = "middle";
  g.fillText("ARREMATE", 60, 128);
  g.fillText("·", 640, 128);
  g.font = "700 96px 'IBM Plex Mono', monospace";
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
