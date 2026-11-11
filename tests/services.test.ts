import { beforeEach, afterEach, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {
  getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
  setItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }),
  multiRemove: vi.fn(async (keys: string[]) => keys.forEach(key => storage.delete(key))),
} }));
vi.mock('../src/api/client', () => ({ fetchApi: vi.fn() }));

beforeEach(() => { vi.resetModules(); storage.clear(); vi.stubEnv('EXPO_PUBLIC_DEMO_MODE', 'false'); });
afterEach(() => vi.unstubAllEnvs());

async function setup() {
  const { fetchApi } = await import('../src/api/client');
  const api = vi.mocked(fetchApi);
  api.mockReset();
  const services = await import('../src/api/services');
  return { api, ...services };
}
const cache = (data: unknown, age = 0) => JSON.stringify({ data, timestamp: Date.now() - age });

it('maps valid institutions without inventing ratings, accepts zero coordinates', async () => {
  const { api, getEstabelecimentos } = await setup();
  api.mockResolvedValueOnce([{ id: 'city', nome: 'Veranópolis' }]).mockResolvedValueOnce([{ id: 'a', cidade: 'city', latitude: 0, longitude: 0, translations: { 'pt-br': { nome: 'Real name' } } }]);
  const [item] = await getEstabelecimentos();
  expect(item.nome).toBe('Real name');
  expect(item.avaliacao).toBe(0);
  expect(item.totalAvaliacoes).toBe(0);
  expect(item.coordenadas).toEqual({ latitude: 0, longitude: 0 });
});
it('reads fresh cache without network calls', async () => {
  const { api, getCidades } = await setup();
  storage.set('@atuaserra_cidades', cache([{ id: 'city', nome: 'Veranópolis' }]));
  expect(await getCidades()).toHaveLength(1);
  expect(api).not.toHaveBeenCalled();
});
it('retains expired real data and filters institution fallback search', async () => {
  const { api, getEstabelecimentos } = await setup();
  storage.set('@atuaserra_cidades', cache([{ id: 'city', nome: 'Veranópolis' }], 3600000));
  storage.set('@atuaserra_instituicoes', cache([{ id: 'a', cidade: 'city', translations: { nome: 'Alpha' } }, { id: 'b', cidade: 'city', translations: { nome: 'Beta' } }], 3600000));
  api.mockRejectedValue(new Error('offline'));
  expect((await getEstabelecimentos({ search: 'Alpha' })).map(item => item.nome)).toEqual(['Alpha']);
  expect(storage.has('@atuaserra_instituicoes')).toBe(true);
});
it.each(['invalid JSON', JSON.stringify({ data: {}, timestamp: Date.now() }), cache([{ id: {}, nome: 'bad' }])])('handles corrupt cache without deleting it', async raw => {
  const { api, getCidades } = await setup();
  storage.set('@atuaserra_cidades', raw);
  api.mockRejectedValue(new Error('offline'));
  expect(await getCidades()).toEqual([]);
  expect(storage.get('@atuaserra_cidades')).toBe(raw);
});
it('rejects invalid external payloads and never silently falls back to demos', async () => {
  const { api, getEstabelecimentos } = await setup();
  api.mockResolvedValue({ results: 'wrong-contract' });
  expect(await getEstabelecimentos()).toEqual([]);
});
it('does not cache search results as the full list', async () => {
  const { api, getCidades } = await setup();
  api.mockResolvedValue([{ id: 1, nome: 'Veranópolis' }]);
  await getCidades('Veranópolis');
  expect(storage.has('@atuaserra_cidades')).toBe(false);
});
it('honors cache TTL in memory', async () => {
  vi.useFakeTimers();
  try {
    const { api, getEstabelecimentos } = await setup();
    api.mockImplementation(async endpoint => String(endpoint).includes('cidades') ? [{ id: 'c', nome: 'City' }] : [{ id: 'a', cidade: 'c' }]);
    await getEstabelecimentos();
    api.mockClear();
    vi.advanceTimersByTime(31 * 60000);
    await getEstabelecimentos();
    expect(api).toHaveBeenCalled();
  } finally { vi.useRealTimers(); }
});
