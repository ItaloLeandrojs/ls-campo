// Nomes inventados para a demonstração (empresa Arremate Serviços Prediais, Fortaleza).
// Bairros são reais; prédios, empresas, ruas, pessoas e telefones são fictícios.

export const EQUIPES = [
  { id: "aroeira", nome: "Aroeira", lider: "Raimundo Sales", especialidades: ["pintura", "reparos"] },
  { id: "cajueiro", nome: "Cajueiro", lider: "Antônia Freitas", especialidades: ["eletrica", "reparos"] },
  { id: "carnauba", nome: "Carnaúba", lider: "Edson Moura", especialidades: ["hidraulica", "impermeabilizacao"] },
  { id: "ipe", nome: "Ipê", lider: "Rosana Lopes", especialidades: ["pintura", "impermeabilizacao"] },
  { id: "jatoba", nome: "Jatobá", lider: "Cláudio Bezerra", especialidades: ["hidraulica", "reparos"] },
  { id: "mandacaru", nome: "Mandacaru", lider: "Wellington Paiva", especialidades: ["eletrica", "pintura"] },
];

export const BAIRROS = ["Aldeota", "Meireles", "Cocó", "Dionísio Torres", "Fátima", "Benfica", "Parquelândia", "Varjota", "Papicu", "Edson Queiroz", "Messejana", "Montese", "Joaquim Távora", "Praia de Iracema", "Guararapes"];

export const RUAS = ["Rua das Acácias", "Rua dos Ipês", "Rua Flor de Liz", "Rua Sabiá-Laranjeira", "Rua das Jandaias", "Avenida das Palmeiras Altas", "Rua Cajarana", "Rua Juazeiro Verde", "Rua Pau-Branco", "Rua Graviola", "Rua Bem-te-vi", "Travessa Mangabeira", "Rua das Carnaubeiras", "Rua Galo-de-Campina", "Rua Jacarandá"];

export const CLIENTES_BASE = [
  ["Condomínio Vila Sabiá", "condominio"], ["Residencial Bem-te-vi", "condominio"], ["Edifício Graúna", "condominio"],
  ["Condomínio Jardim Ipueira", "condominio"], ["Residencial Asa Branca", "condominio"], ["Edifício Mirante da Jandaia", "condominio"],
  ["Condomínio Recanto das Carnaubeiras", "condominio"], ["Residencial Brisa Mansa", "condominio"], ["Edifício Solar do Juazeiro", "condominio"],
  ["Condomínio Parque das Jacarandás", "condominio"], ["Residencial Vento Leste", "condominio"], ["Edifício Torre Galo-de-Campina", "condominio"],
  ["Padaria Trigo de Ouro", "loja"], ["Ótica Olhar Atento", "loja"], ["Farmácia Bem Cuidar", "loja"], ["Livraria Página Viva", "loja"],
  ["Loja Casa & Fio", "loja"], ["Sorveteria Gelo Doce", "loja"], ["Pet Shop Rabo Feliz", "loja"], ["Mercadinho Cesta Cheia", "loja"],
  ["Escritório Nunes Prado Advocacia", "escritorio"], ["Contabilidade Soma Certa", "escritorio"], ["Estúdio Traço Arquitetura", "escritorio"],
  ["Agência Ponto Alto", "escritorio"], ["Coworking Mesa Comum", "escritorio"],
  ["Clínica Sorriso Pleno", "clinica"], ["Clínica Movimento Fisioterapia", "clinica"], ["Laboratório Gota Clara", "clinica"],
  ["Clínica Olhos do Sertão", "clinica"], ["Consultório Pele Viva", "clinica"],
];

export const CONTATOS = ["Marta Rolim", "Jorge Alencar", "Luciana Teles", "Paulo Holanda", "Fernanda Arruda", "Sérgio Castelo", "Ana Paula Viana", "Rogério Fontenele", "Denise Sampaio", "Marcos Bastos", "Patrícia Brígido", "Hélio Cavalcante", "Socorro Matos", "Tiago Benevides", "Juliana Pinheiro"];

export const DESCRICOES = {
  pintura: ["Pintar hall de entrada", "Repintar muro da garagem", "Pintura da escada de serviço", "Retocar pintura da fachada lateral", "Pintar sala de reunião", "Pintura das vagas da garagem", "Repintar portão e grades", "Pintar corredor do 3º andar"],
  eletrica: ["Trocar disjuntores do quadro do térreo", "Instalar luminárias de LED na garagem", "Revisar tomadas da recepção", "Corrigir iluminação da escada", "Instalar ponto de tomada para geladeira", "Trocar interfone da portaria", "Revisar fiação do salão de festas"],
  hidraulica: ["Consertar vazamento na pia da copa", "Trocar registro do banheiro social", "Desentupir ralo da área de serviço", "Trocar torneira da cozinha", "Revisar bomba da caixa d'água", "Consertar descarga do banheiro", "Trocar sifão do lavatório"],
  impermeabilizacao: ["Impermeabilizar laje da cobertura", "Tratar infiltração na parede do salão", "Impermeabilizar floreira da fachada", "Refazer impermeabilização do reservatório", "Tratar infiltração no teto da garagem"],
  reparos: ["Trocar fechadura da porta dos fundos", "Fixar prateleiras no depósito", "Regular portas de armário", "Trocar rodapé danificado", "Instalar suporte de TV na recepção", "Consertar maçaneta da sala 204", "Trocar piso solto do corredor"],
};
