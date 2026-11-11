import { Cidade, Estabelecimento, CategoriaItem, TagKey } from '../types';

export const TAG_LABELS: Record<TagKey, string> = {
  wifi: "Wi-Fi Gratuito",
  pet: "Pet Friendly",
  estacionamento: "Estacionamento",
  acessivel: "Acessível PWD",
  termais: "Águas Termais",
  kids: "Espaço Kids",
};

export const CIDADES_MOCK: Cidade[] = [
  { id: "1", nome: "Bento Gonçalves", estabelecimentos: 87, emoji: "🍇", descricao: "Capital brasileira da uva e do vinho, lar do famoso Vale dos Vinhedos." },
  { id: "2", nome: "Garibaldi", estabelecimentos: 54, emoji: "🥂", descricao: "Capital do espumante brasileiro com arquitetura histórica encantadora." },
  { id: "3", nome: "Carlos Barbosa", estabelecimentos: 41, emoji: "🌿", descricao: "Conhecida pela tradição italiana, cutelaria e festas gastronômicas." },
  { id: "4", nome: "Cotiporã", estabelecimentos: 28, emoji: "🌄", descricao: "Natureza exuberante, cachoeiras e paisagens do Rio das Antas." },
  { id: "5", nome: "Nova Prata", estabelecimentos: 33, emoji: "🏔️", descricao: "Famosa pelas águas termais relaxantes e turismo ecológico." },
  { id: "6", nome: "Antônio Prado", estabelecimentos: 22, emoji: "⛪", descricao: "A cidade mais italiana do Brasil, com patrimônio tombado pelo IPHAN." },
];

export const CATEGORIAS_MOCK: CategoriaItem[] = [
  { id: "1", label: "Vinícolas", icon: "🍷" },
  { id: "2", label: "Gastronomia", icon: "🍽️" },
  { id: "3", label: "Hospedagem", icon: "🏨" },
  { id: "4", label: "Turismo", icon: "🌿" },
  { id: "5", label: "Eventos", icon: "🎪" },
  { id: "6", label: "Artesanato", icon: "🛍️" },
];

export const HORARIOS_PADRAO_CATEGORIA: Record<string, { dia: string; hora: string }[]> = {
  "Vinícola": [
    { dia: "Segunda a Sexta", hora: "09h00 às 17h30" },
    { dia: "Sábados", hora: "09h00 às 17h00" },
    { dia: "Domingos e Feriados", hora: "10h00 às 16h00" },
  ],
  "Gastronomia": [
    { dia: "Terça a Sexta", hora: "11h30 às 14h30 / 19h00 às 23h00" },
    { dia: "Sábados", hora: "11h30 às 15h30 / 19h00 às 23h30" },
    { dia: "Domingos", hora: "11h30 às 16h00" },
  ],
  "Hospedagem": [
    { dia: "Recepção / Atendimento", hora: "07h00 às 22h00" },
    { dia: "Check-in", hora: "A partir das 14h00" },
    { dia: "Check-out", hora: "Até às 11h00" },
  ],
  "Turismo": [
    { dia: "Terça a Domingo", hora: "09h00 às 18h00" },
    { dia: "Feriados", hora: "09h00 às 17h00" },
  ],
  "Eventos": [
    { dia: "Atendimento Comercial", hora: "09h00 às 18h00" },
    { dia: "Dias de Evento", hora: "Conforme programação" },
  ],
  "Artesanato": [
    { dia: "Segunda a Sábado", hora: "09h00 às 18h00" },
    { dia: "Domingos", hora: "10h00 às 17h00" },
  ],
};

export const ESTABELECIMENTOS_MOCK: Estabelecimento[] = [
  {
    id: "1",
    nome: "Vinícola Bebber",
    categoria: "Vinícola",
    cidade: "Garibaldi",
    avaliacao: 4.8,
    totalAvaliacoes: 127,
    cor: "#7B3F00",
    tags: ["wifi", "estacionamento", "pet"],
    destaque: true,
    sobre: "Vinícola familiar com mais de 80 anos de tradição na produção de vinhos finos da Serra Gaúcha. Oferece degustações guiadas, tours pelos parreirais e gastronomia típica italiana.",
    endereco: "Estrada do Sabor, Linha São José, Garibaldi - RS",
    telefone: "(54) 3462-1234",
    whatsapp: "5554999991234",
    siteUrl: "https://serragaucha.com",
    horarios: [
      { dia: "Seg - Sex", hora: "09h às 18h" },
      { dia: "Sábados", hora: "09h às 17h" },
      { dia: "Domingos", hora: "10h às 15h" },
    ]
  },
  {
    id: "2",
    nome: "Restaurante Farina",
    categoria: "Gastronomia",
    cidade: "Bento Gonçalves",
    avaliacao: 4.6,
    totalAvaliacoes: 94,
    cor: "#1A3A4A",
    tags: ["wifi", "kids", "estacionamento"],
    destaque: true,
    sobre: "Especializado na autêntica galeteria e massas caseiras coloniais preparadas no fogão a lenha, preservando o sabor dos imigrantes italianos.",
    endereco: "Rodovia RS-453, Km 106, Bento Gonçalves - RS",
    telefone: "(54) 3455-5000",
    whatsapp: "5554999995000",
    siteUrl: "https://serragaucha.com",
    horarios: [
      { dia: "Ter - Dom", hora: "11h30 às 15h" },
      { dia: "Sex - Sáb", hora: "19h30 às 22h30" },
    ]
  },
  {
    id: "3",
    nome: "Pousada Vale Verde",
    categoria: "Hospedagem",
    cidade: "Cotiporã",
    avaliacao: 4.9,
    totalAvaliacoes: 82,
    cor: "#1A4A2A",
    tags: ["wifi", "pet", "estacionamento", "acessivel"],
    destaque: true,
    sobre: "Refúgio de tranquilidade no topo da serra, cercado por matas nativas e vinhedos. Café da manhã colonial incluso com produtos artesanais da fazenda.",
    endereco: "Linha América Central, Cotiporã - RS",
    telefone: "(54) 3446-1122",
    whatsapp: "5554999991122",
    siteUrl: "https://serragaucha.com",
    horarios: [
      { dia: "Check-in", hora: "a partir das 14h" },
      { dia: "Check-out", hora: "até as 12h" },
    ]
  },
  {
    id: "4",
    nome: "Cascata dos Calza",
    categoria: "Turismo",
    cidade: "Bento Gonçalves",
    avaliacao: 4.7,
    totalAvaliacoes: 156,
    cor: "#2A3A6A",
    tags: ["pet", "acessivel", "estacionamento"],
    destaque: true,
    sobre: "Queda d'água de 45 metros de altura com trilhas ecológicas estruturadas, mirantes para fotos e área de piquenique sob a sombra de araucárias centenárias.",
    endereco: "Vale Aurora, Bento Gonçalves - RS",
    telefone: "(54) 3452-9988",
    whatsapp: "5554999999988",
    siteUrl: "https://serragaucha.com",
    horarios: [
      { dia: "Todos os dias", hora: "08h às 18h" },
    ]
  },
  {
    id: "5",
    nome: "Cantina Gelain",
    categoria: "Gastronomia",
    cidade: "Carlos Barbosa",
    avaliacao: 4.5,
    totalAvaliacoes: 63,
    cor: "#4A2A1A",
    tags: ["wifi", "kids", "estacionamento"],
    destaque: false,
    sobre: "Ambiente rústico acolhedor com buffet de saladas orgânicas, queijos e embutidos artesanais, polenta na chapa e risotos típicos.",
    endereco: "Linha Doze, Carlos Barbosa - RS",
    telefone: "(54) 3461-3344",
    whatsapp: "5554999993344",
    siteUrl: "https://serragaucha.com",
    horarios: [
      { dia: "Quarta a Domingo", hora: "11h30 às 15h" },
    ]
  },
  {
    id: "6",
    nome: "Termas Caldas de Prata",
    categoria: "Hospedagem",
    cidade: "Nova Prata",
    avaliacao: 4.8,
    totalAvaliacoes: 210,
    cor: "#4A2A6A",
    tags: ["termais", "estacionamento", "acessivel", "wifi"],
    destaque: true,
    sobre: "Complexo hidromineral com piscinas de águas termais a 41°C com propriedades medicinais, spa relaxante e chalés aconchegantes.",
    endereco: "Parque das Águas, Nova Prata - RS",
    telefone: "(54) 3242-7000",
    whatsapp: "5554999997000",
    siteUrl: "https://serragaucha.com",
    horarios: [
      { dia: "Terça a Domingo", hora: "08h30 às 18h30" },
    ]
  }
];
