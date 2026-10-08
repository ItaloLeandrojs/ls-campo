#!/usr/bin/env node
// Procura termos proibidos (lista fora do repositório) no código-fonte e no build.
import fs from "node:fs";
import path from "node:path";

const LISTA = path.resolve("..", "ls-campo-termos-proibidos.txt");
if (!fs.existsSync(LISTA)) { console.error(`Lista de termos não encontrada em ${LISTA}. Crie o arquivo (um termo por linha).`); process.exit(1); }
const termos = fs.readFileSync(LISTA, "utf8").split(/\r?\n/).map(t => t.trim()).filter(Boolean);
const pastas = ["src", "public", "dist", "tests", "e2e"].filter(p => fs.existsSync(p));
const extensoes = /\.(astro|jsx?|mjs|css|html|json|md|txt|svg)$/i;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regras = termos.map(t => ({ t, re: new RegExp(`(?<![\\p{L}\\p{N}])${esc(t)}(?![\\p{L}\\p{N}])`, "u") }));
let achados = 0;
function varrer(dir) {
  for (const nome of fs.readdirSync(dir)) {
    const p = path.join(dir, nome);
    const st = fs.statSync(p);
    if (st.isDirectory()) { varrer(p); continue; }
    if (!extensoes.test(nome) || st.size > 3e6) continue;
    fs.readFileSync(p, "utf8").split("\n").forEach((linha, i) => {
      for (const { t, re } of regras) if (re.test(linha)) { achados++; console.log(`${p}:${i + 1}: termo proibido "${t}"`); }
    });
  }
}
pastas.forEach(varrer);
console.log(achados ? `\n${achados} ocorrência(s).` : `Nenhum termo proibido (${termos.length} termos, pastas: ${pastas.join(", ")}).`);
process.exit(achados ? 1 : 0);
