// Fotos do retorno: reduzidas no navegador e guardadas no IndexedDB (o localStorage não aguenta imagens).
import { get, set, del, createStore, clear } from "idb-keyval";

const banco = () => createStore("ls-campo-fotos", "fotos");
const LADO = 1280;
const QUALIDADE = 0.72;
const urls = new Map();

/** Reduz para no máximo 1280 px no lado maior e converte para JPEG. */
export async function reduzirImagem(arquivo) {
  if (!arquivo || !arquivo.type?.startsWith("image/")) throw new Error("Arquivo não é uma imagem.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    throw new Error("Não foi possível abrir esta imagem. Tente outra foto.");
  }
  const escala = Math.min(1, LADO / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", QUALIDADE));
  if (!blob) throw new Error("Não foi possível preparar a foto.");
  return blob;
}

export async function salvarFoto(blob) {
  const id = `foto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    await set(id, blob, banco());
  } catch {
    throw new Error("Não foi possível guardar a foto neste navegador. Tente uma imagem menor.");
  }
  return id;
}

/** URL para exibir a foto (cacheada). Retorna null se a foto não existir mais. */
export async function lerFoto(id) {
  if (urls.has(id)) return urls.get(id);
  try {
    const blob = await get(id, banco());
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urls.set(id, url);
    return url;
  } catch {
    return null;
  }
}

export async function apagarFoto(id) {
  if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
  try { await del(id, banco()); } catch {}
}

export async function apagarTodas() {
  for (const u of urls.values()) URL.revokeObjectURL(u);
  urls.clear();
  try { await clear(banco()); } catch {}
}
