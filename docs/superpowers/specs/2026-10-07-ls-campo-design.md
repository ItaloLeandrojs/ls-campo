# LS Campo: especificação

Data: 07/10/2026. Autor do produto: Italo Leandro. Status: aprovada em 07/10/2026.

## 1. Objetivo

Criar o **LS Campo**, mais uma peça de portfólio: um sistema de demonstração de planejamento de equipes de **manutenção predial**, feito do zero, com cenário, vocabulário, fluxo, telas e código próprios.

**Sucesso significa:**
- Um recrutador entende em 30 segundos que o Italo planeja equipes de campo e mede resultado.
- A demonstração funciona sozinha (sem login, sem servidor) no computador e no celular.
- Todo número exibido é calculado a partir dos dados, nada fixo.

## 2. Restrições

**Termos e estruturas proibidos:** a lista fica num arquivo local fora do repositório (`../ls-campo-termos-proibidos.txt`, um termo por linha) e é verificada por script no código e no build. Nenhuma linha de código de outros projetos do autor é reaproveitada.

**Cenário:** empresa fictícia **Arremate Serviços Prediais**, em Fortaleza, atendendo condomínios, lojas, escritórios e clínicas (nomes inventados, bairros reais). Rodapé e página de apresentação dizem: "Demonstração com empresa e dados fictícios. Projeto de portfólio de Italo Leandro."

**Pilha:** Astro + React (caminho A: apresentação em Astro, sistema como um app React só em `/app`). Português. Skills de referência: taste-skill + ls-motion.

## 3. Arquitetura

```
/                 apresentação (Astro, estática, escura)
/app/             app React (client:only), roteamento interno
  /app/                escolha de papel
  /app/agenda          planejador (inicial)
  /app/servicos        lista + filtros; /app/servicos/:id ficha
  /app/servicos/novo   cadastro
  /app/clientes        lista; /app/clientes/:id ficha
  /app/equipes         equipes e especialidades
  /app/indicadores     painel
  /app/equipe          equipe: Hoje (celular)
  /app/equipe/servico/:id   detalhe + retorno
  /app/equipe/feitos   histórico da equipe
```

- GitHub Pages publica o build em `https://italoleandrojs.github.io/ls-campo/` (base `/ls-campo/`). Pages não tem regra de reescrita: o build copia `app/index.html` para `404.html` e o app lê a rota do endereço, ou usa rotas com `#` se o 404 não funcionar bem (decidir no plano, com teste).
- Roteamento: React Router com base `/ls-campo/app`.
- Estado: **Zustand** com `persist` em localStorage (chave versionada `ls-campo:dados:v1`). Fotos em **IndexedDB** (`idb-keyval`), guardadas por id; o serviço guarda só os ids.
- Arrastar: **dnd-kit** (mouse, toque e teclado).
- Ícones: Phosphor (`@phosphor-icons/react`), um peso só.
- Gráficos: SVG próprio (sem biblioteca), seguindo a skill dataviz.
- Movimento: GSAP/ScrollTrigger na apresentação (componentes da ls-motion). No app, Motion (`motion/react`) para mola e números, View Transitions API para troca de tela, SVG para traços; detalhes na seção 5b. Nada se mexe com "reduzir movimento".
- 3D (só o crachá da equipe, carregado sob demanda): three, @react-three/fiber, @react-three/drei, @react-three/rapier, meshline.
- Testes: **Vitest** (regras e cálculos), **Playwright** com Edge (fluxos), `ls-motion/scripts/testar.mjs` (visual).

Módulos (cada um com uma responsabilidade e testável sozinho):

| Módulo | Faz | Depende de |
|---|---|---|
| `dominio/tipos.js` | Tipos de serviço, checklists, motivos, etapas, transições permitidas | nada |
| `dominio/regras.js` | `podeAgendar(servico, equipe, data, turno, estado)` com motivo da recusa; `transicionar(servico, para, dados)` | tipos |
| `dominio/indicadores.js` | Funções puras que calculam cada indicador para um período/equipe | tipos |
| `dados/semente.js` | Gera os dados de exemplo a partir de hoje, com gerador pseudoaleatório de semente fixa | tipos, regras |
| `dados/loja.js` | Zustand: estado, ações (agendar, mover, desagendar, iniciar, retornar, reagendar, criar), persistência, recomeçar | regras, semente |
| `dados/fotos.js` | Reduz imagem (lado maior 1280 px, JPEG 0,72) e guarda/lê no IndexedDB | idb-keyval |
| `telas/*` | Uma pasta por tela | loja, dominio |
| `ui/*` | Botão, campo, diálogo, selo de etapa, ficha lateral, gráfico de barras | nada |

## 4. Dados

**Cliente:** `id`, `nome` (ex.: "Condomínio Vila Sabiá"), `tipo` (condomínio, loja, escritório, clínica), `bairro`, `endereco` (rua e número inventados), `contato` (nome inventado), `telefone` (formato `(85) 9xxxx-xxxx`, inventado).

**Equipe:** `id`, `nome` (Aroeira, Cajueiro, Carnaúba, Ipê, Jatobá, Mandacaru), `lider` (nome inventado), `especialidades` (subconjunto dos tipos), `cor` (só para identificação na linha, sempre com o nome).

**Tipos de serviço:** Pintura, Elétrica predial, Hidráulica, Impermeabilização, Pequenos reparos. Cada tipo tem um checklist (itens obrigatórios marcados com *):
- Pintura: área protegida*, superfície preparada*, duas demãos*, limpeza final*, sobra de tinta entregue ao cliente.
- Elétrica predial: circuito desligado e sinalizado*, troca ou reparo feito*, teste de funcionamento*, quadro identificado.
- Hidráulica: registro fechado*, reparo feito*, teste sem vazamento*, área seca e limpa*.
- Impermeabilização: superfície limpa e seca*, manta ou produto aplicado*, teste de estanqueidade*, prazo de cura informado.
- Pequenos reparos: serviço feito conforme pedido*, área limpa*, cliente conferiu.

**Serviço:** `id` (`SV-0001`…), `clienteId`, `tipo`, `descricao`, `prioridade` (normal | urgente), `prazo` (data), `duracao` (turno | dia), `etapa`, `agendamento` (`{ equipeId, data, turno: manha | tarde | dia }` ou nulo), `criadoEm`, `historico[]` (`{ em, de, para, por: planejador | equipe, motivo?, agendamento? }`), `retorno` (`{ resultado, checklist{}, fotosAntes[], fotosDepois[], observacao, iniciadoEm, concluidoEm }`).

**Etapas e transições:**

| De | Para | Quem | Condição |
|---|---|---|---|
| Novo | Agendado | planejador | `podeAgendar` ok |
| Agendado | Agendado (mover) | planejador | `podeAgendar` ok no novo lugar |
| Agendado | Novo | planejador | desagendar (volta para a lista) |
| Agendado | Reagendar | planejador | motivo obrigatório; libera o turno |
| Agendado | Em execução | equipe | só no dia agendado |
| Em execução | Concluído | equipe | itens obrigatórios do checklist marcados |
| Em execução | Reagendar | equipe | motivo obrigatório; libera o turno |
| Reagendar | Agendado | planejador | `podeAgendar` ok |

Concluído é final. Toda transição entra no `historico`.

**Motivos de reagendamento:** chuva, cliente ausente, falta de material, acesso não liberado, serviço maior que o previsto.

**Regras de agendamento (`podeAgendar`), cada recusa com frase explicativa:**
1. Dia passado: "Não dá para agendar em dia que já passou."
2. Domingo: fora da grade (segunda a sábado).
3. Turno ocupado: "A equipe Ipê já tem serviço nesta manhã."
4. Duração dia exige manhã e tarde livres: "Serviço de dia inteiro precisa da manhã e da tarde livres."
5. Especialidade: **bloqueia**. "A equipe Jatobá não faz impermeabilização."
6. Prazo estourado: **permite**, com aviso amarelo "Fica depois do prazo (dd/mm)".

**Dados de exemplo (semente fixa, datas relativas a hoje):**
- 6 equipes, 30 clientes, cerca de 140 serviços.
- **Últimos 3 meses:** quase todos concluídos.
  - A taxa no prazo varia por mês (cerca de 78%, 84% e 89%), para o gráfico ter história.
  - Cerca de 12% dos serviços passam por um reagendamento antes de concluir, com motivos distribuídos (chuva mais comum entre março e maio).
- **Semana atual:**
  - dias anteriores concluídos ou reagendados;
  - hoje com alguns serviços Agendados e 1 Em execução para a equipe Aroeira;
  - restante da semana entre 60% e 75% ocupado.
- **Próxima semana:** cerca de 30% ocupada.
- **Lista "A agendar":** cerca de 10 serviços Novos ou de Reagendar, 2 urgentes.
- **Fotos de exemplo:** os serviços concluídos não têm fotos (sem imagens de terceiros). As fotos aparecem quando a pessoa testa o retorno.

## 5. Telas

**Entrada (`/app/`):**
- Dois cartões: "Sou planejador" (computador) e "Sou da equipe" (celular), com uma frase cada sobre o que fazem.
- Link "Recomeçar com os dados de exemplo".
- Aviso: "Demonstração: os dados ficam salvos só neste navegador."

**Topo do app:** marca LS Campo · Arremate, troca de papel, tema claro/escuro, ajuda curta (o que dá para testar).

**Agenda (planejador):**
- Cabeçalho com a semana (anterior, hoje, próxima) e um resumo: agendados, a agendar, ocupação da semana.
- Lista **A agendar** à esquerda (ordem: urgente primeiro, depois prazo mais próximo; filtro por tipo).
- **Grade:**
  - linhas são as equipes (nome, líder, especialidades, barra de ocupação da semana);
  - colunas vão de segunda a sábado, cada uma com caixinhas Manhã e Tarde;
  - hoje fica destacado e os dias passados ficam mais apagados, só leitura.
- **Card de serviço:** código, cliente, tipo (ícone e nome), selo de etapa com nome, marca "urgente" e aviso de prazo.
- **Arrastar:**
  - durante o arraste, as caixinhas mostram se aceitam;
  - ao soltar em lugar inválido aparece a frase da regra;
  - dia inteiro ocupa manhã e tarde.
- **Alternativa sem arrastar:** menu do card, "Agendar…" (diálogo com equipe, dia e turno, mostrando só as opções válidas).
- Abaixo de 1024 px a grade vira **lista por dia** com o mesmo diálogo.
- Clicar no card abre a **ficha lateral**: dados, cliente, histórico em linha do tempo e ações permitidas pela etapa.

**Serviços:**
- Tabela com filtros: etapa, tipo, equipe, cliente, período e busca.
- Botão "Novo serviço": formulário com cliente, tipo, descrição, prioridade, prazo e duração. Validação inline, rótulo em cima e erro embaixo.
- A ficha `/app/servicos/:id` é a mesma da ficha lateral, em página.

**Clientes:** lista com busca. A ficha mostra os dados e os serviços do cliente, com indicador de prazo cumprido.

**Equipes:** cartões com líder, especialidades, ocupação da semana e serviços concluídos no mês.

**Indicadores:**
- Filtros: período (mês atual ou últimos 3 meses) e equipe (todas ou uma).
- **Cartões no topo:**
  - serviços concluídos;
  - % no prazo;
  - ocupação média;
  - reagendamentos.
- **Gráficos:**
  1. % no prazo por mês, em barras, com a linha da meta de 85% rotulada;
  2. ocupação por equipe, em barras horizontais com o valor escrito;
  3. motivos de reagendamento, em ranking de barras horizontais;
  4. serviços por tipo, em barras, ao lado da lista dos 5 clientes que mais pedem.
- Cada gráfico tem título que diz a conclusão (ex.: "Prazo melhorou nos últimos 3 meses") quando os dados permitem, e tabela acessível escondida para leitores de tela.

**Fórmulas:**
- **Concluídos:** serviços com `concluidoEm` no período.
- **% no prazo:** concluídos com `concluidoEm` até o `prazo` (inclusive), divididos pelos concluídos do período.
- **Ocupação:** turnos reservados no período (todo agendamento registrado no histórico, inclusive os depois reagendados), divididos por (equipes × dias úteis de segunda a sábado × 2). O período considerado vai só até hoje.
- **Reagendamentos:** eventos do histórico com `para: Reagendar` no período, agrupados por motivo.
- **Por tipo e por cliente:** serviços criados no período.

**Equipe (celular):**
- Na primeira entrada, escolha "Qual é a sua equipe?" (pode trocar depois).
- **Hoje:** serviços da manhã e da tarde com cliente, bairro, endereço, tipo, descrição, prazo e urgente. Botões "Iniciar" (só no dia) e "Dar retorno" (depois de iniciar).
- **Retorno, em uma tela rolável:**
  - resultado (Concluído ou Reagendar);
  - se Reagendar: motivo (obrigatório) e observação;
  - se Concluído: checklist do tipo (obrigatórios destacados), fotos de antes e depois (até 4 cada, câmera ou galeria, reduzidas antes de salvar, com miniaturas e botão de remover) e observação.
  - O botão "Enviar retorno" só fica ativo quando os obrigatórios estão completos; a mensagem diz o que falta.
- **Feitos:** últimos serviços da equipe com resultado e data.
- O app de equipe usa botões grandes (alvo ≥ 44 px), contraste alto (tela no sol) e funciona com uma mão.

**Estados:** cada lista tem estado vazio com orientação ("Nada a agendar. Crie um serviço em Serviços > Novo"), carregamento em esqueleto e erro (ex.: falha ao salvar foto: "Não foi possível guardar a foto neste navegador. Tente uma imagem menor").

## 5b. Movimento e interações no app (aprovados em 07/10/2026)

Todos têm versão sem movimento ("reduzir movimento": troca instantânea, sem quique, sem traço) e nenhum bloqueia o uso.

- **Entrada por cartões com transição para a tela.** "Sou planejador" e "Sou da equipe". Ao escolher, o cartão se expande e vira a tela seguinte (View Transitions API do navegador, com `view-transition-name` no cartão e no cabeçalho da tela; sem suporte, troca normal). O mesmo recurso faz o card do serviço "voar" da agenda ou da lista para a ficha.
- **Crachá 3D na entrada da equipe (Lanyard, React Bits):**
  - depois de escolher a equipe, aparece o crachá pendurado no cordão, com nome da equipe, líder e marca Arremate, e dá para puxar com o dedo ou o mouse;
  - botão "Entrar" sempre visível; o crachá não é obrigatório;
  - **carregamento só sob demanda** (import dinâmico depois do toque em "Sou da equipe"): three, @react-three/fiber, @react-three/drei, @react-three/rapier, meshline, `card.glb` e `lanyard.png` do repositório do React Bits;
  - frente do crachá gerada num canvas com os dados da equipe;
  - **alternativa parada** (crachá em HTML/CSS) quando: "reduzir movimento", sem WebGL, `navigator.connection.saveData`, ou memória do aparelho ≤ 2 GB (`navigator.deviceMemory`);
  - aparece só na primeira entrada de cada equipe; depois, ícone "ver crachá" no topo.
- **Encaixe com mola na agenda:**
  - ao soltar em lugar válido, o card encaixa com mola curta (Motion, `stiffness 400`, `damping 28`) e a barra de ocupação da equipe enche até o novo valor;
  - em lugar inválido, o card treme (3 oscilações de 6 px, 300 ms), volta para a origem e a frase da regra aparece.
- **Carimbo de concluído:**
  - ao enviar retorno Concluído, um círculo e um ✓ se desenham (SVG com `stroke-dashoffset`, 600 ms) com a palavra "Concluído";
  - vibração curta (`navigator.vibrate(30)`) onde houver suporte;
  - Reagendar mostra um aviso neutro, sem comemoração.
- **Gráficos que se desenham:** ao entrar na tela de indicadores (ou mudar filtro), as barras crescem da base (400 ms, escalonadas em 40 ms), a linha da meta se traça e os números dos cartões contam (Count Up). Mudança de filtro anima do valor anterior para o novo.

## 6. Página de apresentação (`/`)

Escura, marca LS, acento azul, Roboto Flex. Usa ls-motion. Orçamento de movimento: a cena da parede é o único efeito preso na rolagem; mini-demo e antes/depois são interativos (a pessoa aciona); o painel de embarque é o único movimento automático depois do topo. Uma seção calma separa cada efeito.

1. **Topo:**
   - título "Planejamento de equipes de manutenção, do pedido ao retorno." (no máximo 2 linhas);
   - subtítulo de até 20 palavras;
   - um botão, "Abrir a demonstração";
   - print real da agenda (capturado do app pronto).
2. **Mini-demo "Experimente":**
   - grade pequena com 3 equipes × 3 dias, uma lista com 3 serviços e a instrução "Arraste um serviço para uma equipe";
   - usa as mesmas regras do app (`podeAgendar`), então uma das equipes recusa por especialidade, para mostrar a regra;
   - ao agendar os 3, aparece "É assim o dia todo. Abrir a demonstração completa";
   - funciona no toque e no teclado; sem estado guardado (recarregou, recomeça).
3. **Cena da parede (ScrollSequence):**
   - vídeo gratuito (Pexels ou Mixkit) de rolo de pintura cobrindo uma parede, cortado em cerca de 120 quadros, com versão de celular;
   - três frases surgem em momentos da rolagem: "O pedido chega.", "A equipe certa, no turno certo." e "Retorno com foto e checklist.";
   - com "reduzir movimento", imagem parada e as três frases visíveis;
   - **o vídeo só é baixado depois que o Italo aprovar o arquivo** (nome, origem, tamanho e licença). Se não houver vídeo adequado, a seção vira uma composição com prints do sistema, e o Italo é avisado.
4. **Como funciona:**
   - três cartões HoverVideo (Agenda, Equipe no celular, Indicadores);
   - cada vídeo tem 6 a 10 s e é gravado do próprio app com Playwright;
   - o layout é assimétrico, não três cards iguais.
5. **Antes e depois:**
   - duas fotos sobrepostas do mesmo ambiente (parede descascada e pintada, ou banheiro antes e depois), com uma barra vertical para arrastar (mouse, toque e setas do teclado, `role="slider"` com valor em %);
   - legenda: "O retorno da equipe guarda o antes e o depois de cada serviço.";
   - **fotos de banco gratuito, só depois que o Italo aprovar** (origem, licença, tamanho). Precisa ser o mesmo enquadramento nas duas; se não houver par adequado, a seção sai e o Italo é avisado.
6. **Painel de embarque (Split-Flap, React Bits):**
   - substitui o Count Up nesta página;
   - três linhas que giram uma vez quando o painel entra na tela: "HOJE 18 SERVIÇOS", "6 EQUIPES EM CAMPO", "94% NO PRAZO";
   - valores calculados dos dados de exemplo no build;
   - com "reduzir movimento", texto parado.
7. **Rodapé:** aviso de demonstração fictícia, link do LinkedIn do Italo e link da Vitrine.

## 7. Visual do app

- Tema **claro por padrão**, com botão para escuro (preferência guardada).
- Tokens próprios, mesma marca LS:
  - acento azul (`#2F62D6` no claro, `#5B8CF0` no escuro);
  - neutros frios;
  - cores de etapa sempre acompanhadas do nome: Novo cinza, Agendado azul, Em execução âmbar, Concluído verde, Reagendar vermelho.
- **Cantos:** cards com 12 px, botões e selos em pílula.
- **Fonte:** Roboto Flex; números em Roboto Mono com algarismos tabulares.
- Layout, navegação (menu lateral do planejador e abas da equipe) e telas próprias.
- Sem travessão em nenhum texto.

## 8. Acessibilidade

- Tudo funciona pelo teclado: arrastar via dnd-kit com teclado, diálogo "Agendar…" e foco visível.
- Rótulos nos campos, contraste AA, `aria-live` nos avisos de regra.
- Gráficos com tabela alternativa e "reduzir movimento" respeitado.

## 9. Testes

- **Vitest:**
  - todas as regras de `podeAgendar` (cada recusa e o aviso de prazo);
  - todas as transições permitidas e negadas;
  - cada fórmula de indicador com dados pequenos montados à mão;
  - a semente gera sempre os mesmos dados para a mesma data;
  - nenhum turno com dois serviços nos dados de exemplo.
- **Playwright (Edge):**
  1. entrar como planejador, arrastar um serviço de "A agendar" para uma caixinha livre e ver a etapa virar Agendado;
  2. tentar soltar em turno ocupado ou em equipe sem a especialidade e ver a frase da regra;
  3. agendar pelo teclado e pelo diálogo;
  4. trocar para equipe Aroeira, iniciar o serviço de hoje, dar retorno Concluído com checklist e uma foto (arquivo de teste), voltar ao planejador e ver o serviço Concluído e o indicador atualizado;
  5. retorno Reagendar com motivo e ver o serviço voltar para "A agendar";
  6. recomeçar dados;
  7. mini-demo da apresentação: agendar os 3 serviços e ver a recusa por especialidade;
  8. antes e depois: arrastar a barra e usar as setas do teclado;
  9. crachá: com "reduzir movimento" aparece a versão parada, e o botão "Entrar" funciona sem o 3D carregar;
  10. carimbo e transições não aparecem com "reduzir movimento" e o fluxo continua igual.
- **Peso:** a primeira visita à apresentação e ao `/app/` não baixa nada de three/rapier (conferir pelas requisições no Playwright).
- **Visual:** `ls-motion/scripts/testar.mjs` na apresentação e nas telas principais, em computador, celular e "reduzir movimento".
- **Busca de termos proibidos** no código e no build, com a lista do arquivo local (`../ls-campo-termos-proibidos.txt`): precisa dar zero. Sem o arquivo, o script avisa e falha.

## 10. Publicação

1. Repositório novo **público** `ItaloLeandrojs/ls-campo` (GitHub Pages gratuito exige repositório público), com o código-fonte.
2. Publicação pelo GitHub Pages, de uma pasta ou branch com o build (definir no plano: GitHub Actions oficial do Astro ou branch `gh-pages`).
3. Enquanto o Italo não revisar, o site pode ficar no ar, mas **sem divulgação**: nada no LinkedIn nem na Vitrine até o OK dele. Com `noindex` até a aprovação.
4. Com o OK: tirar o `noindex`, criar o projeto e o "Em destaque" do LS Campo no LinkedIn (com confirmação a cada alteração) e o card na Vitrine.

## 11. Fora do escopo

Login real, banco de dados, vários usuários simultâneos, notificações, mapa, exportação de arquivos, portal do cliente, orçamento, versão em inglês.

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Vocabulário indesejado | Lista de termos proibidos verificada por script; revisão do Italo antes de divulgar |
| Fotos estourarem o armazenamento | IndexedDB, redução para 1280 px, limite de 4 + 4 por serviço, mensagem de erro clara |
| Não achar vídeo bom de parede | Alternativa definida (composição com prints) e aviso ao Italo |
| Arrastar ruim no celular | Abaixo de 1024 px, agenda em lista com diálogo; dnd-kit com sensor de toque |
| Crachá 3D pesar no celular (cerca de 1,5 a 2,5 MB entre three, física e modelo) | Só carrega depois do toque em "Sou da equipe"; alternativa parada para aparelho fraco, economia de dados, sem WebGL ou reduzir movimento; botão "Entrar" sempre visível |
| Apresentação com efeito demais | Orçamento da seção 6: um único efeito preso na rolagem, interativos acionados pela pessoa, seções calmas entre eles; revisão pelos prints da ls-motion |
| View Transitions sem suporte (Firefox antigo) | Detectar `document.startViewTransition`; sem suporte, troca normal |
| Dados de exemplo "estranhos" (datas, finais de semana) | Semente testada; nada no domingo; datas relativas a hoje |
