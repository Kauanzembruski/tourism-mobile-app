import { parseYelp, YelpHours } from './providerValidation';
import { fetchReviewsProxy, reviewsConfigured } from './reviewsProxy';
import { Estabelecimento, YelpBusinessData, YelpReview } from '../types';

/** @deprecated Configure EXPO_PUBLIC_REVIEWS_PROXY_URL instead. */
export const YELP_API_KEY = ""; // Deprecated: private credentials belong on the server.

export function setYelpApiKey(key: string) {
  if (key) throw new Error('Configure o backend de avaliações; credenciais privadas não podem ser usadas no aplicativo.');
}

// Caches em memória para economizar cotas de requisições
const searchCache = new Map<string, string>();
const detailsCache = new Map<string, YelpBusinessData>();

/**
 * Busca o ID de um estabelecimento no Yelp por nome e cidade.
 */
export async function searchYelpBusiness(nome: string, cidade: string): Promise<YelpBusinessData | null> {
  const cacheKey = `${nome.trim().toLowerCase()}_${cidade.trim().toLowerCase()}`;
  if (detailsCache.has(cacheKey)) {
    return detailsCache.get(cacheKey)!;
  }

  if (!reviewsConfigured()) {
    return null;
  }

  try {
    const term = encodeURIComponent(nome);
    const location = encodeURIComponent(`${cidade}, RS, Brazil`);
    const url = `https://api.yelp.com/v3/businesses/search?term=${term}&location=${location}&limit=1`;

    const response = await fetchReviewsProxy(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      
      console.warn('[Yelp API] Serviço indisponível:', response.status);
      return null;
    }

    const data = parseYelp(await response.json());
    if (data.businesses && data.businesses.length > 0) {
      const b = data.businesses[0];
      const businessData: YelpBusinessData = {
        id: b.id,
        nome: b.name,
        avaliacao: b.rating || 0,
        totalAvaliacoes: b.review_count || 0,
        url: b.url,
        imageUrl: b.image_url,
        comentarios: [],
      };

      searchCache.set(cacheKey, b.id);
      detailsCache.set(cacheKey, businessData);
      return businessData;
    }

    return null;
  } catch (error) {
    console.warn('[Yelp API] Erro ao buscar estabelecimento:');
    return null;
  }
}

/**
 * Busca comentários e depoimentos recentes de um estabelecimento no Yelp.
 */
export async function fetchYelpReviews(businessId: string): Promise<YelpReview[]> {
  if (!reviewsConfigured()) {
    return [];
  }

  try {
    const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(businessId)}/reviews?limit=3&sort_by=yelp_sort`;
    const response = await fetchReviewsProxy(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[Yelp API] Serviço indisponível:', response.status);
      return [];
    }

    const data = parseYelp(await response.json());
    return (data.reviews || []).map((rev) => ({
      id: rev.id || '',
      autorNome: rev.user?.name || 'Usuário do Yelp',
      autorFoto: rev.user?.image_url,
      avaliacao: rev.rating ?? 0,
      texto: rev.text || '',
      dataPublicacao: rev.time_created,
      url: rev.url,
    }));
  } catch (error) {
    console.warn('[Yelp API] Erro ao carregar reviews do Yelp:');
    return [];
  }
}

/**
 * Formata os horários do Yelp para o modelo HorarioFuncionamento do app.
 */
function formatYelpHours(hoursData: YelpHours[]): { horarios?: { dia: string; hora: string }[]; isOpenNow?: boolean } {
  if (!hoursData || hoursData.length === 0 || !hoursData[0].open) {
    return {};
  }

  const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const openList = hoursData[0].open;
  
  const horarios = openList.map((h) => {
    const dia = diasSemana[h.day] || "Diariamente";
    const start = h.start ? `${h.start.slice(0, 2)}h${h.start.slice(2)}` : "";
    const end = h.end ? `${h.end.slice(0, 2)}h${h.end.slice(2)}` : "";
    return {
      dia,
      hora: start && end ? `${start} às ${end}` : "Aberto",
    };
  });

  return {
    horarios,
    isOpenNow: hoursData[0].is_open_now,
  };
}

/**
 * Busca detalhes completos do local no Yelp, incluindo horários de funcionamento e fotos.
 */
export async function fetchYelpBusinessDetails(businessId: string): Promise<{
  horarios?: { dia: string; hora: string }[];
  isOpenNow?: boolean;
  phone?: string;
  displayPhone?: string;
  photos?: string[];
} | null> {
  if (!reviewsConfigured()) return null;

  try {
    const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(businessId)}`;
    const response = await fetchReviewsProxy(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;
    const data = parseYelp(await response.json());
    const { horarios, isOpenNow } = formatYelpHours(data.hours || []);

    return {
      horarios,
      isOpenNow,
      phone: data.phone,
      displayPhone: data.display_phone,
      photos: data.photos || [],
    };
  } catch (error) {
    console.warn('[Yelp API] Erro ao buscar detalhes de horários:');
    return null;
  }
}

/**
 * Obtém notas, contagem, comentários e horários de funcionamento em tempo real via Yelp Fusion API.
 * Se não houver chave ou falhar, retorna os dados cadastrados no app com resiliência total.
 */
export async function getLiveYelpRatings(estabelecimento: Estabelecimento): Promise<{
  avaliacao: number;
  totalAvaliacoes: number;
  yelpId?: string;
  yelpUrl?: string;
  reviews: YelpReview[];
  horarios?: { dia: string; hora: string }[];
  isOpenNow?: boolean;
  isYelpData: boolean;
}> {
  let business = null;

  if (estabelecimento.yelpId) {
    business = {
      id: estabelecimento.yelpId,
      nome: estabelecimento.nome,
      avaliacao: estabelecimento.yelpRating || estabelecimento.avaliacao,
      totalAvaliacoes: estabelecimento.yelpReviewCount || estabelecimento.totalAvaliacoes || 0,
      url: estabelecimento.yelpUrl,
      comentarios: [],
    };
  } else {
    business = await searchYelpBusiness(estabelecimento.nome, estabelecimento.cidade);
  }

  if (business && business.avaliacao > 0 && reviewsConfigured()) {
    // Carrega em paralelo os reviews e os horários de funcionamento
    const [reviews, details] = await Promise.all([
      fetchYelpReviews(business.id),
      fetchYelpBusinessDetails(business.id),
    ]);

    return {
      avaliacao: business.avaliacao,
      totalAvaliacoes: business.totalAvaliacoes,
      yelpId: business.id,
      yelpUrl: business.url,
      reviews,
      horarios: details?.horarios && details.horarios.length > 0 ? details.horarios : estabelecimento.horarios,
      isOpenNow: details?.isOpenNow,
      isYelpData: true,
    };
  }

  // Fallback seguro para os dados locais do estabelecimento
  return {
    avaliacao: estabelecimento.avaliacao,
    totalAvaliacoes: estabelecimento.totalAvaliacoes || 0,
    yelpId: estabelecimento.yelpId,
    yelpUrl: estabelecimento.yelpUrl,
    reviews: estabelecimento.yelpReviews || [],
    horarios: estabelecimento.horarios,
    isYelpData: false,
  };
}
