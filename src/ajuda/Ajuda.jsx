// Assistente de ajuda: botão no canto da tela que responde perguntas sobre o LS Campo e leva até o lugar certo.
// Sem IA paga e sem servidor: a busca está em base.js. onde = "landing" (apresentação) ou "app" (demonstração).
import { useEffect, useId, useRef, useState } from "react";
import { Question, X, ArrowRight, Crosshair, ArrowSquareOut, PaperPlaneRight } from "@phosphor-icons/react";
import { responder, buscarNaPagina } from "./base.js";
import "../styles/ajuda.css";

const SUGESTOES = ["Como agendo um serviço?", "Como a equipe fecha um serviço?", "Onde vejo os indicadores?", "Por que não deixa agendar?"];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const reduz = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const telaPequena = () => matchMedia("(max-width: 640px)").matches;
const rotaAtual = () => (location.hash.replace(/^#/, "").split("?")[0] || "/");

// Espera o elemento aparecer (a tela pode estar trocando de rota).
async function acharElemento(seletor, ms = 2500) {
  for (let t = 0; t < ms; t += 100) {
    const el = typeof seletor === "string" ? document.querySelector(seletor) : seletor;
    if (el) return el;
    await espera(100);
  }
  return null;
}

/** Rola até o elemento e destaca com um contorno por alguns segundos. */
async function destacar(seletor) {
  const el = await acharElemento(seletor);
  if (!el) return false;
  // No celular, o menu do planejador fica escondido à esquerda: abre antes.
  if (el.getBoundingClientRect().right <= 0) {
    document.querySelector("[aria-label='Abrir menu']")?.click();
    await espera(320);
  }
  el.scrollIntoView({ block: "center", behavior: reduz() ? "auto" : "smooth" });
  el.classList.remove("ajuda-destaque");
  void el.offsetWidth; // reinicia a animação se a pessoa pedir de novo
  el.classList.add("ajuda-destaque");
  setTimeout(() => el.classList.remove("ajuda-destaque"), 2800);
  return true;
}

function titulosDaPagina() {
  return [...document.querySelectorAll("main h1, main h2, main h3, main [aria-label]")]
    .filter((el) => !el.closest(".ajuda") && el.getClientRects().length);
}

export default function Ajuda({ onde = "app", base = "/" }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [conversa, setConversa] = useState([]);
  const idTitulo = useId();
  const botao = useRef(null);
  const campo = useRef(null);
  const lista = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    campo.current?.focus();
    const tecla = (e) => { if (e.key === "Escape") fechar(); };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto]);

  useEffect(() => { lista.current?.lastElementChild?.scrollIntoView({ block: "nearest" }); }, [conversa]);

  // Quando a tela muda, os botões das respostas trocam ("Ir para lá" vira "Mostrar onde").
  const [, setRota] = useState("");
  useEffect(() => {
    const f = () => setRota(location.hash);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);

  function fechar() { setAberto(false); botao.current?.focus(); }

  function perguntar(p) {
    const pergunta = p.trim();
    if (!pergunta) return;
    const r = responder(pergunta);
    let naPagina = null;
    if (!r.melhor) {
      const els = titulosDaPagina();
      const i = buscarNaPagina(pergunta, els.map((el) => el.getAttribute("aria-label") || el.textContent));
      if (i >= 0) naPagina = { el: els[i], titulo: (els[i].getAttribute("aria-label") || els[i].textContent).trim().slice(0, 60) };
    }
    setConversa((c) => [...c.slice(-6), { id: Date.now(), pergunta, ...r, naPagina }]);
    setTexto("");
  }

  async function irPara(a) {
    if (telaPequena()) setAberto(false);
    if (onde === "landing") { location.href = `${base}app/#${a.rota}`; return; }
    if (a.rota && rotaAtual() !== a.rota) location.hash = a.rota;
    if (a.alvo) await destacar(a.alvo);
  }

  async function mostrar(alvo) {
    if (telaPequena()) setAberto(false);
    await destacar(alvo);
  }

  function acoes(a) {
    const botoes = [];
    if (onde === "landing") {
      if (a.alvoLanding) botoes.push(<button key="m" type="button" className="ajuda-acao" onClick={() => mostrar(a.alvoLanding)}><Crosshair size={16} /> Mostrar onde</button>);
      if (a.rota) botoes.push(<button key="i" type="button" className="ajuda-acao ajuda-acao-forte" onClick={() => irPara(a)}>Abrir na demonstração <ArrowRight size={16} /></button>);
    } else if (a.rota) {
      const aqui = rotaAtual() === a.rota;
      if (aqui && a.alvo) botoes.push(<button key="m" type="button" className="ajuda-acao ajuda-acao-forte" onClick={() => mostrar(a.alvo)}><Crosshair size={16} /> Mostrar onde</button>);
      if (!aqui) botoes.push(<button key="i" type="button" className="ajuda-acao ajuda-acao-forte" onClick={() => irPara(a)}>Ir para lá <ArrowRight size={16} /></button>);
    }
    if (a.tour) {
      if (onde === "landing") botoes.splice(0, botoes.length, <a key="t" className="ajuda-acao ajuda-acao-forte" href={`${base}app/#/agenda?tour=1`}>Fazer o tour <ArrowRight size={16} /></a>);
      else botoes.splice(0, botoes.length, <button key="t" type="button" className="ajuda-acao ajuda-acao-forte" onClick={() => { fechar(); window.dispatchEvent(new Event("ls-campo:tour")); }}>Fazer o tour <ArrowRight size={16} /></button>);
    }
    if (a.link) botoes.push(<a key="l" className="ajuda-acao" href={a.link} target="_blank" rel="noopener">Abrir <ArrowSquareOut size={16} /></a>);
    return botoes.length ? <div className="ajuda-acoes">{botoes}</div> : null;
  }

  const chips = (itens, aoEscolher) => (
    <div className="ajuda-chips">
      {itens.map((t) => <button key={t} type="button" className="ajuda-chip" onClick={() => aoEscolher(t)}>{t}</button>)}
    </div>
  );

  return (
    <div className="ajuda" data-onde={onde}>
      {aberto && (
        <section className="ajuda-painel" role="dialog" aria-modal="false" aria-labelledby={idTitulo}>
          <header className="ajuda-topo">
            <b id={idTitulo}>Ajuda do LS Campo</b>
            <button type="button" className="ajuda-fechar" aria-label="Fechar ajuda" onClick={fechar}><X size={18} /></button>
          </header>
          <div className="ajuda-corpo" ref={lista} aria-live="polite">
            {conversa.length === 0 && (
              <div className="ajuda-boas-vindas">
                <p>Pergunte como fazer algo no sistema. Eu explico e levo você até o lugar certo.</p>
                {chips(SUGESTOES, perguntar)}
              </div>
            )}
            {conversa.map((m) => (
              <div key={m.id} className="ajuda-troca">
                <p className="ajuda-pergunta">{m.pergunta}</p>
                {m.melhor ? (
                  <div className="ajuda-resposta">
                    <b>{m.melhor.titulo}</b>
                    <p>{m.melhor.resposta}</p>
                    {acoes(m.melhor)}
                  </div>
                ) : (
                  <div className="ajuda-resposta">
                    {m.naPagina ? (
                      <>
                        <p>Achei nesta página: <b>{m.naPagina.titulo}</b></p>
                        <div className="ajuda-acoes"><button type="button" className="ajuda-acao ajuda-acao-forte" onClick={() => mostrar(m.naPagina.el)}><Crosshair size={16} /> Mostrar onde</button></div>
                      </>
                    ) : <p>Não achei isso por aqui. Talvez seja um destes:</p>}
                    {chips(m.sugestoes.map((s) => s.titulo), perguntar)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form className="ajuda-form" onSubmit={(e) => { e.preventDefault(); perguntar(texto); }}>
            <label className="sr-only" htmlFor={`${idTitulo}-campo`}>Sua pergunta</label>
            <input id={`${idTitulo}-campo`} ref={campo} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pergunte sobre o LS Campo" autoComplete="off" maxLength={200} />
            <button type="submit" className="ajuda-enviar" aria-label="Perguntar" disabled={!texto.trim()}><PaperPlaneRight size={18} weight="fill" /></button>
          </form>
        </section>
      )}
      <button ref={botao} type="button" className="ajuda-botao" aria-expanded={aberto} onClick={() => (aberto ? fechar() : setAberto(true))}>
        {aberto ? <X size={20} /> : <Question size={20} weight="bold" />}
        <span>{aberto ? "Fechar" : "Ajuda"}</span>
      </button>
    </div>
  );
}
