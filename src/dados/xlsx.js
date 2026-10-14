// Gerador de planilha .xlsx (Office Open XML) sem biblioteca de Excel: monta os XML e compacta com fflate.
// Abas: { nome, colunas: [{ titulo, tipo: "texto"|"numero"|"pct"|"data", largura }], linhas: [[valor | { valor, tipo }]] }.
// Cabeçalho destacado e fixo, filtro nas colunas, % com uma casa e datas dd/mm/aaaa.
import { zipSync, strToU8 } from "fflate";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Nome de aba: até 31 caracteres, sem : \ / ? * [ ] < >.
const nomeAba = (n) => String(n).replace(/[:\\/?*[\]<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 31) || "Aba";

function coluna(i) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

// Dias desde 30/12/1899, como o Excel guarda datas.
const serial = (iso) => {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
};

// Estilos (posições em cellXfs): 0 normal, 1 cabeçalho, 2 número, 3 porcentagem, 4 data, 5 texto quebrando linha.
const ESTILO = { texto: 0, cabecalho: 1, numero: 2, pct: 3, data: 4 };

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="0.0%"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFB8462A"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function celula(ref, valor, tipo) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (tipo === "texto") return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
  if (tipo === "data") return `<c r="${ref}" s="${ESTILO.data}"><v>${serial(valor)}</v></c>`;
  const n = Number(valor);
  if (!Number.isFinite(n)) return `<c r="${ref}" t="inlineStr"><is><t>${esc(valor)}</t></is></c>`;
  return `<c r="${ref}" s="${ESTILO[tipo] ?? ESTILO.numero}"><v>${n}</v></c>`;
}

function planilha({ colunas, linhas }) {
  const ultima = coluna(colunas.length - 1);
  const total = linhas.length + 1;
  const cols = colunas.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.largura ?? Math.max(10, c.titulo.length + 4)}" customWidth="1"/>`).join("");
  const cab = `<row r="1">${colunas.map((c, i) => `<c r="${coluna(i)}1" t="inlineStr" s="${ESTILO.cabecalho}"><is><t>${esc(c.titulo)}</t></is></c>`).join("")}</row>`;
  const corpo = linhas.map((l, j) => {
    const r = j + 2;
    const cel = colunas.map((c, i) => {
      const x = l[i];
      const obj = x !== null && typeof x === "object";
      return celula(`${coluna(i)}${r}`, obj ? x.valor : x, obj ? x.tipo : c.tipo);
    }).join("");
    return `<row r="${r}">${cel}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="A1:${ultima}${total}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>${cab}${corpo}</sheetData>
<autoFilter ref="A1:${ultima}${total}"/>
</worksheet>`;
}

/** Devolve o arquivo .xlsx (Uint8Array) com uma aba por item de `abas`. */
export function gerarXlsx(abas) {
  const usados = new Set();
  const nomes = abas.map((a) => {
    let n = nomeAba(a.nome), k = 2;
    while (usados.has(n.toLowerCase())) n = `${nomeAba(a.nome).slice(0, 28)} ${k++}`;
    usados.add(n.toLowerCase());
    return n;
  });
  const arquivos = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${nomes.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
<definedNames>${abas.map((a, i) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${esc(nomes[i]).replace(/'/g, "''")}'!$A$1:$${coluna(a.colunas.length - 1)}$${a.linhas.length + 1}</definedName>`).join("")}</definedNames>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": STYLES,
  };
  abas.forEach((a, i) => { arquivos[`xl/worksheets/sheet${i + 1}.xml`] = planilha(a); });
  return zipSync(Object.fromEntries(Object.entries(arquivos).map(([k, v]) => [k, strToU8(v)])), { level: 6 });
}
