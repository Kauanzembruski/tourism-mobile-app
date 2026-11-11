import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { local } from './fixtures';

beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('uses base data and makes no calls when unconfigured', async () => {
  vi.stubEnv('EXPO_PUBLIC_REVIEWS_PROXY_URL', '');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { getLiveGoogleRatings } = await import('../src/api/googlePlaces');
  const { getLiveYelpRatings } = await import('../src/api/yelp');
  expect((await getLiveGoogleRatings(local('a'))).isGoogleData).toBe(false);
  expect((await getLiveYelpRatings({ ...local('a'), yelpId: 'saved' })).isYelpData).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});
it('rejects HTTP or credential-bearing proxy configuration', async () => {
  vi.stubEnv('EXPO_PUBLIC_REVIEWS_PROXY_URL', 'http://reviews.example');
  const { reviewsConfigured, fetchReviewsProxy } = await import('../src/api/reviewsProxy');
  expect(reviewsConfigured()).toBe(false);
  await expect(fetchReviewsProxy('https://api.yelp.com/v3/businesses/search')).rejects.toThrow('configurado');
});
it('routes Google and Yelp calls to the backend without provider credentials', async () => {
  vi.stubEnv('EXPO_PUBLIC_REVIEWS_PROXY_URL', 'https://reviews.example/reviews');
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ businesses: [{ id: 'business', name: 'Name', rating: 4, review_count: 2 }] })));
  vi.stubGlobal('fetch', fetch);
  const { searchYelpBusiness } = await import('../src/api/yelp');
  expect((await searchYelpBusiness('Name', 'City'))?.avaliacao).toBe(4);
  const [url, init] = fetch.mock.calls[0];
  expect(url).toContain('https://reviews.example/reviews/yelp/v3/businesses/search?');
  expect(new Headers(init.headers).has('Authorization')).toBe(false);
});
it('parses Google ratings and comments through the proxy', async () => {
  vi.stubEnv('EXPO_PUBLIC_REVIEWS_PROXY_URL', 'https://reviews.example/reviews');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ rating: 4.5, userRatingCount: 10, reviews: [{ rating: 4, text: { text: 'Comment' }, authorAttribution: { displayName: 'Author' } }] })));
  const { fetchGooglePlaceDetails } = await import('../src/api/googlePlaces');
  const result = await fetchGooglePlaceDetails('place');
  expect(result?.avaliacao).toBe(4.5);
  expect(result?.comentarios[0].texto).toBe('Comment');
});
it('handles malformed provider payloads without crashing the screen', async () => {
  vi.stubEnv('EXPO_PUBLIC_REVIEWS_PROXY_URL', 'https://reviews.example');
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(Response.json({ businesses: 'bad', reviews: 'bad' }))));
  const { searchYelpBusiness, fetchYelpReviews } = await import('../src/api/yelp');
  expect(await searchYelpBusiness('Name', 'City')).toBeNull();
  expect(await fetchYelpReviews('id')).toEqual([]);
});
