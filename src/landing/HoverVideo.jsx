import { useEffect, useRef } from 'react';

/**
 * Card que mostra uma imagem e toca um vídeo mudo ao passar o mouse (ou ao focar pelo teclado).
 * No celular (sem mouse) o vídeo toca quando o card está quase todo na tela.
 * Com "reduzir movimento" fica só a imagem.
 *
 * <HoverVideo client:visible poster={`${base}img/x.webp`} src={`${base}video/x.mp4`} alt="..." href="https://...">
 *   <b>Título</b><span>Descrição</span>
 * </HoverVideo>
 */
export default function HoverVideo({ poster, src, alt = '', href, className = '', proporcao = '16 / 10', children }) {
  const caixa = useRef(null);
  const video = useRef(null);
  const pode = useRef(false);

  useEffect(() => {
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pode.current = !reduz;
    if (reduz || matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // Toque: toca ao aparecer.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tocar() : parar()), { threshold: 0.6 });
    io.observe(caixa.current);
    return () => io.disconnect();
  }, []);

  const tocar = () => { if (pode.current) video.current?.play().catch(() => {}); };
  const parar = () => { const v = video.current; if (v) { v.pause(); v.currentTime = 0; } };

  const Tag = href ? 'a' : 'div';
  return (
    <Tag
      ref={caixa}
      href={href}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener' : undefined}
      className={`hover-video ${className}`.trim()}
      onPointerEnter={tocar}
      onPointerLeave={parar}
      onFocus={tocar}
      onBlur={parar}
    >
      <div className="hover-video__media" style={{ position: 'relative', aspectRatio: proporcao, overflow: 'hidden' }}>
        <video ref={video} muted loop playsInline preload="none" poster={poster} aria-label={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
          <source src={src} type="video/mp4" />
        </video>
      </div>
      {children}
    </Tag>
  );
}
