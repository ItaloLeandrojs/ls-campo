// Tempo da abertura: os tijolos se montam em ciclos de 1,75 s e a parede fica completa entre 1,015 s e 1,54 s de cada ciclo.
// A abertura dura no mínimo 1,5 s e só sai com a parede completa, para nunca sumir no meio da montagem.
export const CICLO = 1750;
export const PAREDE = [1015, 1540];

/** Quantos ms ainda esperar, sabendo há quantos ms a animação começou e que a página já está pronta. */
export function esperaParaSair({ agora, minimo = 1500, ciclo = CICLO, janela = PAREDE }) {
  const alvo = Math.max(agora, minimo);
  const fase = alvo % ciclo;
  if (fase >= janela[0] && fase <= janela[1]) return alvo - agora;
  const inicioCiclo = alvo - fase;
  return (fase < janela[0] ? inicioCiclo : inicioCiclo + ciclo) + janela[0] - agora;
}
