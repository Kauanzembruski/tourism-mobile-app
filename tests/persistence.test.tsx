import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { local } from './fixtures';
import { usePersistentEstabelecimentos } from '../src/context/usePersistentEstabelecimentos';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));

let renderer: ReactTestRenderer;
let state: ReturnType<typeof usePersistentEstabelecimentos>;
function Harness() { state = usePersistentEstabelecimentos('existing-key'); return null; }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  storage.getItem.mockReset().mockResolvedValue(null);
  storage.setItem.mockReset().mockResolvedValue(undefined);
});
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });
async function mount() { await act(async () => { renderer = create(<Harness />); }); }

it('preserves legacy storage key and saved items', async () => {
  storage.getItem.mockResolvedValue(JSON.stringify([local('old')]));
  await mount();
  expect(storage.getItem).toHaveBeenCalledWith('existing-key');
  expect(state.items.map(item => item.id)).toEqual(['old']);
  expect(storage.setItem).not.toHaveBeenCalled();
});
it('serializes rapid additions from the same render', async () => {
  await mount();
  await act(async () => {
    await Promise.all(['a', 'b', 'c'].map(id => state.update(previous => [...previous, local(id)])));
  });
  expect(state.items.map(item => item.id)).toEqual(['a', 'b', 'c']);
  expect(JSON.parse(storage.setItem.mock.calls.at(-1)![1]).map((item: { id: string }) => item.id)).toEqual(['a', 'b', 'c']);
});
it('hydrates before a write triggered during startup', async () => {
  let resolve!: (value: string) => void;
  storage.getItem.mockReturnValue(new Promise<string>(done => { resolve = done; }));
  await mount();
  await act(async () => {
    const pending = state.update(previous => [...previous, local('new')]);
    resolve(JSON.stringify([local('old')]));
    await pending;
  });
  expect(state.items.map(item => item.id)).toEqual(['old', 'new']);
});
it.each(['{bad', '{}', JSON.stringify([{ id: 'bad' }])])('does not overwrite corrupt user data %s', async raw => {
  storage.getItem.mockResolvedValue(raw);
  await mount();
  await act(async () => state.update(() => [local('new')]));
  expect(storage.setItem).not.toHaveBeenCalled();
});
it('keeps previous state after a write failure and recovers on the next write', async () => {
  await mount();
  storage.setItem.mockRejectedValueOnce(new Error('disk full'));
  await act(async () => state.update(() => [local('lost')]));
  expect(state.items).toEqual([]);
  await act(async () => state.update(previous => [...previous, local('saved')]));
  expect(state.items.map(item => item.id)).toEqual(['saved']);
});
