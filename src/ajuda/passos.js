// Tour guiado da demonstração: passos e a regra de quando ele abre sozinho.
// alvo: seletor CSS, ou "texto:tag:Texto" para achar um botão pelo que está escrito nele.

export const CHAVE_TOUR = "ls-campo:tour-visto";

export const PASSOS = [
  {
    rota: "/agenda", alvo: "[aria-label='Serviços a agendar']",
    titulo: "Pedidos esperando equipe",
    texto: "Estes serviços ainda não têm equipe. Arraste um para a agenda ao lado, ou clique nele e escolha equipe, dia e turno.",
  },
  {
    rota: "/agenda", alvo: "[aria-label='Agenda da semana por equipe'], [aria-label='Dia']",
    titulo: "A semana de cada equipe",
    texto: "Cada equipe tem manhã e tarde em cada dia. O sistema recusa a equipe que não faz aquele serviço e o turno que já está ocupado.",
  },
  {
    rota: "/agenda", alvo: "texto:button:Novo serviço",
    titulo: "Pedido novo",
    texto: "Cadastre o cliente, o tipo de serviço, o prazo e a prioridade. Ele entra na lista para agendar.",
  },
  {
    rota: "/agenda", alvo: "a[href='#/indicadores']",
    titulo: "Indicadores",
    texto: "Serviços no prazo, ocupação das equipes e motivos de reagendamento, calculados da própria agenda.",
  },
  {
    rota: "/agenda", alvo: "texto:button:Ver como equipe",
    titulo: "O lado da equipe",
    texto: "A equipe vê só os serviços dela no celular: inicia e dá o retorno com checklist e fotos.",
  },
  {
    rota: "/agenda", alvo: ".ajuda-botao",
    titulo: "Ficou alguma dúvida?",
    texto: "Pergunte aqui a qualquer momento. Dá para refazer este tour pela Ajuda também.",
  },
];

/** O tour abre sozinho só na primeira visita à Agenda, e nunca em navegador automatizado. Pedido pela pessoa, abre sempre. */
export function deveIniciarTour({ rota, visto, automatizado, pedido }) {
  if (pedido) return true;
  return rota === "/agenda" && !visto && !automatizado;
}
