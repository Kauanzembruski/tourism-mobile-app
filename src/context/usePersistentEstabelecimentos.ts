import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Estabelecimento } from '../types';
import { assertArray, isEstabelecimento } from '../api/validation';

/** Hydrate before editing and serialize writes, including rapid taps in one render. */
export function usePersistentEstabelecimentos(key: string) {
  const [items, setItems] = useState<Estabelecimento[]>([]);
  const current = useRef<Estabelecimento[]>([]);
  const hydration = useRef<Promise<void> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);
  const blocked = useRef(false);

  const hydrate = () => {
    if (!hydration.current) {
      hydration.current = (async () => {
        try {
          const raw = await AsyncStorage.getItem(key);
          if (raw) current.current = assertArray(JSON.parse(raw) as unknown, isEstabelecimento);
          if (mounted.current) setItems(current.current);
        } catch {
          // Preserve unreadable user data for recovery; never overwrite it with [].
          blocked.current = true;
          console.warn('[Storage] Dados locais indisponíveis; conteúdo original preservado.');
        }
      })();
    }
    return hydration.current;
  };

  useEffect(() => {
    mounted.current = true;
    void hydrate();
    return () => { mounted.current = false; };
  }, [key]);

  const update = (transform: (previous: Estabelecimento[]) => Estabelecimento[]): Promise<void> => {
    queue.current = queue.current.then(async () => {
      await hydrate();
      if (blocked.current) return;
      const next = transform(current.current);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
        current.current = next;
        if (mounted.current) setItems(next);
      } catch {
        console.warn('[Storage] Não foi possível salvar; estado anterior preservado.');
      }
    });
    return queue.current;
  };
  return { items, update };
}
