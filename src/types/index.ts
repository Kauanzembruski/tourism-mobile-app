import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
export type CategoriaType = 
  | "Vinícola" 
  | "Gastronomia" 
  | "Hospedagem" 
  | "Turismo" 
  | "Eventos" 
  | "Artesanato" 
  | "Todos";

export type TagKey = "wifi" | "pet" | "estacionamento" | "acessivel" | "termais" | "kids";

export interface Cidade {
  id: string | number;
  nome: string;
  uf?: string;
  estabelecimentos?: number;
  emoji?: string;
  imagemUrl?: string;
  descricao?: string;
}

export interface HorarioFuncionamento {
  dia: string;
  hora: string;
}

export interface YelpReview {
  id: string;
  autorNome: string;
  autorFoto?: string;
  avaliacao: number;
  texto: string;
  dataPublicacao?: string;
  url?: string;
}

export interface YelpBusinessData {
  id: string;
  nome: string;
  avaliacao: number;
  totalAvaliacoes: number;
  url?: string;
  imageUrl?: string;
  comentarios: YelpReview[];
}

export interface GoogleReview {
  autorNome: string;
  autorFoto?: string;
  avaliacao: number;
  texto: string;
  tempoRelativo?: string;
  dataPublicacao?: string;
}

export interface GooglePlaceData {
  placeId: string;
  nome?: string;
  avaliacao: number;
  totalAvaliacoes: number;
  googleMapsUri?: string;
  comentarios: GoogleReview[];
}

export interface Estabelecimento {
  id: string | number;
  nome: string;
  categoria: CategoriaType;
  cidade: string;
  cidadeId?: string;
  avaliacao: number;
  totalAvaliacoes?: number;
  yelpId?: string;
  yelpRating?: number;
  yelpReviewCount?: number;
  yelpReviews?: YelpReview[];
  yelpUrl?: string;
  googlePlaceId?: string;
  googleRating?: number;
  googleUserRatingCount?: number;
  googleReviews?: GoogleReview[];
  googleMapsUrl?: string;
  cor?: string;
  imagemUrl?: string;
  logoUrl?: string;
  tags?: TagKey[];
  sobre?: string;
  endereco?: string;
  telefone?: string;
  whatsapp?: string;
  siteUrl?: string;
  destaque?: boolean;
  horarios?: HorarioFuncionamento[];
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
}

export interface Noticia {
  id: number;
  cidade: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  cover: string | null;
  status: "draft" | "scheduled" | "published";
  published_at: string | null;
  featured: boolean;
}

export interface HorarioSemanal {
  id: number;
  day_of_week: number; // 0=Segunda ... 6=Domingo, 7=Feriados
  morning_start: string | null;
  morning_end: string | null;
  afternoon_start: string | null;
  afternoon_end: string | null;
  evening_start: string | null;
  evening_end: string | null;
  notes: string | null;
  instituicao: string;
}

export interface ExcecaoAbertura {
  id: number;
  date: string;
  shift: "M" | "T" | "N" | null;
  reason: string | null;
  instituicao: string;
}

export interface Experiencia {
  id: string;
  nome_evento: string | null;
  categoria: string;
  descricao: string;
  descricao_completa?: string;
  custo?: string | null;
  local?: string;
  duracao_minutos?: number;
  numero_pessoas?: number;
  instituicao: string;
}

export interface CategoriaItem {
  id: string;
  label: string;
  icon: string;
}

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Detalhes: { estabelecimento: Estabelecimento };
  Cidades: undefined;
  ListaPorCidade: { cidadeNome: string };
  NoticiaDetalhe: { noticia: Noticia };
  MomentoScreen: { filtroInicial?: 'todos' | 'saindo_do_forno' | 'apenas_abertos' };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MomentoTab: { filtroInicial?: 'todos' | 'saindo_do_forno' | 'apenas_abertos' } | undefined;
  BuscarTab: { categoriaInicial?: CategoriaType } | undefined;
  CidadesTab: undefined;
  FavoritosTab: undefined;
};


export type AppNavigation = CompositeNavigationProp<NativeStackNavigationProp<RootStackParamList>, BottomTabNavigationProp<MainTabParamList>>;
