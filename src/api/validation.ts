import { Cidade, Estabelecimento, Noticia, HorarioSemanal, ExcecaoAbertura, Experiencia } from '../types';
import { coordenadasValidas } from '../utils/geo';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function hasIdentity(value: unknown): value is Record<string, unknown> & { id: string | number } {
  return isRecord(value) && (typeof value.id === 'string' || (typeof value.id === 'number' && Number.isFinite(value.id)));
}
export function isCidade(value: unknown): value is Cidade {
  return hasIdentity(value) && isRecord(value) && typeof value.nome === 'string'
    && (value.uf == null || typeof value.uf === 'string')
    && (value.estabelecimentos == null || (typeof value.estabelecimentos === 'number' && Number.isFinite(value.estabelecimentos) && value.estabelecimentos >= 0));
}
export function isNoticia(value: unknown): value is Noticia {
  return isRecord(value) && typeof value.id === 'number' && ['cidade', 'title', 'slug', 'summary', 'body'].every(key => typeof value[key] === 'string')
    && (value.cover === null || typeof value.cover === 'string') && typeof value.featured === 'boolean'
    && ['draft', 'scheduled', 'published'].includes(String(value.status))
    && (value.published_at === null || typeof value.published_at === 'string');
}
export function isEstabelecimento(value: unknown): value is Estabelecimento {
  return hasIdentity(value) && isRecord(value) && ['nome', 'cidade'].every(key => typeof value[key] === 'string')
    && ['Vinícola', 'Gastronomia', 'Hospedagem', 'Turismo', 'Eventos', 'Artesanato', 'Todos'].includes(String(value.categoria))
    && typeof value.avaliacao === 'number' && Number.isFinite(value.avaliacao)
    && (value.coordenadas === undefined || coordenadasValidas(value.coordenadas))
    && (value.horarios === undefined || (Array.isArray(value.horarios) && value.horarios.every(h => isRecord(h) && typeof h.dia === 'string' && typeof h.hora === 'string')));
}
export function assertArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value) || !value.every(guard)) throw new Error('Formato de dados inválido');
  return value;
}

export function isHorarioSemanal(value: unknown): value is HorarioSemanal {
  return isRecord(value) && typeof value.id === 'number' && typeof value.instituicao === 'string'
    && typeof value.day_of_week === 'number' && Number.isInteger(value.day_of_week) && value.day_of_week >= 0 && value.day_of_week <= 7
    && ['morning_start', 'morning_end', 'afternoon_start', 'afternoon_end', 'evening_start', 'evening_end', 'notes'].every(key => value[key] === null || typeof value[key] === 'string');
}
export function isExcecaoAbertura(value: unknown): value is ExcecaoAbertura {
  return isRecord(value) && typeof value.id === 'number' && typeof value.date === 'string'
    && typeof value.instituicao === 'string' && [null, 'M', 'T', 'N'].includes(value.shift as string | null)
    && (value.reason === null || typeof value.reason === 'string');
}
export function isExperiencia(value: unknown): value is Experiencia {
  return isRecord(value) && typeof value.id === 'string' && typeof value.instituicao === 'string'
    && (value.nome_evento === null || typeof value.nome_evento === 'string')
    && typeof value.categoria === 'string' && typeof value.descricao === 'string'
    && ['descricao_completa', 'local'].every(key => value[key] === undefined || typeof value[key] === 'string')
    && (value.custo == null || typeof value.custo === 'string')
    && ['duracao_minutos', 'numero_pessoas'].every(key => value[key] === undefined || (typeof value[key] === 'number' && Number.isFinite(value[key])));
}
export interface ApiInstituicao {
  id: string | number;
  cidade?: string;
  categoria_ref?: number;
  translations?: string | Record<string, unknown>;
  imagem_capa?: string; foto_capa?: string; foto?: string; imagem?: string; image?: string; cover?: string;
  imagem_logo?: string;
  avaliacao?: number; rating?: number; total_avaliacoes?: number; user_ratings_total?: number;
  latitude?: number | string | null; longitude?: number | string | null;
  horarios_semanais?: HorarioSemanal[];
  status_validacao?: string;
}
export function isInstituicao(value: unknown): value is ApiInstituicao {
  if (!hasIdentity(value) || !isRecord(value)) return false;
  const strings = ['cidade', 'imagem_capa', 'foto_capa', 'foto', 'imagem', 'image', 'cover', 'imagem_logo', 'status_validacao'];
  if (strings.some(key => value[key] != null && typeof value[key] !== 'string')) return false;
  const numbers = ['categoria_ref', 'avaliacao', 'rating', 'total_avaliacoes', 'user_ratings_total'];
  if (numbers.some(key => value[key] != null && (typeof value[key] !== 'number' || !Number.isFinite(value[key])))) return false;
  return value.horarios_semanais == null || (Array.isArray(value.horarios_semanais) && value.horarios_semanais.every(h =>
    isRecord(h) && typeof h.day_of_week === 'number' && ['morning_start', 'morning_end', 'afternoon_start', 'afternoon_end', 'evening_start', 'evening_end', 'notes'].every(key => h[key] == null || typeof h[key] === 'string')));
}
