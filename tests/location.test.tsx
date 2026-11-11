import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LocationProvider, useLocation, UserLocationState } from '../src/context/LocationContext';

const location = vi.hoisted(() => ({
  requestForegroundPermissionsAsync: vi.fn(), getLastKnownPositionAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(), reverseGeocodeAsync: vi.fn(), Accuracy: { Balanced: 3 },
}));
const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('expo-location', () => location);
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
let state: UserLocationState;
let renderer: ReactTestRenderer;
function Consumer() { state = useLocation(); return null; }
async function mount() { await act(async () => { renderer = create(<LocationProvider><Consumer /></LocationProvider>); }); }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  storage.getItem.mockReset().mockResolvedValue(null);
  storage.setItem.mockReset().mockResolvedValue(undefined);
  location.requestForegroundPermissionsAsync.mockReset().mockResolvedValue({ status: 'granted' });
  location.getLastKnownPositionAsync.mockReset().mockResolvedValue(null);
  location.getCurrentPositionAsync.mockReset().mockResolvedValue({ coords: { latitude: 0, longitude: 0 } });
  location.reverseGeocodeAsync.mockReset().mockResolvedValue([{ city: 'City', region: 'RS' }]);
});
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

it('respects denied permission and permits manual city selection', async () => {
  location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
  await mount();
  expect(state.status).toBe('denied');
  expect(location.getCurrentPositionAsync).not.toHaveBeenCalled();
  await act(async () => state.definirCidadeManual('Veranópolis'));
  expect(state.coords?.latitude).toBeCloseTo(-28.9358);
  expect(state.cidade).toBe('Veranópolis');
});
it('accepts zero coordinates and calculates a zero distance', async () => {
  await mount();
  expect(state.status).toBe('granted');
  expect(state.calcularDistanciaAte({ latitude: 0, longitude: 0 })).toBe(0);
});
it('still requests current location if last-known position is unavailable on Web', async () => {
  location.getLastKnownPositionAsync.mockRejectedValue(new Error('unsupported'));
  await mount();
  expect(state.status).toBe('granted');
  expect(location.getCurrentPositionAsync).toHaveBeenCalled();
});
it('recovers from a corrupt location cache without erasing unrelated data', async () => {
  storage.getItem.mockResolvedValue('{broken');
  await mount();
  expect(state.status).toBe('granted');
  expect(state.coords).toEqual({ latitude: 0, longitude: 0 });
});
it('does not let a pending GPS request override a later manual city', async () => {
  let resolve!: (value: { coords: { latitude: number; longitude: number } }) => void;
  location.getCurrentPositionAsync.mockReturnValue(new Promise(done => { resolve = done; }));
  await mount();
  await act(async () => {
    state.definirCidadeManual('Veranópolis');
    resolve({ coords: { latitude: 0, longitude: 0 } });
  });
  expect(state.cidade).toBe('Veranópolis');
  expect(state.coords?.latitude).toBeCloseTo(-28.9358);
});
it('still initializes after StrictMode replays mount effects', async () => {
  await act(async () => { renderer = create(<React.StrictMode><LocationProvider><Consumer /></LocationProvider></React.StrictMode>); });
  expect(state.status).toBe('granted');
  expect(location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
});
