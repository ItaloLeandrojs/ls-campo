// Assistente de ajuda do LS Campo: base de assuntos e busca sem IA (roda no navegador, sem servidor e sem custo).
// Cada assunto tem palavras-chave (peso maior) e exemplos de pergunta. A busca ignora acento, caixa e pequenos erros de digitação.
// rota: tela da demonstração (#/...). alvo: o que destacar nessa tela. alvoLanding: o que destacar na página de apresentação.

export const ASSUNTOS = [
  {
    id: "o-que-e", titulo: "O que é o LS Campo",
    termos: ["ls campo", "sistema", "serve", "objetivo", "funciona", "sobre"],
    perguntas: ["o que é o ls campo", "para que serve esse sistema", "como funciona"],
    resposta: "É um sistema de planejamento de equipes de manutenção predial: o planejador monta a agenda por equipe, as regras evitam erro de agendamento e a equipe dá o retorno pelo celular, com checklist e foto. A empresa (Arremate) e os dados são fictícios.",
    rota: "/", alvoLanding: ".l-hero",
  },
  {
    id: "abrir-demo", titulo: "Abrir a demonstração",
    termos: ["demonstracao", "demo", "testar", "experimentar", "entrar", "acessar"],
    perguntas: ["como abro a demonstração", "quero testar o sistema", "como entro"],
    resposta: "Abra a demonstração e escolha um papel: planejador (melhor no computador) ou equipe (feito para o celular). Dá para trocar a qualquer momento.",
    rota: "/",
  },
  {
    id: "papeis", titulo: "Planejador e equipe",
    termos: ["planejador", "papel", "papeis", "perfil", "trocar papel", "usuario"],
    perguntas: ["qual a diferença entre planejador e equipe", "como troco de papel"],
    resposta: "O planejador cadastra os pedidos, monta a agenda e acompanha os indicadores. A equipe vê só os próprios serviços do dia, inicia e dá o retorno. No menu do planejador, use \"Ver como equipe\"; na equipe, o botão \"Planejador\" volta.",
    rota: "/",
  },
  {
    id: "agendar", titulo: "Agendar um serviço",
    termos: ["agendar", "agendo", "agendamento", "arrastar", "arrasto", "marcar", "escalar", "distribuir", "atribuir"],
    perguntas: ["como agendo um serviço", "como coloco o pedido para uma equipe", "arrastar serviço para equipe"],
    resposta: "Na Agenda, arraste um serviço da lista \"A agendar\" para o dia e o turno de uma equipe. Se preferir, clique no serviço e escolha equipe, dia e turno. Só aparecem as equipes que fazem aquele tipo de serviço.",
    rota: "/agenda", alvo: "[aria-label='Serviços a agendar']", alvoLanding: ".l-demo",
  },
  {
    id: "regras", titulo: "Por que não deixa agendar",
    termos: ["regra", "regras", "nao deixa", "bloqueia", "nao agendar", "nao aceita", "impede", "erro", "recusa", "permite"],
    perguntas: ["por que não consigo agendar", "não deixa colocar o serviço nessa equipe", "quais as regras da agenda"],
    resposta: "O sistema recusa quando: a equipe não faz aquele tipo de serviço; o turno já está ocupado; o serviço é de dia inteiro e a manhã ou a tarde não estão livres; o dia já passou; ou é domingo (agenda de segunda a sábado). Se passar do prazo, ele agenda, mas avisa.",
    rota: "/agenda", alvo: "[aria-label='Agenda da semana por equipe']",
  },
  {
    id: "desagendar", titulo: "Tirar da agenda",
    termos: ["tirar agenda", "tiro agenda", "tira agenda", "desagendar", "remover agenda", "cancelar agendamento", "devolver", "desfazer"],
    perguntas: ["como tiro um serviço da agenda", "desfazer agendamento"],
    resposta: "Arraste o serviço da agenda de volta para a lista \"A agendar\" (aparece \"Solte aqui para tirar da agenda\"). Ele volta a ficar sem equipe.",
    rota: "/agenda", alvo: "[aria-label='Serviços a agendar']",
  },
  {
    id: "semana", titulo: "Mudar a semana",
    termos: ["semana", "proxima", "anterior", "outro dia", "data", "calendario", "hoje"],
    perguntas: ["ver a próxima semana", "como vejo outro dia"],
    resposta: "Na Agenda, use as setas \"Semana anterior\" e \"Próxima semana\", ou o botão \"Hoje\" para voltar. No celular, toque no dia na faixa de dias.",
    rota: "/agenda", alvo: "[aria-label='Próxima semana']",
  },
  {
    id: "novo-servico", titulo: "Cadastrar um pedido",
    termos: ["novo servico", "cadastrar", "cadastro", "criar", "pedido novo", "abrir chamado", "chamado", "solicitacao", "incluir"],
    perguntas: ["como cadastro um pedido novo", "criar serviço", "abrir um chamado"],
    resposta: "Use o botão \"Novo serviço\" (na Agenda ou em Serviços). Informe cliente, tipo de serviço, prazo, prioridade e duração. Ele entra na lista \"A agendar\".",
    rota: "/servicos/novo",
  },
  {
    id: "filtros", titulo: "Buscar e filtrar serviços",
    termos: ["filtrar", "filtro", "filtros", "buscar servico", "procurar servico", "pesquisar", "lista de servicos"],
    perguntas: ["filtrar serviços por equipe", "como procuro um serviço"],
    resposta: "Em Serviços, busque pelo código ou cliente e filtre por etapa, tipo, equipe e período. \"Limpar filtros\" volta a mostrar tudo.",
    rota: "/servicos", alvo: "[aria-label='Etapa']",
  },
  {
    id: "etapas", titulo: "Etapas do serviço",
    termos: ["etapa", "etapas", "status", "situacao", "significa", "novo", "agendado", "execucao", "concluido", "reagendar"],
    perguntas: ["o que significa reagendar", "quais as etapas de um serviço"],
    resposta: "Novo: ainda sem equipe. Agendado: tem equipe, dia e turno. Em execução: a equipe iniciou. Concluído: a equipe deu o retorno com checklist e fotos. Reagendar: não deu para terminar e volta para o planejador agendar de novo.",
    rota: "/servicos", alvo: "[aria-label='Etapa']",
  },
  {
    id: "ficha", titulo: "Detalhes de um serviço",
    termos: ["ficha", "detalhe", "detalhes", "historico do servico", "abrir servico", "informacoes"],
    perguntas: ["como vejo os detalhes de um serviço", "histórico do serviço"],
    resposta: "Em Serviços, clique no serviço para abrir a ficha: cliente, tipo, prazo, equipe, histórico de etapas e, depois do retorno, o checklist e as fotos.",
    rota: "/servicos", alvo: "[aria-label='Serviços']",
  },
  {
    id: "clientes", titulo: "Clientes",
    termos: ["cliente", "clientes", "condominio", "predio", "empresa cliente"],
    perguntas: ["lista de clientes", "onde vejo os clientes"],
    resposta: "Em Clientes, busque pelo nome e clique para ver a ficha com os serviços de cada um, dos mais recentes para os mais antigos.",
    rota: "/clientes", alvo: "[aria-label='Clientes']",
  },
  {
    id: "equipes", titulo: "Equipes",
    termos: ["equipes", "lider", "lideres", "time", "times", "turma", "funcionarios"],
    perguntas: ["quais equipes existem", "quem é o líder"],
    resposta: "Em Equipes estão as seis equipes da demonstração, com o líder e as especialidades de cada uma.",
    rota: "/equipes",
  },
  {
    id: "especialidades", titulo: "Tipos de serviço",
    termos: ["tipo", "tipos", "especialidade", "especialidades", "pintura", "eletrica", "hidraulica", "impermeabilizacao", "reparos", "fazem"],
    perguntas: ["que tipos de serviço vocês fazem", "quais as especialidades"],
    resposta: "São cinco tipos: Pintura, Elétrica predial, Hidráulica, Impermeabilização e Pequenos reparos. Cada equipe faz alguns deles, e a agenda só aceita a equipe certa.",
    rota: "/equipes",
  },
  {
    id: "indicadores", titulo: "Indicadores",
    termos: ["indicador", "indicadores", "painel", "relatorio", "grafico", "graficos", "dashboard", "numeros", "resultado"],
    perguntas: ["onde vejo os indicadores", "tem relatório"],
    resposta: "Em Indicadores: serviços no prazo por mês, ocupação das equipes, motivos de reagendamento, pedidos por tipo e os clientes que mais pedem. Filtre por período e equipe no topo.",
    rota: "/indicadores", alvo: "[aria-label='Filtros']", alvoLanding: ".l-painel",
  },
  {
    id: "prazo", titulo: "Serviços no prazo",
    termos: ["prazo", "atraso", "atrasado", "pontualidade", "no prazo", "sla"],
    perguntas: ["quantos serviços ficaram no prazo", "serviços atrasados"],
    resposta: "O primeiro gráfico de Indicadores mostra a porcentagem de serviços concluídos até o prazo, mês a mês.",
    rota: "/indicadores", alvo: "[aria-label='Filtros']",
  },
  {
    id: "motivos", titulo: "Motivos de reagendamento",
    termos: ["motivo", "motivos", "reagendamento", "reagendamentos", "chuva", "ausente", "material", "acesso"],
    perguntas: ["quais os motivos de reagendamento", "por que serviços voltam"],
    resposta: "Quando a equipe não termina, ela escolhe o motivo: chuva, cliente ausente, falta de material, acesso não liberado ou serviço maior que o previsto. Em Indicadores dá para ver qual motivo mais acontece.",
    rota: "/indicadores",
  },
  {
    id: "equipe-celular", titulo: "A equipe no celular",
    termos: ["celular", "ver como equipe", "app da equipe", "mobile", "campo", "telefone"],
    perguntas: ["ver como equipe no celular", "como a equipe usa"],
    resposta: "Escolha \"Sou da equipe\" e a sua equipe. A tela mostra os serviços de hoje: iniciar, dar retorno e ver os feitos. Funciona no navegador do celular, sem instalar nada.",
    rota: "/equipe/escolher",
  },
  {
    id: "iniciar", titulo: "Iniciar um serviço",
    termos: ["iniciar", "inicio", "comecar servico", "comecar o servico", "chegar"],
    perguntas: ["como iniciar o serviço", "a equipe chegou no local"],
    resposta: "Na tela da equipe (Hoje), toque em \"Iniciar serviço\" ao chegar. A etapa muda para Em execução e o planejador já vê.",
    rota: "/equipe",
  },
  {
    id: "retorno", titulo: "Dar retorno do serviço",
    termos: ["retorno", "fechar", "finalizar", "concluir", "terminar", "checklist", "foto", "fotos", "enviar retorno", "baixar"],
    perguntas: ["como a equipe fecha um serviço", "dar retorno com foto", "checklist do serviço"],
    resposta: "Na tela da equipe, toque em \"Dar retorno\": marque os itens obrigatórios do checklist, adicione fotos de antes e depois e envie. Se não deu para terminar, escolha o motivo; o serviço volta para o planejador como Reagendar.",
    rota: "/equipe", alvoLanding: ".l-ad",
  },
  {
    id: "feitos", titulo: "Serviços feitos",
    termos: ["feitos", "concluidos", "finalizados", "terminados", "ja fiz"],
    perguntas: ["onde vejo os serviços que a equipe já fez"],
    resposta: "Na tela da equipe, a aba \"Feitos\" lista os serviços concluídos, com o retorno de cada um.",
    rota: "/equipe/feitos",
  },
  {
    id: "cracha", titulo: "Crachá da equipe",
    termos: ["cracha", "identificacao", "cordao"],
    perguntas: ["ver o crachá da equipe"],
    resposta: "Ao escolher a equipe aparece o crachá 3D, que dá para puxar com o mouse ou o dedo. Na tela da equipe, o ícone de crachá no topo mostra de novo.",
    rota: "/equipe/escolher",
  },
  {
    id: "tema", titulo: "Modo escuro",
    termos: ["escuro", "tema", "modo noturno", "dark", "claro", "cores"],
    perguntas: ["tem modo escuro", "trocar o tema"],
    resposta: "Sim. No menu do planejador (embaixo) ou na tela inicial da demonstração, use o botão de tema escuro.",
    rota: "/agenda", alvo: ".lateral-pe",
  },
  {
    id: "recomecar", titulo: "Recomeçar os dados",
    termos: ["recomecar", "resetar", "reset", "apagar", "zerar", "limpar dados", "comecar de novo", "restaurar"],
    perguntas: ["apagar meus dados e começar de novo", "voltar os dados de exemplo"],
    resposta: "Use \"Recomeçar dados\" no menu do planejador (ou \"Recomeçar com os dados de exemplo\" na tela inicial). Tudo volta como era.",
    rota: "/agenda", alvo: ".lateral-pe",
  },
  {
    id: "dados", titulo: "Onde ficam os dados",
    termos: ["salvo", "salvos", "salva", "dados", "armazenamento", "privacidade", "seguro", "servidor", "banco de dados"],
    perguntas: ["onde ficam salvos os dados", "meus dados vão para algum servidor"],
    resposta: "Ficam só neste navegador: nada é enviado para servidor. Os dados são fictícios e você pode recomeçar quando quiser.",
    rota: "/",
  },
  {
    id: "autor", titulo: "Quem fez",
    termos: ["quem fez", "autor", "desenvolvedor", "criador", "italo", "contato", "linkedin"],
    perguntas: ["quem fez esse site", "quem desenvolveu"],
    resposta: "Foi feito por Italo Leandro, como projeto de portfólio. O contato está no rodapé da página de apresentação.",
    alvoLanding: ".l-rodape", rota: "/",
  },
  {
    id: "codigo", titulo: "Código e tecnologia",
    termos: ["codigo", "github", "fonte", "tecnologia", "feito com", "astro", "react", "open source"],
    perguntas: ["onde está o código", "foi feito com o que"],
    resposta: "O código está no GitHub (link \"Código\" no topo da apresentação). Foi feito com Astro e React, e os dados ficam no navegador.",
    link: "https://github.com/ItaloLeandrojs/ls-campo", alvoLanding: ".l-nav",
  },
  {
    id: "telas", titulo: "As três telas",
    termos: ["telas", "fluxo", "como usar", "ajuda"],
    perguntas: ["como funciona o fluxo", "por onde começo"],
    resposta: "O fluxo tem três telas: a Agenda (o planejador distribui os serviços), a tela da equipe (inicia e dá o retorno no celular) e os Indicadores (o resultado). Comece pela Agenda.",
    rota: "/agenda", alvoLanding: ".l-como",
  },
  {
    id: "exportar", titulo: "Exportar os indicadores",
    termos: ["exportar", "excel", "planilha", "xlsx", "pdf", "imprimir", "impressao", "download", "baixar relatorio", "imprimir painel", "exportar indicadores"],
    perguntas: ["como exporto os indicadores para o excel", "baixar relatório em pdf", "imprimir o painel"],
    resposta: "Em Indicadores, \"Baixar Excel\" gera uma planilha com o resumo, uma aba por gráfico e a lista dos serviços concluídos. \"Imprimir ou PDF\" abre a impressão já em A4; escolha \"Salvar como PDF\". Os dois seguem os filtros de período e equipe da tela.",
    rota: "/indicadores", alvo: ".exportar",
  },
  {
    id: "tour", titulo: "Fazer o tour",
    termos: ["tour", "passo a passo", "tutorial", "guia", "apresentacao guiada", "me mostra", "mostrar sistema"],
    perguntas: ["quero fazer o tour", "me mostra o passo a passo do sistema", "tem um tutorial"],
    resposta: "O tour mostra em 6 passos onde fica cada coisa: a lista para agendar, a semana das equipes, o pedido novo, os indicadores e o lado da equipe.",
    rota: "/agenda", tour: true,
  },
];

// Palavras que não ajudam a achar o assunto.
const VAZIAS = new Set(("a o as os um uma uns umas de do da dos das em no na nos nas por para pra pro que se e eu voce voces ele ela " +
  "me meu minha meus minhas seu sua isso esse essa este esta aqui ali la como onde qual quais quando quem porque " +
  "ver vejo posso consigo pode tem ter faz fazer quero queria gostaria saber sobre mais muito tambem ja so ou com sem ao aos " +
  "é e esta estao sao foi ser vai vou fica ficam nesse nessa nesta neste lugar coisa").split(" "));

export const normalizar = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const palavras = (s) => normalizar(s).split(" ").filter((p) => p && !VAZIAS.has(p));

// Distância de edição limitada (para aceitar "indicadroes", "agnda").
function perto(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, dif = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dif > 1) {
      return false;
    }
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else if (a[i + 1] === b[j] && a[i] === b[j + 1]) { i += 2; j += 2; } // letras trocadas
    else { i++; j++; }
  }
  return dif + (a.length - i) + (b.length - j) <= 1;
}

// Duas palavras "batem" se são iguais, se uma é o radical da outra (agendo/agendar) ou se diferem por uma letra.
function bate(a, b) {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5)) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return a.length >= 5 && b.length >= 5 && perto(a, b);
}

// Pré-processa cada assunto: frases-chave (todas as palavras precisam estar na pergunta) e palavras soltas.
const INDICE = ASSUNTOS.map((a) => ({
  assunto: a,
  frases: a.termos.map(palavras).filter((f) => f.length),
  exemplos: [...new Set(a.perguntas.flatMap(palavras))],
}));

// Cada palavra da pergunta conta uma vez só (sinônimos do mesmo assunto não somam), começando pelas frases mais longas.
function pontuar(pal, item) {
  let pts = 0;
  const usadas = new Set();
  for (const frase of [...item.frases].sort((x, y) => y.length - x.length)) {
    if (!frase.every((f) => pal.some((p) => bate(p, f)))) continue;
    const casadas = pal.filter((p) => frase.some((f) => bate(p, f)));
    if (casadas.every((p) => usadas.has(p))) continue;
    pts += 3 * frase.length;
    casadas.forEach((p) => usadas.add(p));
  }
  for (const p of pal) if (!usadas.has(p) && item.exemplos.some((e) => bate(p, e))) pts += 1;
  return pts;
}

/**
 * Reserva para quando nenhum assunto bate: procura a pergunta nos títulos da página.
 * Devolve o índice do título com mais palavras em comum (mínimo 1 palavra de 4 letras ou mais), ou -1.
 */
export function buscarNaPagina(pergunta, textos) {
  const pal = palavras(pergunta).filter((p) => p.length >= 4);
  let melhor = -1, nota = 0;
  textos.forEach((t, i) => {
    const doTitulo = palavras(t);
    const n = pal.filter((p) => doTitulo.some((w) => bate(p, w))).length;
    if (n > nota) { nota = n; melhor = i; }
  });
  return melhor;
}

/**
 * Procura o assunto da pergunta. Devolve { melhor, sugestoes }.
 * melhor é null quando nada bate de verdade; sugestoes traz até 3 assuntos parecidos (ou os mais comuns).
 */
export function responder(pergunta) {
  const pal = palavras(pergunta);
  const comuns = ["agendar", "retorno", "indicadores"].map((id) => ASSUNTOS.find((a) => a.id === id));
  if (!pal.length) return { melhor: null, sugestoes: comuns };
  const notas = INDICE.map((item) => ({ a: item.assunto, n: pontuar(pal, item) }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n);
  const melhor = notas[0] && notas[0].n >= 3 ? notas[0].a : null;
  const resto = notas.filter((x) => x.a !== melhor).slice(0, 3).map((x) => x.a);
  return { melhor, sugestoes: resto.length ? resto : comuns };
}
