// Mapa da rota (MapLibre + estilo Positron do OpenFreeMap). A biblioteca e os traçados das ruas só são baixados
// quando o mapa aparece. A lista ao lado é a versão acessível do mesmo conteúdo (por isso os marcadores ficam fora do Tab).
import { useEffect, useRef, useState } from "react";
import { tracado } from "../../dominio/rotas.js";

const ESTILO = "https://tiles.openfreemap.org/styles/positron";
const reduz = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const TEXTOS = {
  "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para aproximar o mapa",
  "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para aproximar o mapa",
  "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
  "NavigationControl.ZoomIn": "Aproximar", "NavigationControl.ZoomOut": "Afastar",
  "AttributionControl.ToggleAttribution": "Mostrar créditos do mapa", "Map.Title": "Mapa",
};

/** pontos: [{ lugar, p: [lng, lat], rotulo, n }] na ordem da rota (sede no começo e no fim). */
export default function MapaRota({ pontos, selecionado, aoSelecionar }) {
  const caixa = useRef(null);
  const mapa = useRef(null);
  const lib = useRef(null);
  const linhas = useRef(null);
  const marcas = useRef([]);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // Cria o mapa uma vez.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [m, l, w] = await Promise.all([
          import("maplibre-gl"), import("../../dados/geo-linhas.json"),
          import("maplibre-gl/dist/maplibre-gl-worker.mjs?url"), import("maplibre-gl/dist/maplibre-gl.css"),
        ]);
        if (!vivo || !caixa.current) return;
        lib.current = m.default ?? m;
        lib.current.setWorkerUrl(w.default); // o bundle muda o nome dos arquivos: o worker precisa do endereço certo
        linhas.current = l.default ?? l;
        const mp = new lib.current.Map({
          container: caixa.current, style: ESTILO, center: [-38.52, -3.75], zoom: 12,
          attributionControl: { compact: true, customAttribution: "Rotas: OSRM" }, cooperativeGestures: true, locale: TEXTOS,
        });
        mp.addControl(new lib.current.NavigationControl({ showCompass: false }), "top-right");
        mp.once("style.load", () => { // o estilo basta para desenhar; os quadros do mapa chegam depois
          mp.addSource("rota", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          mp.addLayer({ id: "rota-borda", type: "line", source: "rota", paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.95 }, layout: { "line-cap": "round", "line-join": "round" } });
          mp.addLayer({ id: "rota", type: "line", source: "rota", paint: { "line-color": "#B8462A", "line-width": 4.5 }, layout: { "line-cap": "round", "line-join": "round" } });
          if (vivo) setPronto(true);
        });
        mp.on("error", () => { if (vivo && !mp.isStyleLoaded()) setFalhou(true); });
        mapa.current = mp;
      } catch { if (vivo) setFalhou(true); }
    })();
    return () => { vivo = false; marcas.current.forEach((m) => m.remove()); mapa.current?.remove(); mapa.current = null; };
  }, []);

  // Desenha a rota e as paradas sempre que mudam.
  useEffect(() => {
    const mp = mapa.current, ml = lib.current;
    if (!pronto || !mp || !ml) return;
    marcas.current.forEach((m) => m.remove());
    marcas.current = [];
    const coords = [];
    for (let i = 1; i < pontos.length; i++) coords.push(...tracado(linhas.current, pontos[i - 1].lugar, pontos[i].lugar));
    mp.getSource("rota").setData({ type: "FeatureCollection", features: coords.length ? [{ type: "Feature", geometry: { type: "LineString", coordinates: coords } }] : [] });
    // Um marcador por lugar: a sede aparece no começo e no fim, e um cliente pode ter visita de manhã e à tarde ("1·2").
    const porLugar = new Map();
    pontos.forEach((pt, i) => { if (!porLugar.has(pt.lugar)) porLugar.set(pt.lugar, { pt, i, ns: [] }); if (pt.n) porLugar.get(pt.lugar).ns.push(pt.n); });
    porLugar.forEach(({ pt, i, ns }) => {
      const el = document.createElement("button");
      el.type = "button";
      el.tabIndex = -1; // pelo teclado, a lista ao lado faz o mesmo
      el.className = `mapa-parada${pt.lugar === "sede" ? " sede" : ""}`;
      el.textContent = pt.lugar === "sede" ? "S" : ns.join("·");
      el.setAttribute("aria-label", pt.lugar === "sede" ? pt.rotulo : `${ns.join(" e ")}. ${pt.rotulo.replace(/^\d+\. /, "")}`);
      el.addEventListener("click", () => aoSelecionar?.(i));
      marcas.current.push(new ml.Marker({ element: el }).setLngLat(pt.p).addTo(mp));
    });
    if (pontos.length) {
      const b = new ml.LngLatBounds();
      [...coords, ...pontos.map((p) => p.p)].forEach((c) => b.extend(c));
      mp.fitBounds(b, { padding: { top: 48, right: 56, bottom: 64, left: 48 }, maxZoom: 15, duration: reduz() ? 0 : 600 });
    }
  }, [pronto, pontos, aoSelecionar]);

  // Destaca a parada escolhida na lista.
  useEffect(() => {
    if (!pronto || selecionado == null || !pontos[selecionado]) return;
    marcas.current.forEach((m) => m.getElement().classList.remove("ativa"));
    const idx = [...new Set(pontos.map((p) => p.lugar))].indexOf(pontos[selecionado].lugar);
    marcas.current[idx]?.getElement().classList.add("ativa");
    mapa.current.easeTo({ center: pontos[selecionado].p, zoom: Math.max(mapa.current.getZoom(), 14), duration: reduz() ? 0 : 500 });
  }, [selecionado, pronto, pontos]);

  return (
    <div className="mapa-rota" role="region" aria-label="Mapa da rota, o mesmo roteiro da lista">
      <div ref={caixa} className="mapa-caixa" />
      {!pronto && !falhou && <div className="mapa-aviso">Carregando o mapa...</div>}
      {falhou && <div className="mapa-aviso">Não foi possível carregar o mapa agora. A rota está na lista ao lado.</div>}
    </div>
  );
}
