#!/usr/bin/env node
// Gera src/dados/geo-pontos.json e geo-linhas.json: coordenadas da sede e dos clientes de exemplo e as rotas pelas ruas entre todos eles.
// Roda uma vez (os clientes de exemplo são fixos). Fontes públicas, usadas com calma e com crédito no mapa:
//   - Nominatim (OpenStreetMap): centro de cada bairro, 1 pedido por segundo.
//   - OSRM (servidor de demonstração): encaixe na rua mais próxima e rota de carro entre cada par, 1 pedido por segundo.
// Uso: node scripts/gerar-geo.mjs
import fs from "node:fs";
import { gerarSemente } from "../src/dados/semente.js";

const UA = "LS-Campo/1.0 (projeto de portfolio; github.com/ItaloLeandrojs/ls-campo)";
const SEDE_BAIRRO = "Fátima";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.ok) return r.json();
    console.warn(`  ${r.status} em ${url.slice(0, 90)}..., tentando de novo`);
    await espera(3000 * tentativa);
  }
  throw new Error(`Falhou: ${url}`);
}

// Polyline (precisão 5), o formato compacto do Google/OSRM.
function codificar(coords) {
  let ultLat = 0, ultLng = 0, s = "";
  const num = (v) => { v = v < 0 ? ~(v << 1) : v << 1; let o = ""; while (v >= 0x20) { o += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return o + String.fromCharCode(v + 63); };
  for (const [lng, lat] of coords) {
    const la = Math.round(lat * 1e5), ln = Math.round(lng * 1e5);
    s += num(la - ultLat) + num(ln - ultLng);
    ultLat = la; ultLng = ln;
  }
  return s;
}

// Deslocamento fixo por cliente (a partir do id), entre 150 e 550 m do centro do bairro.
function deslocar([lng, lat], id) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const ang = (h % 360) * Math.PI / 180;
  const raio = 150 + ((h >>> 9) % 400);
  return [lng + (raio * Math.cos(ang)) / (111320 * Math.cos(lat * Math.PI / 180)), lat + (raio * Math.sin(ang)) / 110540];
}

const dados = gerarSemente("2026-10-14");
const bairros = [...new Set([SEDE_BAIRRO, ...dados.clientes.map((c) => c.bairro)])];

console.log(`Centros de ${bairros.length} bairros (Nominatim)...`);
const centro = {};
for (const b of bairros) {
  const r = await pedir(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(`${b}, Fortaleza, Ceará`)}`);
  if (!r[0]) throw new Error(`Bairro não encontrado: ${b}`);
  centro[b] = [Number(r[0].lon), Number(r[0].lat)];
  console.log(`  ${b}: ${centro[b].map((x) => x.toFixed(5)).join(", ")}`);
  await espera(1100);
}

console.log("Encaixando sede e clientes na rua mais próxima (OSRM)...");
const pontos = [{ id: "sede", nome: "Sede Arremate", bairro: SEDE_BAIRRO, p: centro[SEDE_BAIRRO] }, ...dados.clientes.map((c) => ({ id: c.id, nome: c.nome, bairro: c.bairro, p: deslocar(centro[c.bairro], c.id) }))];
for (const pt of pontos) {
  const r = await pedir(`https://router.project-osrm.org/nearest/v1/driving/${pt.p[0]},${pt.p[1]}?number=1`);
  pt.p = r.waypoints[0].location.map((x) => Math.round(x * 1e5) / 1e5);
  await espera(1100);
}

const pares = [];
for (let i = 0; i < pontos.length; i++) for (let j = i + 1; j < pontos.length; j++) pares.push([pontos[i], pontos[j]]);
console.log(`Calculando ${pares.length} rotas (cerca de ${Math.ceil(pares.length * 1.15 / 60)} min)...`);
const rotas = {};
let n = 0;
for (const [a, b] of pares) {
  const r = await pedir(`https://router.project-osrm.org/route/v1/driving/${a.p.join(",")};${b.p.join(",")}?overview=simplified&geometries=geojson`);
  const rt = r.routes[0];
  rotas[`${a.id}|${b.id}`] = { km: Math.round(rt.distance / 100) / 10, min: Math.round(rt.duration / 60), linha: codificar(rt.geometry.coordinates) };
  if (++n % 25 === 0) console.log(`  ${n}/${pares.length}`);
  await espera(1100);
}

// Duas partes: distâncias e tempos (pequeno, usado pela Agenda) e traçados das ruas (só o mapa carrega).
const fonte = "Coordenadas: centro do bairro (Nominatim/OpenStreetMap) com deslocamento fixo por cliente. Rotas de carro: OSRM. Dados © OpenStreetMap (ODbL).";
const pontosJson = {
  fonte,
  geradoEm: new Date().toISOString().slice(0, 10),
  sede: { nome: "Sede Arremate", bairro: SEDE_BAIRRO, p: pontos[0].p },
  clientes: Object.fromEntries(pontos.slice(1).map((pt) => [pt.id, pt.p])),
  dist: Object.fromEntries(Object.entries(rotas).map(([k, v]) => [k, [v.km, v.min]])),
};
const linhasJson = Object.fromEntries(Object.entries(rotas).map(([k, v]) => [k, v.linha]));
const gravar = (nome, obj) => { const txt = JSON.stringify(obj); fs.writeFileSync(new URL(`../src/dados/${nome}`, import.meta.url), txt); console.log(`  src/dados/${nome}: ${(txt.length / 1024).toFixed(0)} KB`); };
console.log("Pronto:");
gravar("geo-pontos.json", pontosJson);
gravar("geo-linhas.json", linhasJson);
