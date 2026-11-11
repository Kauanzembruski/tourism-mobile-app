import { describe, expect, it } from 'vitest';
import { calcularDistanciaKm, coordenadasValidas, formatarDistanciaAmigavel } from '../src/utils/geo';
import { getCoordenadasEstabelecimento, otimizarSequenciaRota, gerarUrlGoogleMapsRotaMultipla } from '../src/utils/routeOptimizer';
import { avaliarStatusOperacional, identificarPeriodoDia, identificarEstacaoAno, ranquearEstabelecimentosParaOMomento } from '../src/utils/recommender';
import { local } from './fixtures';

describe('Haversine', () => {
  it('accepts zero and identical coordinates', () => {
    expect(calcularDistanciaKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
  });
  it('matches one degree on the equator within 100m', () => {
    expect(calcularDistanciaKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111.195, 2);
  });
  it.each([undefined, null, {}, { latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: Infinity }, { latitude: 0, longitude: -181 }])('rejects invalid point %j', point => {
    expect(coordenadasValidas(point)).toBe(false);
    // Exercise a malformed external payload without lying to TypeScript.
    expect(Reflect.apply(calcularDistanciaKm, undefined, [point, { latitude: 0, longitude: 0 }])).toBeNaN();
  });
  it('does not display invalid distances', () => {
    expect(formatarDistanciaAmigavel(Infinity)).toBe('');
    expect(formatarDistanciaAmigavel(-1)).toBe('');
  });
});

describe('nearest neighbor route', () => {
  it('handles an empty list', () => expect(otimizarSequenciaRota([]).paradas).toEqual([]));
  it('keeps a single destination and calculates its distance', () => {
    const result = otimizarSequenciaRota([local('a', 0, 1)], { latitude: 0, longitude: 0 });
    expect(result.paradas).toHaveLength(1);
    expect(result.distanciaTotalKm).toBeCloseTo(111.195, 2);
  });
  it('visits every unique identity once in nearest order and does not mutate inputs', () => {
    const input = [local('far', 0, 3), local('near', 0, 1), local('mid', 0, 2), local('near', 0, 1)];
    const result = otimizarSequenciaRota(input, { latitude: 0, longitude: 0 });
    expect(result.paradas.map(p => p.estabelecimento.id)).toEqual(['near', 'mid', 'far']);
    expect(input).toHaveLength(4);
    expect(otimizarSequenciaRota(input, { latitude: 0, longitude: 0 })).toEqual(result);
  });
  it('starts at the first selection without GPS or with invalid GPS', () => {
    const input = [local('a'), local('b', 0, 1)];
    expect(otimizarSequenciaRota(input).paradas[0].distanciaDoAnteriorKm).toBe(0);
    expect(otimizarSequenciaRota(input, { latitude: NaN, longitude: 0 })).toEqual(otimizarSequenciaRota(input));
  });
  it('keeps tie ordering stable', () => {
    expect(otimizarSequenciaRota([local('a'), local('b')], { latitude: 0, longitude: 0 }).paradas.map(p => p.estabelecimento.id)).toEqual(['a', 'b']);
  });
  it('uses documented city or regional reference for invalid coordinates', () => {
    expect(getCoordenadasEstabelecimento({ ...local('a'), coordenadas: { latitude: 100, longitude: 0 } }).latitude).toBeCloseTo(-28.9358);
    const route = otimizarSequenciaRota([{ ...local('a'), cidade: 'Unknown', coordenadas: undefined }]);
    expect(Number.isFinite(route.distanciaTotalKm)).toBe(true);
  });
  it('generates ordered map waypoints and handles empty routes', () => {
    expect(gerarUrlGoogleMapsRotaMultipla([])).toBe('');
    const route = otimizarSequenciaRota([local('a'), local('b', 0, 1), local('c', 0, 2)]);
    expect(gerarUrlGoogleMapsRotaMultipla(route.paradas)).toContain('waypoints=0%2C1');
  });
});

describe('contextual ranking', () => {
  it.each([[9, 'manha'], [12, 'almoco'], [16, 'tarde'], [20, 'noite'], [3, 'madrugada']])('identifies hour %s', (hour, period) => {
    expect(identificarPeriodoDia(new Date(2026, 0, 5, Number(hour))).periodo).toBe(period);
  });
  it.each([[0, 'verao'], [3, 'outono'], [6, 'inverno'], [9, 'primavera']])('identifies southern season %s', (month, season) => {
    expect(identificarEstacaoAno(new Date(2026, Number(month), 10)).estacao).toBe(season);
  });
  it.each([[8, 30, 'proximo_abrir'], [10, 0, 'aberto'], [17, 30, 'fechamento_iminente'], [20, 0, 'fechado']])('evaluates availability at %s:%s', (hour, minute, status) => {
    expect(avaliarStatusOperacional(local('a'), new Date(2026, 0, 5, Number(hour), Number(minute))).status).toBe(status);
  });
  it('respects explicit closed hours', () => {
    expect(avaliarStatusOperacional({ ...local('a'), horarios: [{ dia: 'Diariamente', hora: 'Fechado' }] }, new Date(2026, 0, 5, 12)).status).toBe('fechado');
  });
  it('parses hour-only intervals', () => {
    const item = { ...local('a'), horarios: [{ dia: 'Diariamente', hora: '09h às 18h' }] };
    expect(avaliarStatusOperacional(item, new Date(2026, 0, 5, 20)).status).toBe('fechado');
  });
  it('ranks proximity, avoids fabricated reputation, tolerates incomplete optional data', () => {
    const items = [local('far', 0, 2), local('near'), { ...local('unknown'), avaliacao: 0, totalAvaliacoes: undefined, coordenadas: undefined, sobre: undefined }];
    const result = ranquearEstabelecimentosParaOMomento(items, { latitude: 0, longitude: 0 }, { dataReferencia: new Date(2026, 0, 5, 12) });
    expect(result.recomendados[0].item.id).toBe('near');
    expect(result.recomendados.find(r => r.item.id === 'unknown')?.hypeScore).toBe(0);
    expect(result.recomendados.every(r => Number.isFinite(r.scoreFinal))).toBe(true);
    expect(result.recomendados.map(r => r.scoreFinal)).toEqual([...result.recomendados.map(r => r.scoreFinal)].sort((a, b) => b - a));
  });
});
