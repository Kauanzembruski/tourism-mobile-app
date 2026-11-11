import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_CONFIG, fetchApi, setApiAuthToken } from '../src/api/client';
import { parseGoogle, parseYelp } from '../src/api/providerValidation';

beforeEach(() => {
  vi.useFakeTimers();
  API_CONFIG.MAX_RETRIES = 2;
  API_CONFIG.TIMEOUT = 50;
  API_CONFIG.BASE_URL = 'https://institution.example/api';
  setApiAuthToken(null);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('HTTP client without real network calls', () => {
  it('reads valid JSON and merges Headers instances', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id: 1 }));
    vi.stubGlobal('fetch', fetch);
    expect(await fetchApi('/cidades/', { headers: new Headers({ 'X-Test': 'ok' }) })).toEqual({ id: 1 });
    expect(fetch.mock.calls[0][1].headers.get('X-Test')).toBe('ok');
  });
  it('does not retry an HTTP 401 or expose its body', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('sensitive', { status: 401 }));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchApi('/private')).rejects.toThrow('Erro na API (401)');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retries server and network failures before success', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('secret URL')).mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal('fetch', fetch);
    const promise = fetchApi('/cidades/');
    await vi.runAllTimersAsync();
    expect(await promise).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('sanitizes exhausted connection failures', async () => {
    API_CONFIG.MAX_RETRIES = 0;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret')));
    await expect(fetchApi('/cidades/')).rejects.toThrow('Falha de conexão');
  });
  it('aborts on timeout and retries read requests', async () => {
    const fetch = vi.fn().mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    vi.stubGlobal('fetch', fetch);
    const assertion = expect(fetchApi('/slow')).rejects.toThrow('Tempo limite');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('rejects malformed JSON without retrying', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{invalid'));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchApi('/invalid')).rejects.toThrow('JSON inválida');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not repeat a mutation', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network'));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchApi('/write', { method: 'POST' })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('forwards tokens only to the HTTPS institutional origin', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(Response.json([])));
    vi.stubGlobal('fetch', fetch);
    setApiAuthToken('test-token');
    await fetchApi('/cidades/');
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer test-token');
    await fetchApi('https://other.example/data');
    expect(fetch.mock.calls[1][1].headers.has('Authorization')).toBe(false);
    API_CONFIG.BASE_URL = 'http://institution.example/api';
    await fetchApi('/cidades/');
    expect(fetch.mock.calls[2][1].headers.has('Authorization')).toBe(false);
    await expect(fetchApi('/private', { headers: { Authorization: 'test' } })).rejects.toThrow('HTTPS');
  });
  it('respects caller cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(fetchApi('/cancel', { signal: controller.signal })).rejects.toThrow('cancelada');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('provider validation', () => {
  it('accepts real response shapes', () => {
    expect(parseGoogle({ places: [{ id: 'place' }] }).places?.[0].id).toBe('place');
    expect(parseYelp({ businesses: [{ id: 'business', name: 'Name', rating: 4 }] }).businesses?.[0].rating).toBe(4);
  });
  it.each([null, [], { reviews: {} }, { rating: '5' }, { reviews: [{ user: 'bad' }] }])('rejects malformed provider data %j', value => {
    expect(() => parseGoogle(value)).toThrow();
    expect(() => parseYelp(value)).toThrow();
  });
  it('rejects nested objects where review text and author name must be strings', () => {
    expect(() => parseGoogle({ reviews: [{ text: { text: {} } }] })).toThrow();
    expect(() => parseGoogle({ reviews: [{ authorAttribution: { displayName: {} } }] })).toThrow();
    expect(() => parseYelp({ reviews: [{ text: {} }] })).toThrow();
  });
});
