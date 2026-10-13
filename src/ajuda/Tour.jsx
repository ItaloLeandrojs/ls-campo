// Tour guiado da demonstração: escurece a tela, ilumina o elemento de cada passo e mostra um cartão com Pular, Voltar e Próximo.
// Abre sozinho na primeira visita à Agenda; depois, pela Ajuda ("Fazer o tour") ou por #/agenda?tour=1.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { PASSOS, CHAVE_TOUR, deveIniciarTour } from "./passos.js";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const reduz = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const visivel = (el) => el && el.getClientRects().length > 0;
const lerVisto = () => { try { return localStorage.getItem(CHAVE_TOUR) === "1"; } catch { return false; } };
const marcarVisto = () => { try { localStorage.setItem(CHAVE_TOUR, "1"); } catch {} };

function achar(alvo) {
  if (alvo.startsWith("texto:")) {
    const [, tag, texto] = alvo.split(":");
    return [...document.querySelectorAll(tag)].find((el) => visivel(el) && el.textContent.trim().includes(texto)) || null;
  }
  return [...document.querySelectorAll(alvo)].find(visivel) || null;
}

async function prepararAlvo(alvo) {
  let el = null;
  for (let t = 0; t < 2500 && !el; t += 100) {
    el = achar(alvo);
    // O menu aberto no celular esconde coisas (como o botão Ajuda): fecha e procura de novo.
    if (!el && t === 0 && document.querySelector(".veu")) { document.querySelector(".veu").click(); await espera(280); }
    if (!el) await espera(100);
  }
  if (!el) return null;
  const veu = document.querySelector(".veu");
  if (el.getBoundingClientRect().right <= 0) { // no celular o menu do planejador fica escondido: abre
    document.querySelector("[aria-label='Abrir menu']")?.click();
    await espera(320);
  } else if (veu && !el.closest(".lateral")) { // menu aberto cobrindo um alvo que não está nele: fecha
    veu.click();
    await espera(280);
  }
  el.scrollIntoView({ block: "center", behavior: reduz() ? "auto" : "smooth" });
  await espera(reduz() ? 50 : 380);
  return el;
}

export default function Tour() {
  const local = useLocation();
  const navigate = useNavigate();
  const [passo, setPasso] = useState(null);
  const [el, setEl] = useState(null);
  const [trocando, setTrocando] = useState(false); // esconde a luz enquanto procura o elemento do passo
  const [rect, setRect] = useState(null);
  const [posCartao, setPosCartao] = useState({});
  const cartao = useRef(null);
  const proximo = useRef(null);
  const id = useId();

  const iniciar = useCallback(() => {
    if (local.pathname !== "/agenda") navigate("/agenda");
    setPasso(0);
  }, [local.pathname, navigate]);

  const fechar = useCallback(() => {
    marcarVisto();
    setPasso(null); setEl(null); setRect(null);
    document.querySelector(".veu")?.click();
  }, []);

  // Abre sozinho na primeira visita à Agenda, ou quando o endereço pede (?tour=1).
  useEffect(() => {
    if (passo !== null) return;
    const pedido = new URLSearchParams(local.search).has("tour");
    if (!deveIniciarTour({ rota: local.pathname, visto: lerVisto(), automatizado: navigator.webdriver === true, pedido })) return;
    const t = setTimeout(() => {
      if (pedido) navigate("/agenda", { replace: true });
      setPasso(0);
    }, 700);
    return () => clearTimeout(t);
  }, [local.pathname, local.search, passo, navigate]);

  // Pedido pela Ajuda.
  useEffect(() => {
    const f = () => iniciar();
    window.addEventListener("ls-campo:tour", f);
    return () => window.removeEventListener("ls-campo:tour", f);
  }, [iniciar]);

  // Prepara o elemento de cada passo.
  useEffect(() => {
    if (passo === null) return;
    let vivo = true;
    const p = PASSOS[passo];
    setTrocando(true);
    (async () => {
      if (local.pathname !== p.rota) navigate(p.rota);
      const alvo = await prepararAlvo(p.alvo);
      if (!vivo) return;
      if (!alvo) { passo < PASSOS.length - 1 ? setPasso(passo + 1) : fechar(); return; } // sem o elemento, segue
      setEl(alvo);
      requestAnimationFrame(() => vivo && setTrocando(false));
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  // Acompanha o elemento quando a página rola ou muda de tamanho.
  useEffect(() => {
    if (!el) return;
    let quadro = 0;
    const medir = () => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(() => setRect(el.getBoundingClientRect())); };
    medir();
    window.addEventListener("scroll", medir, true);
    window.addEventListener("resize", medir);
    return () => { cancelAnimationFrame(quadro); window.removeEventListener("scroll", medir, true); window.removeEventListener("resize", medir); };
  }, [el]);

  // Posiciona o cartão: no computador, abaixo ou acima do elemento; no celular, no topo ou no pé da tela.
  useLayoutEffect(() => {
    if (!rect || !cartao.current) return;
    const c = cartao.current.getBoundingClientRect();
    const m = 16, folga = 14;
    if (innerWidth <= 640) {
      setPosCartao(rect.top + rect.height / 2 > innerHeight / 2 ? { top: m, left: 12, right: 12 } : { bottom: m, left: 12, right: 12 });
      return;
    }
    const prende = (v, min, max) => Math.min(Math.max(v, min), max);
    const vTop = prende(rect.top, m, innerHeight - c.height - m);
    if (rect.bottom + folga + c.height <= innerHeight - m) { // cabe abaixo
      setPosCartao({ top: rect.bottom + folga, left: prende(rect.left, m, innerWidth - c.width - m) });
    } else if (rect.top - folga - c.height >= m) { // cabe acima
      setPosCartao({ top: rect.top - folga - c.height, left: prende(rect.left, m, innerWidth - c.width - m) });
    } else if (rect.right + folga + c.width <= innerWidth - m) { // elemento alto: ao lado direito
      setPosCartao({ top: vTop, left: rect.right + folga });
    } else if (rect.left - folga - c.width >= m) { // ou ao lado esquerdo
      setPosCartao({ top: vTop, left: rect.left - folga - c.width });
    } else { // elemento enorme: no canto de baixo, por dentro dele
      setPosCartao({ top: innerHeight - c.height - m, left: prende(rect.left + m, m, innerWidth - c.width - m) });
    }
  }, [rect]);

  useEffect(() => { if (rect) proximo.current?.focus({ preventScroll: true }); }, [passo, rect === null]);

  useEffect(() => {
    if (passo === null) return;
    const tecla = (e) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight") setPasso((p) => (p < PASSOS.length - 1 ? p + 1 : p));
      if (e.key === "ArrowLeft") setPasso((p) => (p > 0 ? p - 1 : p));
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [passo, fechar]);

  if (passo === null || !rect) return null;
  const p = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;
  const pad = 6;

  return (
    <div className="tour">
      <div className={`tour-luz${trocando ? " trocando" : ""}`} style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} aria-hidden="true" />
      <section ref={cartao} className="tour-cartao" style={posCartao} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
        <small className="tour-conta">Passo {passo + 1} de {PASSOS.length}</small>
        <b id={`${id}-t`}>{p.titulo}</b>
        <p id={`${id}-d`}>{p.texto}</p>
        <div className="tour-botoes">
          <button type="button" className="tour-pular" onClick={fechar}>Pular</button>
          <span>
            {passo > 0 && <button type="button" className="tour-voltar" onClick={() => setPasso(passo - 1)}>Voltar</button>}
            <button ref={proximo} type="button" className="tour-proximo" onClick={() => (ultimo ? fechar() : setPasso(passo + 1))}>{ultimo ? "Concluir" : "Próximo"}</button>
          </span>
        </div>
      </section>
    </div>
  );
}
