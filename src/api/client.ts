// Keep the institutional endpoint until its operator provides verified TLS.
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '') || "http://atuaserra.vps-kinghost.net:8000/api",
  TIMEOUT: 45000,
  MAX_RETRIES: 2,
  HEADERS: { "Content-Type": "application/json", "Accept": "application/json" },
};
let authToken: string | null = null;
export function setApiAuthToken(token: string | null) { authToken = token; }

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

/** Retry read requests on network failure, timeout, rate limiting and server errors. */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = new URL(API_CONFIG.BASE_URL);
  const url = new URL(/^https?:\/\//i.test(endpoint) ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new ApiError('URL da API inválida');
  }
  const headers = new Headers(API_CONFIG.HEADERS);
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  if (authToken && url.origin === base.origin && url.protocol === 'https:') {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  if (headers.has('Authorization') && (url.protocol !== 'https:' || url.origin !== base.origin)) {
    throw new ApiError('Autenticação exige HTTPS e a origem institucional');
  }
  const canRetry = ['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase());
  for (let attempt = 0; ; attempt++) {
    if (options.signal?.aborted) throw new ApiError('Requisição cancelada');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(cancel, API_CONFIG.TIMEOUT);
    try {
      const response = await fetch(url.toString(), { ...options, headers, signal: controller.signal });
      if (!response.ok) throw new ApiError(`Erro na API (${response.status})`, response.status);
      try {
        return await response.json() as T;
      } catch {
        throw new ApiError(controller.signal.aborted ? 'Tempo limite da API excedido' : 'Resposta JSON inválida');
      }
    } catch (error: unknown) {
      if (options.signal?.aborted) throw new ApiError('Requisição cancelada');
      const safeError = error instanceof ApiError ? error : new ApiError(
        controller.signal.aborted ? 'Tempo limite da API excedido' : 'Falha de conexão com a API'
      );
      const retryable = controller.signal.aborted || !(error instanceof ApiError) || error.status === 429 || (error.status !== undefined && error.status >= 500);
      if (!canRetry || !retryable || attempt >= API_CONFIG.MAX_RETRIES) throw safeError;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', cancel);
    }
    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
  }
}
