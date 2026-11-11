import { coordenadasValidas } from '../utils/geo';
import { ApiInstituicao, isRecord, isCidade, isNoticia, isInstituicao, isHorarioSemanal, isExcecaoAbertura, isExperiencia, assertArray } from './validation';
import { fetchApi } from './client';
import { 
  Estabelecimento, 
  Cidade, 
  CategoriaItem, 
  CategoriaType, 
  Noticia, 
  HorarioSemanal, 
  ExcecaoAbertura, 
  Experiencia 
} from '../types';
import { ESTABELECIMENTOS_MOCK, CIDADES_MOCK, CATEGORIAS_MOCK } from '../constants/data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

// Mapeamento das categorias da API para categorias amigáveis do app
const CATEGORIA_REF_MAP: Record<number, CategoriaType> = {
  1: "Vinícola",
  2: "Turismo",
  3: "Gastronomia",
  4: "Hospedagem",
  5: "Gastronomia",
  6: "Gastronomia",
  7: "Eventos",
  8: "Vinícola",
  9: "Artesanato",
};

const CATEGORIA_EMOJI_MAP: Record<string, string> = {
  "Vinícola": "🍷",
  "Turismo": "🏛️",
  "Gastronomia": "🍽️",
  "Hospedagem": "🏨",
  "Eventos": "🎉",
  "Artesanato": "🎨",
};

// ============================================================
// SISTEMA DE CACHE PERSISTENTE
// ============================================================

const CACHE_KEYS = {
  CIDADES: '@atuaserra_cidades',
  INSTITUICOES: '@atuaserra_instituicoes',
  NOTICIAS: '@atuaserra_noticias',
};

/** Tempo de vida do cache em milissegundos (30 minutos) */
const CACHE_TTL = 30 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function getFromCache<T>(key: string, guard: (value: unknown) => value is T, allowExpired = false): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: unknown = JSON.parse(raw);
    if (!isRecord(entry) || typeof entry.timestamp !== 'number' || !Number.isFinite(entry.timestamp) || entry.timestamp > Date.now() || !guard(entry.data)) return null;
    if (!allowExpired && Date.now() - entry.timestamp > CACHE_TTL) {
      // Retain stale real data for offline fallback.
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Cache] Erro ao salvar cache:');
  }
}

// ============================================================
// CACHE EM MEMÓRIA (rápido para a sessão atual)
// ============================================================

let cidadesCache: Record<string, string> = Object.create(null);
let instituicoesMemTimestamp = 0;
let instituicoesMemCache: Estabelecimento[] | null = null;

/**
 * Retorna o nome da cidade a partir de um ID, UUID ou nome de referência.
 */
export function getCidadeNome(cidadeRef?: string): string {
  if (!cidadeRef) return "";
  if (cidadesCache[cidadeRef]) return cidadesCache[cidadeRef];
  // Se for UUID ou ID numérico sem correspondência, retorna vazio para não expor IDs técnicos
  if (/^[0-9a-f-]{25,}$/i.test(cidadeRef) || /^[0-9]+$/.test(cidadeRef)) {
    return "";
  }
  return cidadeRef;
}

/**
 * Normaliza campos de uma notícia, garantindo que cidade seja o nome amigável e imagens tenham URL correta.
 */
function normalizarNoticia(n: Noticia): Noticia {
  let nomeCidade = getCidadeNome(n.cidade);
  return {
    ...n,
    cidade: nomeCidade,
    cover: formatMediaUrl(n.cover) || n.cover,
  };
}

/**
 * Busca a lista de notícias publicadas da API.
 */
export async function getNoticias(params?: { featured?: boolean; search?: string }): Promise<Noticia[]> {
  try {
    // Garante que o mapa de cidades está carregado para resolver os IDs das cidades
    if (Object.keys(cidadesCache).length === 0) {
      await getCidades();
    }

    // Tenta cache primeiro (sem filtros)
    if (!params?.search) {
      const cached = await getFromCache(CACHE_KEYS.NOTICIAS, (v): v is Noticia[] => Array.isArray(v) && v.every(isNoticia));
      if (cached) {
        let noticias = cached.map(normalizarNoticia);
        if (params?.featured) noticias = noticias.filter(n => n.featured);
        return noticias;
      }
    }

    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const data = assertArray(await fetchApi<unknown>(`/noticias/${query}`), isNoticia);
    
    let noticias = (Array.isArray(data) ? data : []).map(normalizarNoticia);

    // Salva no cache apenas quando é busca completa (sem filtros de search)
    if (!params?.search) {
      void saveToCache(CACHE_KEYS.NOTICIAS, noticias);
    }

    if (params?.featured) {
      noticias = noticias.filter(n => n.featured);
    }
    return noticias;
  } catch (error) {
    // Tenta cache expirado como fallback
    try {
      const data = await getFromCache(CACHE_KEYS.NOTICIAS, (v): v is Noticia[] => Array.isArray(v) && v.every(isNoticia), true);
      if (data) {
        const entry = { data };
        let noticias = entry.data.map(normalizarNoticia);
        if (params?.featured) noticias = noticias.filter(n => n.featured);
        if (params?.search) {
          const query = params.search.toLowerCase();
          noticias = noticias.filter(n => `${n.title} ${n.summary} ${n.body}`.toLowerCase().includes(query));
        }
        console.log('[Cache] Usando notícias do cache (expirado) como fallback');
        return noticias;
      }
    } catch {}
    console.warn("[Services] Não foi possível carregar notícias:");
    return [];
  }
}

/**
 * Busca uma notícia pelo ID.
 */
export async function getNoticiaById(id: number): Promise<Noticia | null> {
  try {
    if (Object.keys(cidadesCache).length === 0) {
      await getCidades();
    }
    const n = await fetchApi<unknown>(`/noticias/${id}/`);
    if (isNoticia(n)) {
      return normalizarNoticia(n);
    }
    return null;
  } catch (error) {
    console.warn(`[Services] Falha ao carregar notícia ${id}:`);
    return null;
  }
}

/**
 * Busca todos os horários semanais da API, opcionalmente filtrando por instituição.
 */
export async function getHorariosSemanais(instituicaoId?: string): Promise<HorarioSemanal[]> {
  try {
    const query = instituicaoId ? `?instituicao=${encodeURIComponent(instituicaoId)}` : "";
    return assertArray(await fetchApi<unknown>(`/horarios-semanais/${query}`), isHorarioSemanal);
  } catch {
    return [];
  }
}

/**
 * Busca exceções de funcionamento/abertura da API.
 */
export async function getExcecoesAbertura(instituicaoId?: string): Promise<ExcecaoAbertura[]> {
  try {
    const query = instituicaoId ? `?instituicao=${encodeURIComponent(instituicaoId)}` : "";
    return assertArray(await fetchApi<unknown>(`/excecoes-abertura/${query}`), isExcecaoAbertura);
  } catch {
    return [];
  }
}

/**
 * Busca todas as 36 cidades reais cadastradas na API (com cache persistente).
 */
export async function getCidades(search?: string): Promise<Cidade[]> {
  try {
    // Tenta cache primeiro (sem filtro de busca)
    if (!search) {
      const cached = await getFromCache(CACHE_KEYS.CIDADES, (v): v is Cidade[] => Array.isArray(v) && v.every(isCidade));
      if (cached) {
        cached.forEach(c => {
          if (c.id && c.nome) cidadesCache[c.id] = c.nome;
        });
        return cached.map(c => {
          const mockMatch = CIDADES_MOCK.find(m => m.nome.toLowerCase() === (c.nome || '').toLowerCase());
          return {
            id: c.id,
            nome: c.nome,
            uf: c.uf || 'RS',
            estabelecimentos: c.estabelecimentos,
            emoji: mockMatch?.emoji ?? '🍇',
            imagemUrl: mockMatch?.imagemUrl,
            descricao: mockMatch?.descricao ?? `Explore as melhores experiências e atrativos em ${c.nome}.`,
          };
        });
      }
    }

    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const apiCidades = assertArray(await fetchApi<unknown>(`/cidades/${query}`), isCidade);
    
    if (Array.isArray(apiCidades)) {
      // Atualiza o cache de ID -> Nome
      apiCidades.forEach(c => {
        if (c.id && c.nome) {
          cidadesCache[c.id] = c.nome;
        }
      });

      // Salva no cache persistente
      if (!search) {
        void saveToCache(CACHE_KEYS.CIDADES, apiCidades);
      }

      return apiCidades.map((c) => {
        const mockMatch = CIDADES_MOCK.find(m => m.nome.toLowerCase() === (c.nome || '').toLowerCase());
        return {
          id: c.id,
          nome: c.nome,
          uf: c.uf || 'RS',
          estabelecimentos: c.estabelecimentos,
          emoji: mockMatch?.emoji ?? '🍇',
          imagemUrl: mockMatch?.imagemUrl,
          descricao: mockMatch?.descricao ?? `Explore as melhores experiências e atrativos em ${c.nome}.`,
        };
      });
    }
    return DEMO_MODE ? CIDADES_MOCK : [];
  } catch {
    // Tenta cache expirado como fallback
    try {
      const data = await getFromCache(CACHE_KEYS.CIDADES, (v): v is Cidade[] => Array.isArray(v) && v.every(isCidade), true);
      if (data) {
        const entry = { data };
        entry.data.forEach(c => { if (c.id && c.nome) cidadesCache[c.id] = c.nome; });
        console.log('[Cache] Usando cidades do cache como fallback');
        return entry.data.map((c) => ({
          id: c.id, nome: c.nome, uf: c.uf || 'RS',
          estabelecimentos: c.estabelecimentos, emoji: '🍇',
          descricao: `Explore as melhores experiências em ${c.nome}.`,
        }));
      }
    } catch {}

    let result = DEMO_MODE ? [...CIDADES_MOCK] : [];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.nome.toLowerCase().includes(q));
    }
    return result;
  }
}

/**
 * Formata URLs de imagens de mídia para o servidor de produção oficial (https://serragaucha.com)
 */
export function formatMediaUrl(rawImage?: string | null): string | undefined {
  if (!rawImage || typeof rawImage !== 'string') return undefined;
  let url = rawImage.trim();
  if (url.includes('atuaserra.vps-kinghost.net:8000/media/')) {
    url = url.replace('http://atuaserra.vps-kinghost.net:8000/media/', 'https://serragaucha.com/media/');
  } else if (url.startsWith('http://serragaucha.com/media/')) {
    url = url.replace('http://', 'https://');
  } else if (url.startsWith('/media/')) {
    url = `https://serragaucha.com${url}`;
  } else if (!url.startsWith('http')) {
    url = `https://serragaucha.com/media/${url.replace(/^\//, '')}`;
  }
  return url;
}

/**
 * Converte um objeto de instituição da API para a interface Estabelecimento da aplicação.
 * Agora usa horarios_semanais inline (nested na resposta da API) e imagem_capa/imagem_logo.
 */
function mapInstituicaoToEstabelecimento(inst: ApiInstituicao, cidadesMap: Record<string, string>): Estabelecimento {
  let nome = "Estabelecimento";
  let sobre = "";
  let endereco = "";

  if (inst.translations) {
    try {
      const trans = typeof inst.translations === 'string' ? JSON.parse(inst.translations) : inst.translations;
      if (!isRecord(trans)) throw new Error('Traduções inválidas');
      const candidate = trans['pt-br'] || trans['pt'] || trans;
      if (!isRecord(candidate)) throw new Error('Tradução inválida');
      const pt = Object.fromEntries(Object.entries(candidate).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
      nome = pt.nome || pt.name || nome;
      sobre = pt.descritivo_longo || pt.descritivo_curto || pt.descricao || "";
      endereco = pt.localizacao_texto || "";
    } catch {}
  }

  const categoria: CategoriaType = CATEGORIA_REF_MAP[inst.categoria_ref ?? 0] || "Turismo";
  const cidadeNome = cidadesMap[inst.cidade ?? ""] || "Serra Gaúcha";

  // Extração e formatação da URL da imagem de capa via https://serragaucha.com
  const rawImage = inst.imagem_capa || inst.foto_capa || inst.foto || inst.imagem || inst.image || inst.cover;
  const imagemUrl = formatMediaUrl(rawImage);

  // Extração e formatação do logo via https://serragaucha.com
  const logoUrl = formatMediaUrl(inst.imagem_logo);

  // Zero means no rating available; never generate reputation.
  const avaliacao = Math.max(0, Math.min(5, inst.avaliacao ?? inst.rating ?? 0));
  const totalAvaliacoes = Math.max(0, inst.total_avaliacoes ?? inst.user_ratings_total ?? 0);
  const coords = inst.latitude != null && inst.longitude != null && inst.latitude !== '' && inst.longitude !== ''
    ? { latitude: Number(inst.latitude), longitude: Number(inst.longitude) } : undefined;

  // Processa horários semanais inline (vêm direto na resposta da API)
  const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo", "Feriados"];
  let horarios: { dia: string; hora: string }[] | undefined = undefined;

  if (Array.isArray(inst.horarios_semanais) && inst.horarios_semanais.length > 0) {
    horarios = inst.horarios_semanais.map((h) => {
      const dia = diasSemana[h.day_of_week] || "Diariamente";
      const periodos: string[] = [];
      if (h.morning_start && h.morning_end) periodos.push(`${h.morning_start.slice(0, 5)} - ${h.morning_end.slice(0, 5)}`);
      if (h.afternoon_start && h.afternoon_end) periodos.push(`${h.afternoon_start.slice(0, 5)} - ${h.afternoon_end.slice(0, 5)}`);
      if (h.evening_start && h.evening_end) periodos.push(`${h.evening_start.slice(0, 5)} - ${h.evening_end.slice(0, 5)}`);
      return {
        dia,
        hora: periodos.join(" / ") || (h.notes ? h.notes : "Aberto"),
      };
    });
  }

  return {
    id: inst.id,
    nome,
    categoria,
    cidade: cidadeNome,
    cidadeId: inst.cidade ?? undefined,
    avaliacao,
    totalAvaliacoes,
    imagemUrl,
    logoUrl,
    horarios,
    sobre: sobre || undefined,
    endereco: endereco || undefined,
    coordenadas: coordenadasValidas(coords) ? coords : undefined,
    destaque: inst.status_validacao === 'APROVADO',
  };
}

/**
 * Busca todos os estabelecimentos com filtros opcionais (com cache persistente).
 */
export async function getEstabelecimentos(filters?: {
  categoria?: CategoriaType;
  cidade?: string;
  search?: string;
}): Promise<Estabelecimento[]> {
  try {
    // Garante que o mapa de cidades está carregado
    if (Object.keys(cidadesCache).length === 0) {
      await getCidades();
    }

    // Tenta cache em memória primeiro (mais rápido)
    if (instituicoesMemCache && Date.now() - instituicoesMemTimestamp < CACHE_TTL && !filters?.search) {
      let list = [...instituicoesMemCache];
      if (filters?.categoria && filters.categoria !== "Todos") {
        list = list.filter(e => e.categoria.toLowerCase() === filters.categoria?.toLowerCase());
      }
      if (filters?.cidade) {
        list = list.filter(e => e.cidade.toLowerCase() === filters.cidade?.toLowerCase());
      }
      return list;
    }

    // Tenta cache persistente
    if (!filters?.search) {
      const cached = await getFromCache(CACHE_KEYS.INSTITUICOES, (v): v is ApiInstituicao[] => Array.isArray(v) && v.every(isInstituicao));
      if (cached) {
        let list = cached.map(inst => mapInstituicaoToEstabelecimento(inst, cidadesCache));
        instituicoesMemCache = list;
        instituicoesMemTimestamp = Date.now(); // Salva em memória para próximas chamadas

        if (filters?.categoria && filters.categoria !== "Todos") {
          list = list.filter(e => e.categoria.toLowerCase() === filters.categoria?.toLowerCase());
        }
        if (filters?.cidade) {
          list = list.filter(e => e.cidade.toLowerCase() === filters.cidade?.toLowerCase());
        }
        
        // Faz refresh em background (sem bloquear)
        refreshInstituicoesInBackground();
        return list;
      }
    }

    // Busca da API
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append("search", filters.search);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    
    const apiInstituicoes = assertArray(await fetchApi<unknown>(`/instituicoes/${query}`), isInstituicao);
    
    if (Array.isArray(apiInstituicoes)) {
      // Salva os dados brutos no cache persistente
      if (!filters?.search) {
        void saveToCache(CACHE_KEYS.INSTITUICOES, apiInstituicoes);
      }

      let list = apiInstituicoes.map(inst => mapInstituicaoToEstabelecimento(inst, cidadesCache));
      
      if (!filters?.search) {
        instituicoesMemCache = list;
        instituicoesMemTimestamp = Date.now(); // Salva em memória
      }

      if (filters?.categoria && filters.categoria !== "Todos") {
        list = list.filter(e => e.categoria.toLowerCase() === filters.categoria?.toLowerCase());
      }
      if (filters?.cidade) {
        list = list.filter(e => e.cidade.toLowerCase() === filters.cidade?.toLowerCase());
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(e => e.nome.toLowerCase().includes(q) || e.cidade.toLowerCase().includes(q));
      }

      return list;
    }
    throw new Error("Nenhum dado retornado da API");
  } catch (error) {
    // Tenta cache expirado como último recurso
    try {
      const data = await getFromCache(CACHE_KEYS.INSTITUICOES, (v): v is ApiInstituicao[] => Array.isArray(v) && v.every(isInstituicao), true);
      if (data) {
        const entry = { data };
        let list = entry.data.map((inst: ApiInstituicao) => mapInstituicaoToEstabelecimento(inst, cidadesCache));
        console.log('[Cache] Usando instituições do cache como fallback');
        if (filters?.categoria && filters.categoria !== "Todos") {
          list = list.filter(e => e.categoria.toLowerCase() === filters.categoria?.toLowerCase());
        }
        if (filters?.cidade) {
          list = list.filter(e => e.cidade.toLowerCase() === filters.cidade?.toLowerCase());
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(e => e.nome.toLowerCase().includes(q) || e.cidade.toLowerCase().includes(q));
        }
        return list;
      }
    } catch {}

    console.warn("[Services] Usando dados locais para estabelecimentos:");
    let result = DEMO_MODE ? [...ESTABELECIMENTOS_MOCK] : [];
    if (filters?.categoria && filters.categoria !== "Todos") {
      result = result.filter(e => e.categoria === filters.categoria);
    }
    if (filters?.cidade) {
      result = result.filter(e => e.cidade.toLowerCase() === filters.cidade?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(e => e.nome.toLowerCase().includes(q) || e.cidade.toLowerCase().includes(q));
    }
    return result;
  }
}

/**
 * Refresh silencioso em background — atualiza o cache sem bloquear a UI.
 */
let refreshing = false;
async function refreshInstituicoesInBackground(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    if (Object.keys(cidadesCache).length === 0) await getCidades();
    const apiInstituicoes = assertArray(await fetchApi<unknown>(`/instituicoes/`), isInstituicao);
    if (Array.isArray(apiInstituicoes)) {
      void saveToCache(CACHE_KEYS.INSTITUICOES, apiInstituicoes);
      instituicoesMemTimestamp = Date.now();
      instituicoesMemCache = apiInstituicoes.map(inst => mapInstituicaoToEstabelecimento(inst, cidadesCache));
      console.log(`[Cache] Refresh concluído: ${apiInstituicoes.length} instituições atualizadas`);
    }
  } catch {
    // Silencioso — o cache antigo continua válido
  } finally {
    refreshing = false;
  }
}

/**
 * Busca estabelecimentos em destaque para a tela inicial.
 */
export async function getDestaques(): Promise<Estabelecimento[]> {
  try {
    const list = await getEstabelecimentos();
    // Prioriza os estabelecimentos aprovados e com descrições mais completas
    const destaques = list.filter(e => e.sobre && e.sobre.length > 30).slice(0, 8);
    return destaques.length > 0 ? destaques : list.slice(0, 6);
  } catch {
    return DEMO_MODE ? ESTABELECIMENTOS_MOCK.filter(e => e.destaque) : [];
  }
}

/**
 * Busca detalhes de um estabelecimento pelo ID.
 * Os horários semanais agora vêm inline na resposta da API (/instituicoes/{id}/).
 */
export async function getEstabelecimentoById(id: string | number): Promise<Estabelecimento> {
  try {
    // Tenta do cache em memória primeiro
    if (instituicoesMemCache && Date.now() - instituicoesMemTimestamp < CACHE_TTL) {
      const cached = instituicoesMemCache.find(e => String(e.id) === String(id));
      if (cached) return cached;
    }

    if (Object.keys(cidadesCache).length === 0) {
      await getCidades();
    }

    const inst = await fetchApi<unknown>(`/instituicoes/${encodeURIComponent(String(id))}/`);
    if (!isInstituicao(inst)) throw new Error("Instituição inválida");
    return mapInstituicaoToEstabelecimento(inst, cidadesCache);
  } catch {
    const item = (DEMO_MODE ? ESTABELECIMENTOS_MOCK : []).find(e => String(e.id) === String(id));
    if (!item) throw new Error("Estabelecimento não encontrado");
    return item;
  }
}

/**
 * Busca experiências e passeios turísticos.
 */
export async function getExperiencias(instituicaoId?: string): Promise<Experiencia[]> {
  try {
    const query = instituicaoId ? `?instituicao=${encodeURIComponent(instituicaoId)}` : "";
    return assertArray(await fetchApi<unknown>(`/experiencias/${query}`), isExperiencia);
  } catch {
    return [];
  }
}

/**
 * Busca categorias de estabelecimentos.
 */
export async function getCategorias(): Promise<CategoriaItem[]> {
  return CATEGORIAS_MOCK;
}

/**
 * Limpa todo o cache persistente (útil para debug ou atualização forçada).
 */
export async function limparCache(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  instituicoesMemCache = null;
  cidadesCache = Object.create(null);
  console.log('[Cache] Todo o cache foi limpo');
}


