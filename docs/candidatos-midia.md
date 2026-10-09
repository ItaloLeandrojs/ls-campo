# Mídia para aprovar

A apresentação usa material do próprio sistema e um vídeo gerado com IA. Os itens abaixo são trocas opcionais que dependem da aprovação do Italo.

## 1. Cena presa na rolagem (escolhida)

"Anatomia de uma parede", no estilo de comercial de produto: estúdio escuro, uma parede de blocos flutuando recebe reboco e depois tinta terracota.

Como foi feito no Google Flow, em 2 etapas, para a parede não mudar de forma:
1. Três imagens no Nano Banana (0 crédito): blocos, rebocada e pintada. A segunda nasce da primeira, e a terceira da segunda, para manter a mesma forma.
2. Etapa 1 (blocos > reboco): Veo 3.1 Fast, modo Frames com início e fim. O prompt descreve a borda do reboco como uma linha fina e limpa, rente à parede, sem sombra.
3. Etapa 2 (reboco > tinta): Veo 3.1 Fast, começando do último quadro real da etapa 1 (salvo no próprio Flow), com o mesmo tipo de borda.
4. Cada etapa foi cortada no fim da varredura (o Veo faz um ajuste de tom depois de uns 5 s) e as duas foram emendadas com ffmpeg, sem o quadro repetido. Vídeo em 720p nativo, sem a ampliação "Aprimorada", que criava textura falsa.

Versões anteriores: a de uma etapa só juntava as duas camadas de blocos numa só e "pulava" para a imagem final; a de 1080p ampliada tinha textura falsa ("ondinhas") e uma borda escura na varredura.

Quadros: 168 em `public/seq/parede` (1280 px com as bordas esfumadas, 7,5 MB; a cena não passa de 1280 px de largura para não esticar) e 168 em `public/seq/parede-celular` (640x720 com as bordas esfumadas, 4,3 MB). Componente: `src/landing/CenaParede.jsx`. A seção da cena é a única escura do site.

## 2. Antes e depois (hoje: tela de retorno com checklist pendente × pronto)

Ideia original: foto de parede descascada × pintada (mesmo enquadramento).

Onde procurar: https://www.pexels.com/search/before%20after%20painting/ e https://unsplash.com/s/photos/peeling-paint-wall

Precisa: duas fotos do MESMO lugar e enquadramento. Fotos de lugares diferentes não funcionam no comparador.
