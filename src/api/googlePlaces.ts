import { parseGoogle } from './providerValidation';
import { fetchReviewsProxy, reviewsConfigured } from './reviewsProxy';
import { Estabelecimento, GooglePlaceData, GoogleReview } from '../types';

/** @deprecated Configure EXPO_PUBLIC_REVIEWS_PROXY_URL instead. */
export const GOOGLE_PLACES_API_KEY = ""; // Deprecated: private credentials belong on the server.

export function setGooglePlacesApiKey(key: string) {
  if (key) throw new Error('Configure o backend de avaliações; credenciais privadas não podem ser usadas no aplicativo.');
}

// Caches em memória para economizar chamadas de API e evitar cobranças desnecessárias
const searchCache = new Map<string, string>();
const detailsCache = new Map<string, GooglePlaceData>();

/**
 * Busca o Place ID do Google para um estabelecimento usando o nome e cidade.
 */
export async function searchGooglePlaceId(nome: string, cidade: string): Promise<string | null> {
  const cacheKey = `${nome.trim().toLowerCase()}_${cidade.trim().toLowerCase()}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  if (!reviewsConfigured()) {
    return null;
  }

  try {
    const textQuery = `${nome}, ${cidade}, RS, Brasil`;
    const response = await fetchReviewsProxy('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.id,places.displayName',
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'pt-BR',
        maxResultCount: 1,
      }),
    });

    if (!response.ok) {
      console.warn('[Google Places] Serviço indisponível:', response.status);

      // Se for 403 ou erro na New API, tenta fallback para a Places API legada
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(textQuery)}&inputtype=textquery&fields=place_id,name`;
        const legacyRes = await fetchReviewsProxy(legacyUrl);
        const legacyData = parseGoogle(await legacyRes.json());
        if (legacyData.candidates && legacyData.candidates.length > 0) {
          const legacyPlaceId = legacyData.candidates[0].place_id;
          searchCache.set(cacheKey, legacyPlaceId);
          return legacyPlaceId;
        }
      } catch { }

      return null;
    }

    const data = parseGoogle(await response.json());
    if (data.places && data.places.length > 0) {
      const placeId = data.places[0].id;
      searchCache.set(cacheKey, placeId);
      return placeId;
    }

    return null;
  } catch (error) {
    console.warn('[Google Places] Erro na busca do Place ID:');
    return null;
  }
}

/**
 * Busca os detalhes do local (nota média, total de avaliações, comentários recentes e link do mapa).
 */
export async function fetchGooglePlaceDetails(placeId: string): Promise<GooglePlaceData | null> {
  if (detailsCache.has(placeId)) {
    return detailsCache.get(placeId)!;
  }

  if (!reviewsConfigured()) {
    return null;
  }

  try {
    const response = await fetchReviewsProxy(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews,googleMapsUri',
      },
    });

    if (!response.ok) {
      console.warn('[Google Places] Serviço indisponível:', response.status);

      // Fallback para legacy Place Details
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,user_ratings_total,reviews,url&language=pt-BR`;
        const legacyRes = await fetchReviewsProxy(legacyUrl);
        const legacyData = parseGoogle(await legacyRes.json());
        if (legacyData.result) {
          const r = legacyData.result;
          const comentarios: GoogleReview[] = (r.reviews || []).map((rev) => ({
            autorNome: rev.author_name || 'Usuário do Google',
            autorFoto: rev.profile_photo_url,
            avaliacao: rev.rating ?? 0,
            texto: typeof rev.text === 'string' ? rev.text : '',
            tempoRelativo: rev.relative_time_description || '',
            dataPublicacao: rev.time ? new Date(rev.time * 1000).toISOString() : undefined,
          }));

          const result: GooglePlaceData = {
            placeId,
            nome: r.name,
            avaliacao: r.rating || 0,
            totalAvaliacoes: r.user_ratings_total || 0,
            googleMapsUri: r.url,
            comentarios,
          };
          detailsCache.set(placeId, result);
          return result;
        }
      } catch { }

      return null;
    }

    const data = parseGoogle(await response.json());

    const comentarios: GoogleReview[] = (data.reviews || []).map((rev) => ({
      autorNome: rev.authorAttribution?.displayName || 'Usuário do Google',
      autorFoto: rev.authorAttribution?.photoUri,
      avaliacao: rev.rating ?? 0,
      texto: (typeof rev.text === 'object' ? rev.text?.text : rev.text) || rev.originalText?.text || '',
      tempoRelativo: rev.relativePublishTimeDescription || '',
      dataPublicacao: rev.publishTime,
    }));

    const result: GooglePlaceData = {
      placeId,
      nome: data.displayName?.text,
      avaliacao: data.rating || 0,
      totalAvaliacoes: data.userRatingCount || 0,
      googleMapsUri: data.googleMapsUri,
      comentarios,
    };

    detailsCache.set(placeId, result);
    return result;
  } catch (error) {
    console.warn('[Google Places] Erro ao carregar detalhes do Google:');
    return null;
  }
}

/**
 * Obtém os dados e notas em tempo real do Google para um estabelecimento.
 * Se houver erro ou a chave não estiver configurada, retorna os dados base sem quebrar o app.
 */
export async function getLiveGoogleRatings(estabelecimento: Estabelecimento): Promise<{
  avaliacao: number;
  totalAvaliacoes: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  reviews: GoogleReview[];
  isGoogleData: boolean;
}> {
  let placeId = estabelecimento.googlePlaceId;

  // Se não tiver placeId predefinido, tenta buscar automaticamente pelo nome e cidade
  if (!placeId) {
    placeId = (await searchGooglePlaceId(estabelecimento.nome, estabelecimento.cidade)) || undefined;
  }

  if (placeId) {
    const details = await fetchGooglePlaceDetails(placeId);
    if (details && details.avaliacao > 0) {
      return {
        avaliacao: details.avaliacao,
        totalAvaliacoes: details.totalAvaliacoes,
        googlePlaceId: placeId,
        googleMapsUrl: details.googleMapsUri,
        reviews: details.comentarios,
        isGoogleData: true,
      };
    }
  }

  // Fallback para os dados já cadastrados
  return {
    avaliacao: estabelecimento.avaliacao,
    totalAvaliacoes: estabelecimento.totalAvaliacoes || 0,
    googlePlaceId: estabelecimento.googlePlaceId,
    googleMapsUrl: estabelecimento.googleMapsUrl,
    reviews: estabelecimento.googleReviews || [],
    isGoogleData: false,
  };
}
