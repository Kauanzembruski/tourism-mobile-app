/**
 * Otimizador de Rota e Circuito Turístico (Algoritmo do Vizinho Mais Próximo / TSP)
 * 
 * Calcula a melhor sequência de visitação para múltiplos destinos na Serra Gaúcha,
 * minimizando o deslocamento total em quilômetros a partir da localização do usuário.
 */

import { Estabelecimento } from '../types';
import { Coordenadas, coordenadasValidas, calcularDistanciaKm, obterCoordenadasDaCidade, formatarDistanciaAmigavel } from './geo';

export interface ParadaRoteiro {
  ordem: number; // 1, 2, 3...
  estabelecimento: Estabelecimento;
  distanciaDoAnteriorKm: number;
  distanciaDoAnteriorFormatada: string;
  coordenadasEfetivas: Coordenadas;
}

export interface ResultadoRotaOtimizada {
  paradas: ParadaRoteiro[];
  distanciaTotalKm: number;
  distanciaTotalFormatada: string;
  tempoEstimadoMinutos: number;
  tempoEstimadoFormatado: string;
}

/**
 * Obtém as melhores coordenadas possíveis para o estabelecimento
 */
export function getCoordenadasEstabelecimento(item: Estabelecimento): Coordenadas {
  if (coordenadasValidas(item.coordenadas)) {
    return {
      latitude: Number(item.coordenadas.latitude),
      longitude: Number(item.coordenadas.longitude),
    };
  }
  if (item.cidade) {
    const coordsCidade = obterCoordenadasDaCidade(item.cidade);
    if (coordsCidade) return coordsCidade;
  }
  // Coordenadas centrais padrão da Serra Gaúcha (Bento Gonçalves)
  return { latitude: -29.1678, longitude: -51.5186 };
}

/**
 * Calcula a melhor sequência de rota entre múltiplos destinos
 * usando o algoritmo de Nearest Neighbor (Vizinho Mais Próximo).
 */
export function otimizarSequenciaRota(
  destinos: Estabelecimento[],
  origemUsuario?: Coordenadas | null
): ResultadoRotaOtimizada {
  // Stable de-duplication by identity; keep every distinct selected destination.
  destinos = destinos.filter((item, index, all) => all.findIndex(other => String(other.id) === String(item.id)) === index);
  if (!coordenadasValidas(origemUsuario)) origemUsuario = null;
  if (destinos.length === 0) {
    return {
      paradas: [],
      distanciaTotalKm: 0,
      distanciaTotalFormatada: '0 km',
      tempoEstimadoMinutos: 0,
      tempoEstimadoFormatado: '0 min',
    };
  }

  // Se houver apenas 1 destino
  if (destinos.length === 1) {
    const item = destinos[0];
    const coordsItem = getCoordenadasEstabelecimento(item);
    let distDoInicio = 0;
    if (origemUsuario) {
      distDoInicio = calcularDistanciaKm(origemUsuario, coordsItem);
    }
    const tempoMin = Math.round((distDoInicio / 45) * 60);

    return {
      paradas: [
        {
          ordem: 1,
          estabelecimento: item,
          distanciaDoAnteriorKm: distDoInicio,
          distanciaDoAnteriorFormatada: formatarDistanciaAmigavel(distDoInicio),
          coordenadasEfetivas: coordsItem,
        },
      ],
      distanciaTotalKm: distDoInicio,
      distanciaTotalFormatada: formatarDistanciaAmigavel(distDoInicio),
      tempoEstimadoMinutos: tempoMin,
      tempoEstimadoFormatado: `${tempoMin} min`,
    };
  }

  // Lista de destinos restantes a serem visitados
  const restantes = [...destinos];
  const paradasOrdenadas: ParadaRoteiro[] = [];
  let pontoAtual: Coordenadas;

  // Ponto de partida: usa GPS do usuário se disponível, ou o primeiro item
  if (origemUsuario) {
    pontoAtual = origemUsuario;
  } else {
    // Escolhe o item mais isolado ou o primeiro
    const primeiro = restantes.shift()!;
    const coordsPrimeiro = getCoordenadasEstabelecimento(primeiro);
    paradasOrdenadas.push({
      ordem: 1,
      estabelecimento: primeiro,
      distanciaDoAnteriorKm: 0,
      distanciaDoAnteriorFormatada: 'Ponto de Partida',
      coordenadasEfetivas: coordsPrimeiro,
    });
    pontoAtual = coordsPrimeiro;
  }

  let totalKm = 0;

  // Itera buscando sempre o destino mais próximo do ponto atual
  while (restantes.length > 0) {
    let melhorIndice = 0;
    let menorDistancia = Number.MAX_VALUE;

    for (let i = 0; i < restantes.length; i++) {
      const coordsCandidato = getCoordenadasEstabelecimento(restantes[i]);
      const dist = calcularDistanciaKm(pontoAtual, coordsCandidato);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        melhorIndice = i;
      }
    }

    const proximo = restantes.splice(melhorIndice, 1)[0];
    const coordsProximo = getCoordenadasEstabelecimento(proximo);
    totalKm += menorDistancia;

    paradasOrdenadas.push({
      ordem: paradasOrdenadas.length + 1,
      estabelecimento: proximo,
      distanciaDoAnteriorKm: menorDistancia,
      distanciaDoAnteriorFormatada: formatarDistanciaAmigavel(menorDistancia),
      coordenadasEfetivas: coordsProximo,
    });

    pontoAtual = coordsProximo;
  }

  // Velocidade média estimada na Serra Gaúcha (curvas e relevo): 45 km/h
  const tempoMinutos = Math.max(5, Math.round((totalKm / 45) * 60));
  let tempoFormatado = `${tempoMinutos} min`;
  if (tempoMinutos >= 60) {
    const horas = Math.floor(tempoMinutos / 60);
    const mins = tempoMinutos % 60;
    tempoFormatado = mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }

  return {
    paradas: paradasOrdenadas,
    distanciaTotalKm: totalKm,
    distanciaTotalFormatada: formatarDistanciaAmigavel(totalKm),
    tempoEstimadoMinutos: tempoMinutos,
    tempoEstimadoFormatado: tempoFormatado,
  };
}

/**
 * Gera a URL do Google Maps com múltiplos waypoints para navegação da rota inteira
 */
export function gerarUrlGoogleMapsRotaMultipla(
  paradas: ParadaRoteiro[],
  origemUsuario?: Coordenadas | null
): string {
  if (!coordenadasValidas(origemUsuario)) origemUsuario = null;
  if (paradas.length === 0) return '';

  if (paradas.length === 1) {
    const c = paradas[0].coordenadasEfetivas;
    if (origemUsuario) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origemUsuario.latitude},${origemUsuario.longitude}&destination=${c.latitude},${c.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`;
  }

  // Destino final é a última parada
  const ultima = paradas[paradas.length - 1].coordenadasEfetivas;
  const destination = `${ultima.latitude},${ultima.longitude}`;

  // Origem: se tiver GPS do usuário usa ele, senão a primeira parada
  let origin = '';
  let waypointsList: Coordenadas[] = [];

  if (origemUsuario) {
    origin = `${origemUsuario.latitude},${origemUsuario.longitude}`;
    // Todos exceto o último viram waypoints
    waypointsList = paradas.slice(0, -1).map(p => p.coordenadasEfetivas);
  } else {
    const primeira = paradas[0].coordenadasEfetivas;
    origin = `${primeira.latitude},${primeira.longitude}`;
    // Do segundo até o penúltimo viram waypoints
    waypointsList = paradas.slice(1, -1).map(p => p.coordenadasEfetivas);
  }

  let waypointsParam = '';
  if (waypointsList.length > 0) {
    const waypointsStr = waypointsList.map(w => `${w.latitude},${w.longitude}`).join('|');
    waypointsParam = `&waypoints=${encodeURIComponent(waypointsStr)}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
}
