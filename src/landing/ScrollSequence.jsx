import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Sequência de imagens guiada pela rolagem (o "efeito café").
 * A seção fica presa na tela e a rolagem escolhe qual quadro aparece no canvas.
 * Quadros: gere com scripts/extrair-quadros.mjs (0001.webp, 0002.webp, ...).
 *
 * <ScrollSequence client:load pasta={`${base}seq/cafe`} quadros={120}
 *   pastaCelular={`${base}seq/cafe-celular`} poster={`${base}seq/cafe/0120.webp`}
 *   alt="Café sendo servido no copo">
 *   <h2>Texto opcional por cima</h2>
 * </ScrollSequence>
 */
export default function ScrollSequence({
  pasta,
  quadros,
  pastaCelular,
  larguraCelular = 768,
  digitos = 4,
  extensao = 'webp',
  rolagem = 2.5, // quantas alturas de tela a sequência dura
  ajuste = 'cover', // 'cover' preenche a tela; 'contain' mostra o quadro inteiro
  ajusteCelular, // encaixe no celular (padrão: o mesmo de ajuste). 'contain' + fundo da cor do vídeo evita cortar a cena
  poster,
  topo = 0, // altura de uma barra fixa no topo: a cena prende logo abaixo dela
  alt = '',
  className = '',
  children,
}) {
  const secao = useRef(null);
  const canvas = useRef(null);
  const [reduz, setReduz] = useState(false);
  const [aj, setAj] = useState(ajuste); // encaixe em uso (troca para o do celular depois de montar)

  useEffect(() => {
    setReduz(matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (ajusteCelular && window.innerWidth <= larguraCelular) setAj(ajusteCelular);
  }, [ajusteCelular, larguraCelular]);

  useEffect(() => {
    if (reduz) return;
    const cv = canvas.current;
    const el = secao.current;
    if (!cv || !el) return;
    const ctx = cv.getContext('2d');
    const base = pastaCelular && window.innerWidth <= larguraCelular ? pastaCelular : pasta;
    const url = (i) => `${base}/${String(i + 1).padStart(digitos, '0')}.${extensao}`;
    const imgs = new Array(quadros);
    const estado = { f: 0 };
    let ultimo = -1;
    // Com 'contain' sobra borda: pinta com a cor de fundo da seção (e cobre o poster que fica por baixo).
    const fundo = getComputedStyle(el).backgroundColor;
    const temFundo = fundo && fundo !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(fundo);

    const pronto = (img) => img && img.complete && img.naturalWidth > 0;
    const desenhar = (alvo) => {
      const i = Math.round(alvo);
      // Se o quadro ainda não chegou, usa o carregado mais próximo (nunca fica em branco).
      let j = i;
      for (let d = 1; !pronto(imgs[j]) && d < quadros; d++) j = pronto(imgs[i - d]) ? i - d : i + d;
      const img = imgs[j];
      if (!pronto(img)) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const s = (aj === 'contain' ? Math.min : Math.max)(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      if (temFundo) { ctx.fillStyle = fundo; ctx.fillRect(0, 0, w, h); } else ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ultimo = j; // o quadro que foi de fato desenhado (pode ser um vizinho enquanto o certo carrega)
    };

    // Ordem de carga: primeiro, último, um a cada 8 e depois o resto. Assim a rolagem já funciona cedo.
    const ordem = [0, quadros - 1];
    for (let i = 8; i < quadros; i += 8) ordem.push(i);
    for (let i = 0; i < quadros; i++) if (!ordem.includes(i)) ordem.push(i);
    ordem.forEach((i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { if (Math.abs(i - estado.f) < Math.abs(ultimo - estado.f) || ultimo < 0) desenhar(estado.f); };
      img.src = url(i);
      imgs[i] = img;
    });

    const tween = gsap.to(estado, {
      f: quadros - 1,
      ease: 'none',
      onUpdate: () => desenhar(estado.f),
      scrollTrigger: { trigger: el, start: `top ${topo}px`, end: `+=${rolagem * 100}%`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
    });
    const ro = new ResizeObserver(() => desenhar(estado.f));
    ro.observe(cv);

    return () => {
      ro.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      imgs.forEach((img) => { if (img) img.onload = null; });
    };
  }, [reduz, pasta, pastaCelular, quadros, digitos, extensao, rolagem, aj, larguraCelular, topo]);

  return (
    <section
      ref={secao}
      className={`seq ${className}`.trim()}
      style={{ position: 'relative', height: topo ? `calc(100dvh - ${topo}px)` : '100dvh', overflow: 'hidden', ...(poster ? { backgroundImage: `url(${poster})`, backgroundPosition: 'center', backgroundSize: aj, backgroundRepeat: 'no-repeat' } : {}) }}
    >
      {reduz ? (
        poster && <img src={poster} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: aj, display: 'block' }} />
      ) : (
        <canvas ref={canvas} role="img" aria-label={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      )}
      {children && <div className="seq-texto" style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>}
    </section>
  );
}
