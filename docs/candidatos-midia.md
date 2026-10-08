# Mídia para aprovar

A apresentação usa material do próprio sistema e um vídeo livre do Pexels. Os itens abaixo são trocas opcionais que dependem da aprovação do Italo (fonte gratuita, licença livre, sem conta paga).

## 1. Cena presa na rolagem (escolhida)

Close real de uma pistola airless pintando a parede: Pexels, vídeo 6474072 (https://www.pexels.com/video/6474072/), licença do Pexels, cor natural.

Quadros em `public/seq/parede` (150, 1600 px) e `public/seq/parede-celular` (150, recorte vertical de 720 px centrado na pistola). Componente: `src/landing/CenaParede.jsx`.

Para trocar por outro vídeo: `node ~/.claude/skills/ls-motion/scripts/extrair-quadros.mjs video.mp4 public/seq/parede --quadros 150 --largura 1600 --celular 720` (o recorte vertical do celular foi feito à mão com ffmpeg: crop=1215:2160:1000:0) e conferir o poster em `CenaParede.jsx`.

## 2. Antes e depois (hoje: tela de retorno com checklist pendente × pronto)

Ideia original: foto de parede descascada × pintada (mesmo enquadramento).

Onde procurar: https://www.pexels.com/search/before%20after%20painting/ e https://unsplash.com/s/photos/peeling-paint-wall

Precisa: duas fotos do MESMO lugar e enquadramento. Fotos de lugares diferentes não funcionam no comparador.
