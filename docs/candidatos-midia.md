# Mídia para aprovar

A apresentação usa material do próprio sistema e um vídeo gerado com IA. Os itens abaixo são trocas opcionais que dependem da aprovação do Italo.

## 1. Cena presa na rolagem (escolhida)

"Anatomia de uma parede", no estilo de comercial de produto: estúdio escuro, uma parede de blocos flutuando recebe reboco e depois tinta terracota.

Como foi feito no Google Flow, em 2 etapas, para a parede não mudar de forma:
1. Três imagens no Nano Banana (0 crédito): blocos, rebocada e pintada. A segunda nasce da primeira, e a terceira da segunda, para manter a mesma forma.
2. Etapa 1 (blocos > reboco): Veo 3.1 Quality, modo Frames com início e fim, varredura limpa da esquerda para a direita.
3. Etapa 2 (reboco > tinta): Veo 3.1 Fast, porque a versão Quality pôs um rolo de pintura flutuando.
4. Download em "1080p Aprimorada" e emenda das duas etapas com ffmpeg (sem salto, conferido quadro a quadro).

Erros da versão anterior, de uma etapa só: a parede tinha duas camadas de blocos e uma sumia no meio, e o modo início e fim do Veo "pulava" para a imagem final nos últimos quadros.

Quadros: 168 em `public/seq/parede` (1600 px, 7,4 MB) e 168 em `public/seq/parede-celular` (640x720 com as bordas esfumadas, 4,6 MB). Componente: `src/landing/CenaParede.jsx`. A seção da cena é a única escura do site.

## 2. Antes e depois (hoje: tela de retorno com checklist pendente × pronto)

Ideia original: foto de parede descascada × pintada (mesmo enquadramento).

Onde procurar: https://www.pexels.com/search/before%20after%20painting/ e https://unsplash.com/s/photos/peeling-paint-wall

Precisa: duas fotos do MESMO lugar e enquadramento. Fotos de lugares diferentes não funcionam no comparador.
