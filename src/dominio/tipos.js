// Vocabulário do LS Campo: etapas, tipos de serviço, checklists, motivos e transições.

export const ETAPAS = ["novo", "agendado", "execucao", "concluido", "reagendar"];

export const ROTULO_ETAPA = {
  novo: "Novo",
  agendado: "Agendado",
  execucao: "Em execução",
  concluido: "Concluído",
  reagendar: "Reagendar",
};

export const TURNOS = ["manha", "tarde"];
export const ROTULO_TURNO = { manha: "Manhã", tarde: "Tarde", dia: "Dia inteiro" };

export const PRIORIDADES = ["normal", "urgente"];
export const DURACOES = ["turno", "dia"];

const item = (id, texto, obrigatorio = true) => ({ id, texto, obrigatorio });

export const TIPOS = [
  {
    id: "pintura", nome: "Pintura", icone: "PaintRoller",
    checklist: [item("protecao", "Área protegida"), item("preparo", "Superfície preparada"), item("demaos", "Duas demãos aplicadas"), item("limpeza", "Limpeza final"), item("sobra", "Sobra de tinta entregue ao cliente", false)],
  },
  {
    id: "eletrica", nome: "Elétrica predial", icone: "Lightning",
    checklist: [item("desligado", "Circuito desligado e sinalizado"), item("reparo", "Troca ou reparo feito"), item("teste", "Teste de funcionamento"), item("quadro", "Quadro identificado", false)],
  },
  {
    id: "hidraulica", nome: "Hidráulica", icone: "Drop",
    checklist: [item("registro", "Registro fechado"), item("reparo", "Reparo feito"), item("teste", "Teste sem vazamento"), item("limpeza", "Área seca e limpa")],
  },
  {
    id: "impermeabilizacao", nome: "Impermeabilização", icone: "Umbrella",
    checklist: [item("superficie", "Superfície limpa e seca"), item("aplicacao", "Manta ou produto aplicado"), item("estanqueidade", "Teste de estanqueidade"), item("cura", "Prazo de cura informado", false)],
  },
  {
    id: "reparos", nome: "Pequenos reparos", icone: "Wrench",
    checklist: [item("feito", "Serviço feito conforme pedido"), item("limpeza", "Área limpa"), item("conferido", "Cliente conferiu", false)],
  },
];

export const TIPO = Object.fromEntries(TIPOS.map((t) => [t.id, t]));

export const MOTIVOS = [
  { id: "chuva", nome: "Chuva" },
  { id: "ausente", nome: "Cliente ausente" },
  { id: "material", nome: "Falta de material" },
  { id: "acesso", nome: "Acesso não liberado" },
  { id: "maior", nome: "Serviço maior que o previsto" },
];

export const MOTIVO = Object.fromEntries(MOTIVOS.map((m) => [m.id, m]));

/** Transições permitidas: de -> { para: [quem pode] } */
export const TRANSICOES = {
  novo: { agendado: ["planejador"] },
  agendado: { agendado: ["planejador"], novo: ["planejador"], reagendar: ["planejador"], execucao: ["equipe"] },
  execucao: { concluido: ["equipe"], reagendar: ["equipe"] },
  reagendar: { agendado: ["planejador"] },
  concluido: {},
};

export const ESTADOS_ABERTOS = ["novo", "reagendar"];
