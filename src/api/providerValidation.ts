import { isRecord } from './validation';

interface ProviderReview {
  id?: string; rating?: number; text?: string;
  user?: { name?: string; image_url?: string };
  time_created?: string; url?: string;
}
export interface YelpHours {
  is_open_now?: boolean;
  open?: { day: number; start?: string; end?: string }[];
}
interface YelpPayload {
  businesses?: { id: string; name: string; rating?: number; review_count?: number; url?: string; image_url?: string }[];
  reviews?: ProviderReview[];
  hours?: YelpHours[];
  phone?: string; display_phone?: string; photos?: string[];
}
interface GoogleWireReview {
  author_name?: string; profile_photo_url?: string; rating?: number; text?: string | { text?: string };
  relative_time_description?: string; time?: number;
  authorAttribution?: { displayName?: string; photoUri?: string };
  originalText?: { text?: string }; relativePublishTimeDescription?: string; publishTime?: string;
}
interface GooglePayload {
  places?: { id: string }[];
  candidates?: { place_id: string }[];
  result?: GooglePayload;
  reviews?: GoogleWireReview[];
  name?: string; displayName?: { text?: string }; rating?: number;
  user_ratings_total?: number; userRatingCount?: number; url?: string; googleMapsUri?: string;
}

// Validate every consumed field recursively before narrowing a provider response.
const strings = new Set(['id', 'place_id', 'name', 'image_url', 'url', 'author_name', 'profile_photo_url', 'relative_time_description', 'displayName', 'photoUri', 'relativePublishTimeDescription', 'publishTime', 'googleMapsUri', 'time_created', 'phone', 'display_phone', 'start', 'end']);
const numbers = new Set(['rating', 'review_count', 'user_ratings_total', 'userRatingCount', 'time', 'day']);
const objects = new Set(['user', 'authorAttribution', 'originalText', 'result']);
const arrays = new Set(['businesses', 'reviews', 'places', 'candidates', 'hours', 'open']);

function validate(value: unknown, provider: 'google' | 'yelp', parentKey = ''): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Resposta de avaliações inválida');
  for (const [key, field] of Object.entries(value)) {
    if (field == null) continue;
    if (key === 'text' || key === 'displayName') {
      const plainText = provider === 'yelp' || parentKey === 'authorAttribution' || ['text', 'originalText', 'displayName'].includes(parentKey);
      if (plainText) {
        if (typeof field !== 'string') throw new Error('Texto de avaliação inválido');
      } else if (typeof field !== 'string') validate(field, provider, key);
    } else if (strings.has(key)) {
      if (typeof field !== 'string') throw new Error('Texto de avaliação inválido');
    } else if (numbers.has(key)) {
      if (typeof field !== 'number' || !Number.isFinite(field)) throw new Error('Número de avaliação inválido');
    } else if (objects.has(key)) validate(field, provider, key);
    else if (arrays.has(key)) {
      if (!Array.isArray(field)) throw new Error('Lista de avaliações inválida');
      field.forEach(item => validate(item, provider, key));
    } else if (key === 'photos') {
      if (!Array.isArray(field) || !field.every(item => typeof item === 'string')) throw new Error('Fotos inválidas');
    } else if (key === 'is_open_now' && typeof field !== 'boolean') throw new Error('Status inválido');
  }
}
export function parseGoogle(value: unknown): GooglePayload {
  validate(value, 'google');
  for (const field of ['places', 'candidates'] as const) {
    const list = value[field];
    if (Array.isArray(list) && list.some(item => typeof item[field === 'places' ? 'id' : 'place_id'] !== 'string')) throw new Error('Identificador inválido');
  }
  return value as GooglePayload;
}
export function parseYelp(value: unknown): YelpPayload {
  validate(value, 'yelp');
  if (Array.isArray(value.businesses) && value.businesses.some(item => typeof item.id !== 'string' || typeof item.name !== 'string')) throw new Error('Negócio inválido');
  if (Array.isArray(value.hours) && value.hours.some(item => Array.isArray(item.open) && item.open.some((entry: unknown) => !isRecord(entry) || typeof entry.day !== 'number'))) throw new Error('Horários inválidos');
  return value as YelpPayload;
}
