import { usePersistentEstabelecimentos } from './usePersistentEstabelecimentos';
import React, { createContext, useContext } from 'react';
import { Alert, Linking, AlertButton, Platform } from 'react-native';
import { Estabelecimento } from '../types';
import { Coordenadas } from '../utils/geo';
import { 
  ResultadoRotaOtimizada, 
  otimizarSequenciaRota, 
  gerarUrlGoogleMapsRotaMultipla 
} from '../utils/routeOptimizer';
import { abrirWaze, abrirGoogleMaps } from '../utils/navigationApps';

interface RoteiroContextData {
  roteiro: Estabelecimento[];
  isNoRoteiro: (id: string | number) => boolean;
  adicionarAoRoteiro: (item: Estabelecimento) => Promise<void>;
  removerDoRoteiro: (id: string | number) => Promise<void>;
  toggleRoteiro: (item: Estabelecimento) => Promise<void>;
  limparRoteiro: () => Promise<void>;
  calcularRotaOtimizada: (origemUsuario?: Coordenadas | null) => ResultadoRotaOtimizada;
  iniciarNavegacaoCircuito: (origemUsuario?: Coordenadas | null) => void;
}

const ROTEIRO_STORAGE_KEY = '@AtuaSerra:roteiro_destinos_v1';

const RoteiroContext = createContext<RoteiroContextData | undefined>(undefined);

export const RoteiroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { items: roteiro, update } = usePersistentEstabelecimentos(ROTEIRO_STORAGE_KEY);
  const isNoRoteiro = (id: string | number) => roteiro.some(item => String(item.id) === String(id));
  const adicionarAoRoteiro = (item: Estabelecimento) => update(previous =>
    previous.some(existing => String(existing.id) === String(item.id)) ? previous : [...previous, item]);
  const removerDoRoteiro = (id: string | number) => update(previous => previous.filter(item => String(item.id) !== String(id)));
  const toggleRoteiro = (item: Estabelecimento) => update(previous =>
    previous.some(existing => String(existing.id) === String(item.id))
      ? previous.filter(existing => String(existing.id) !== String(item.id)) : [...previous, item]);
  const limparRoteiro = () => update(() => []);

  const calcularRotaOtimizada = (origemUsuario?: Coordenadas | null): ResultadoRotaOtimizada => {
    return otimizarSequenciaRota(roteiro, origemUsuario);
  };

  const iniciarNavegacaoCircuito = (origemUsuario?: Coordenadas | null) => {
    if (roteiro.length === 0) {
      Alert.alert('Roteiro vazio', 'Adicione locais ao seu roteiro para iniciar a navegação.');
      return;
    }

    const rota = otimizarSequenciaRota(roteiro, origemUsuario);
    const primeiraParada = rota.paradas[0];

    const botoes: AlertButton[] = [
      {
        text: '🗺️ Google Maps (Rota Completa)',
        onPress: () => {
          const url = gerarUrlGoogleMapsRotaMultipla(rota.paradas, origemUsuario);
          Linking.openURL(url);
        },
      },
      {
        text: `🚗 Waze (1ª Parada: ${primeiraParada.estabelecimento.nome.slice(0, 18)}...)`,
        onPress: () => {
          const coords = primeiraParada.coordenadasEfetivas;
          abrirWaze(coords.latitude, coords.longitude);
        },
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ];

    Alert.alert(
      `Circuito com ${rota.paradas.length} destinos (${rota.distanciaTotalFormatada})`,
      'Deseja navegar por todo o circuito no Google Maps ou ir até a 1ª parada no Waze?',
      botoes
    );
  };

  return (
    <RoteiroContext.Provider
      value={{
        roteiro,
        isNoRoteiro,
        adicionarAoRoteiro,
        removerDoRoteiro,
        toggleRoteiro,
        limparRoteiro,
        calcularRotaOtimizada,
        iniciarNavegacaoCircuito,
      }}
    >
      {children}
    </RoteiroContext.Provider>
  );
};

export const useRoteiro = () => {
  const context = useContext(RoteiroContext);
  if (!context) {
    throw new Error('useRoteiro deve ser usado dentro de um RoteiroProvider');
  }
  return context;
};
