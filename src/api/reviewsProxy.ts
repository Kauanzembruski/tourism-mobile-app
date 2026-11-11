/** No provider secrets are accepted by this client. See docs/SECURITY.md. */
const proxyUrl = process.env.EXPO_PUBLIC_REVIEWS_PROXY_URL?.trim().replace(/\/$/, '');

export function reviewsConfigured(): boolean {
  if (!proxyUrl) return false;
  try {
    const url = new URL(proxyUrl);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export async function fetchReviewsProxy(providerUrl: string, options: RequestInit = {}): Promise<Response> {
  if (!reviewsConfigured()) throw new Error('Serviço de avaliações não configurado');
  const source = new URL(providerUrl);
  const providers: Record<string, string> = {
    'places.googleapis.com': 'google',
    'maps.googleapis.com': 'google-legacy',
    'api.yelp.com': 'yelp',
  };
  const provider = providers[source.hostname];
  if (!provider || source.protocol !== 'https:') throw new Error('Provedor inválido');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${proxyUrl}/${provider}${source.pathname}${source.search}`, {
      ...options,
      signal: controller.signal,
    });
    // Consume the body within the timeout, including slow or stalled responses.
    const body = await response.text();
    return new Response(body, { status: response.status, headers: response.headers });
  } finally {
    clearTimeout(timeout);
  }
}
