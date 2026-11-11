import { usePersistentEstabelecimentos } from './usePersistentEstabelecimentos';
import React, { createContext, useContext } from 'react';
import { Estabelecimento } from '../types';

interface FavoritesContextData {
  favoritos: Estabelecimento[];
  isFavorito: (id: string | number) => boolean;
  toggleFavorito: (item: Estabelecimento) => Promise<void>;
}

const FAVORITES_STORAGE_KEY = '@AtuaSerra:favoritos_v1';

const FavoritesContext = createContext<FavoritesContextData | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { items: favoritos, update } = usePersistentEstabelecimentos(FAVORITES_STORAGE_KEY);
  const toggleFavorito = (item: Estabelecimento) => update(previous =>
    previous.some(f => String(f.id) === String(item.id))
      ? previous.filter(f => String(f.id) !== String(item.id)) : [...previous, item]);

  const isFavorito = (id: string | number) => {
    return favoritos.some(f => String(f.id) === String(id));
  };

  return (
    <FavoritesContext.Provider value={{ favoritos, isFavorito, toggleFavorito }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites requer FavoritesProvider');
  return context;
};
