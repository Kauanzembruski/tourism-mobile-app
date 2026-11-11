/** Accept zero coordinates; reject NaN, infinity and points outside Earth bounds. */
export function coordenadasValidas(value: unknown): value is Coordenadas {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<Coordenadas>;
  return typeof point.latitude === 'number' && Number.isFinite(point.latitude)
    && Math.abs(point.latitude) <= 90 && typeof point.longitude === 'number'
    && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

/**
 * Utilitários de geolocalização e coordenadas dos municípios da Serra Gaúcha
 */

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface CidadeCoordenadas {
  nome: string;
  uf: string;
  latitude: number;
  longitude: number;
}

/**
 * Coordenadas de referência dos municípios da Serra Gaúcha (Região Uva e Vinho, Hortênsias e Campos de Cima da Serra)
 */
export const CIDADES_SERRA_GAUCHA: CidadeCoordenadas[] = [
  { nome: "Bento Gonçalves", uf: "RS", latitude: -29.1678, longitude: -51.5186 },
  { nome: "Garibaldi", uf: "RS", latitude: -29.2568, longitude: -51.5339 },
  { nome: "Carlos Barbosa", uf: "RS", latitude: -29.2974, longitude: -51.5034 },
  { nome: "Monte Belo do Sul", uf: "RS", latitude: -29.1677, longitude: -51.6288 },
  { nome: "Santa Tereza", uf: "RS", latitude: -29.1764, longitude: -51.7371 },
  { nome: "Pinto Bandeira", uf: "RS", latitude: -29.0984, longitude: -51.4503 },
  { nome: "Farroupilha", uf: "RS", latitude: -29.2241, longitude: -51.3468 },
  { nome: "Caxias do Sul", uf: "RS", latitude: -29.1681, longitude: -51.1794 },
  { nome: "Flores da Cunha", uf: "RS", latitude: -29.0287, longitude: -51.1873 },
  { nome: "Nova Pádua", uf: "RS", latitude: -29.0298, longitude: -51.3072 },
  { nome: "Nova Roma do Sul", uf: "RS", latitude: -29.0003, longitude: -51.4089 },
  { nome: "Antônio Prado", uf: "RS", latitude: -28.8576, longitude: -51.2829 },
  { nome: "Ipê", uf: "RS", latitude: -28.8202, longitude: -51.1789 },
  { nome: "Veranópolis", uf: "RS", latitude: -28.9358, longitude: -51.5501 },
  { nome: "Cotiporã", uf: "RS", latitude: -28.9939, longitude: -51.6936 },
  { nome: "Fagundes Varela", uf: "RS", latitude: -28.8814, longitude: -51.6989 },
  { nome: "Vila Flores", uf: "RS", latitude: -28.8683, longitude: -51.5312 },
  { nome: "Nova Prata", uf: "RS", latitude: -28.7842, longitude: -51.6094 },
  { nome: "Nova Araçá", uf: "RS", latitude: -28.6575, longitude: -51.7453 },
  { nome: "Nova Bassano", uf: "RS", latitude: -28.7236, longitude: -51.7032 },
  { nome: "Protásio Alves", uf: "RS", latitude: -28.7561, longitude: -51.4883 },
  { nome: "Guabiju", uf: "RS", latitude: -28.5369, longitude: -51.6908 },
  { nome: "São Jorge", uf: "RS", latitude: -28.4984, longitude: -51.7011 },
  { nome: "Gramado", uf: "RS", latitude: -29.3788, longitude: -50.8732 },
  { nome: "Canela", uf: "RS", latitude: -29.3621, longitude: -50.8124 },
  { nome: "Nova Petrópolis", uf: "RS", latitude: -29.3758, longitude: -51.1147 },
  { nome: "São Francisco de Paula", uf: "RS", latitude: -29.4485, longitude: -50.5828 },
  { nome: "Picada Café", uf: "RS", latitude: -29.4444, longitude: -51.1347 },
  { nome: "Morro Reuter", uf: "RS", latitude: -29.5397, longitude: -51.0808 },
  { nome: "Dois Irmãos", uf: "RS", latitude: -29.5802, longitude: -51.0850 },
  { nome: "Ivoti", uf: "RS", latitude: -29.5939, longitude: -51.1578 },
  { nome: "São Vendelino", uf: "RS", latitude: -29.3664, longitude: -51.3789 },
  { nome: "Alto Feliz", uf: "RS", latitude: -29.3889, longitude: -51.3175 },
  { nome: "Feliz", uf: "RS", latitude: -29.4542, longitude: -51.3061 },
  { nome: "Vale Real", uf: "RS", latitude: -29.4003, longitude: -51.2464 },
  { nome: "Linha Nova", uf: "RS", latitude: -29.4678, longitude: -51.2014 },
];

/**
 * Calcula a distância em quilômetros entre dois pontos geográficos usando a fórmula de Haversine.
 */
export function calcularDistanciaKm(
  p1: Coordenadas,
  p2: Coordenadas
): number {
  if (!coordenadasValidas(p1) || !coordenadasValidas(p2)) return NaN;
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(p2.latitude - p1.latitude);
  const dLon = toRad(p2.longitude - p1.longitude);
  
  const lat1 = toRad(p1.latitude);
  const lat2 = toRad(p2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formata uma distância em km para formato amigável ao usuário (ex: "850 m" ou "2.4 km").
 */
export function formatarDistanciaAmigavel(distanciaKm: number | null | undefined): string {
  if (distanciaKm === null || distanciaKm === undefined || !Number.isFinite(distanciaKm) || distanciaKm < 0) {
    return "";
  }
  if (distanciaKm < 1) {
    const metros = Math.round(distanciaKm * 1000);
    return `${metros} m`;
  }
  if (distanciaKm < 10) {
    return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.round(distanciaKm)} km`;
}

/**
 * Verifica se o nome de uma cidade pertence à Serra Gaúcha
 */
export function verificaSeEhSerraGaucha(cidadeNome?: string | null): boolean {
  if (!cidadeNome) return false;
  const normalizado = cidadeNome.toLowerCase().trim();
  return CIDADES_SERRA_GAUCHA.some(c => 
    normalizado.includes(c.nome.toLowerCase()) || c.nome.toLowerCase().includes(normalizado)
  );
}

/**
 * Encontra a cidade da Serra Gaúcha mais próxima das coordenadas informadas
 */
export function encontrarCidadeMaisProxima(coords: Coordenadas): {
  cidade: CidadeCoordenadas;
  distanciaKm: number;
} {
  let maisProxima = CIDADES_SERRA_GAUCHA[0];
  let menorDistancia = calcularDistanciaKm(coords, {
    latitude: maisProxima.latitude,
    longitude: maisProxima.longitude,
  });

  for (let i = 1; i < CIDADES_SERRA_GAUCHA.length; i++) {
    const atual = CIDADES_SERRA_GAUCHA[i];
    const dist = calcularDistanciaKm(coords, {
      latitude: atual.latitude,
      longitude: atual.longitude,
    });
    if (dist < menorDistancia) {
      menorDistancia = dist;
      maisProxima = atual;
    }
  }

  return {
    cidade: maisProxima,
    distanciaKm: menorDistancia,
  };
}

/**
 * Obtém as coordenadas padrão de uma cidade pelo nome (fallback caso o estabelecimento não tenha lat/long)
 */
export function obterCoordenadasDaCidade(cidadeNome?: string): Coordenadas | undefined {
  if (!cidadeNome) return undefined;
  const normalizado = cidadeNome.toLowerCase().trim();
  const encontrada = CIDADES_SERRA_GAUCHA.find(c => 
    c.nome.toLowerCase() === normalizado || normalizado.includes(c.nome.toLowerCase())
  );
  if (encontrada) {
    return { latitude: encontrada.latitude, longitude: encontrada.longitude };
  }
  return undefined;
}
