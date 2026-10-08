# Mídia para aprovar

A apresentação já funciona com material gerado do próprio sistema. Os itens abaixo são trocas opcionais que dependem da aprovação do Italo (fonte gratuita, licença livre, sem conta paga).

## 1. Cena presa na rolagem (hoje: agenda da semana se preenchendo)

Ideia original: rolo de pintura cobrindo uma parede, que avança conforme a pessoa rola.

Onde procurar (licença livre, sem precisar dar crédito):
- Pexels: https://www.pexels.com/search/videos/paint%20roller%20wall/
- Mixkit: https://mixkit.co/free-stock-video/paint/

O que precisa ter: câmera parada, fundo limpo, o rolo cobrindo a parede de um lado ao outro, 4 a 8 segundos, 1080p ou mais.

Como trocar depois de escolher: `node ~/.claude/skills/ls-motion/scripts/extrair-quadros.mjs video.mp4 public/seq/parede --quadros 120 --largura 1600 --celular 720` e apontar `CenaAgenda.jsx` para `seq/parede`.

## 2. Antes e depois (hoje: tela de retorno com checklist pendente × pronto)

Ideia original: foto de parede descascada × pintada (mesmo enquadramento).

Onde procurar: https://www.pexels.com/search/before%20after%20painting/ e https://unsplash.com/s/photos/peeling-paint-wall

Precisa: duas fotos do MESMO lugar e enquadramento. Fotos de lugares diferentes não funcionam no comparador.
