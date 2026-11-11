import { isRecord } from '../api/validation';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Coordenadas,
  coordenadasValidas, 
  CidadeCoordenadas,
  calcularDistanciaKm, 
  formatarDistanciaAmigavel, 
  verificaSeEhSerraGaucha, 
  encontrarCidadeMaisProxima,
  obterCoordenadasDaCidade,
  CIDADES_SERRA_GAUCHA
} from '../utils/geo';

const STORAGE_KEY = '@atuaserra_user_location';

export type LocationPermissionStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

export interface UserLocationState {
  coords: Coordenadas | null;
  cidade: string | null;
  bairro: string | null;
  estado: string | null;
  enderecoCurto: string | null;
  isSerraGaucha: boolean;
  cidadeSerraMaisProxima: {
    cidade: CidadeCoordenadas;
    distanciaKm: number;
  } | null;
  status: LocationPermissionStatus;
  errorMessage: string | null;
  atualizarLocalizacao: () => Promise<void>;
  definirCidadeManual: (cidadeNome: string) => void;
  calcularDistanciaAte: (
    destino?: { latitude?: number; longitude?: number } | null,
    cidadeNomeFallback?: string
  ) => number | null;
  formatarDistanciaAte: (
    destino?: { latitude?: number; longitude?: number } | null,
    cidadeNomeFallback?: string
  ) => string | null;
}

const LocationContext = createContext<UserLocationState | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const revision = useRef(0);
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);
  const [bairro, setBairro] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [enderecoCurto, setEnderecoCurto] = useState<string | null>(null);
  const [isSerraGaucha, setIsSerraGaucha] = useState<boolean>(false);
  const [cidadeSerraMaisProxima, setCidadeSerraMaisProxima] = useState<{
    cidade: CidadeCoordenadas;
    distanciaKm: number;
  } | null>(null);
  const [status, setStatus] = useState<LocationPermissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega localização persistida no cache local para inicialização rápida
  useEffect(() => {
    const cacheRevision = revision.current;
    let active = true;
    async function carregarCache() {
      try {
        const salvo = await AsyncStorage.getItem(STORAGE_KEY);
        if (salvo && active && revision.current === cacheRevision) {
          const dados: unknown = JSON.parse(salvo);
          if (!isRecord(dados)) return;
          if (coordenadasValidas(dados.coords)) setCoords(dados.coords);
          if (typeof dados.cidade === 'string') setCidade(dados.cidade);
          if (typeof dados.bairro === 'string') setBairro(dados.bairro);
          if (typeof dados.estado === 'string') setEstado(dados.estado);
          if (typeof dados.enderecoCurto === 'string') setEnderecoCurto(dados.enderecoCurto);
          setIsSerraGaucha(!!dados.isSerraGaucha);
          if (coordenadasValidas(dados.coords)) setCidadeSerraMaisProxima(encontrarCidadeMaisProxima(dados.coords));
        }
      } catch (e) {
        console.warn('[LocationContext] Erro ao carregar cache de localização:');
      }
    }
    void carregarCache().then(() => { if (active && revision.current === cacheRevision) void atualizarLocalizacao(); });
    return () => { active = false; revision.current++; };
  }, []);

  const processarLocalizacao = async (latitude: number, longitude: number, expectedRevision: number) => {
    if (revision.current !== expectedRevision) return;
    const userCoords: Coordenadas = { latitude, longitude };
    if (!coordenadasValidas(userCoords)) throw new Error("Coordenadas inválidas");
    setCoords(userCoords);

    let nomeCidade = "Serra Gaúcha";
    let nomeBairro: string | null = null;
    let siglaEstado = "RS";
    let endereco = "";

    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        nomeCidade = item.city || item.subregion || item.district || "Serra Gaúcha";
        nomeBairro = item.district || null;
        siglaEstado = item.region || "RS";
        endereco = `${nomeCidade}${siglaEstado ? `, ${siglaEstado}` : ''}`;
      }
    } catch (geoError) {
      console.warn('[LocationContext] Reverse geocode não retornou endereço completo:');
    }

    if (revision.current !== expectedRevision) return;
    const ehSerra = verificaSeEhSerraGaucha(nomeCidade);
    const maisProxima = encontrarCidadeMaisProxima(userCoords);

    setCidade(nomeCidade);
    setBairro(nomeBairro);
    setEstado(siglaEstado);
    setEnderecoCurto(endereco || nomeCidade);
    setIsSerraGaucha(ehSerra);
    setCidadeSerraMaisProxima(maisProxima);

    // Salva no AsyncStorage para próxima sessão
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          coords: userCoords,
          cidade: nomeCidade,
          bairro: nomeBairro,
          estado: siglaEstado,
          enderecoCurto: endereco || nomeCidade,
          isSerraGaucha: ehSerra,
          cidadeSerraMaisProxima: maisProxima,
          timestamp: Date.now(),
        })
      );
    } catch {}
  };

  const atualizarLocalizacao = async () => {
    const expectedRevision = ++revision.current;
    try {
      setStatus('loading');
      setErrorMessage(null);

      // 1. Solicita permissão de localização
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (revision.current !== expectedRevision) return;
      if (permStatus !== 'granted') {
        setStatus('denied');
        setErrorMessage('Permissão de localização não concedida');
        return;
      }

      // 2. Tenta obter a última localização conhecida (rápido)
      const lastKnown = await Location.getLastKnownPositionAsync({}).catch(() => null);
      if (lastKnown?.coords) {
        await processarLocalizacao(lastKnown.coords.latitude, lastKnown.coords.longitude, expectedRevision);
      }

      if (revision.current !== expectedRevision) return;
      // 3. Obtém a localização atual precisa
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (pos?.coords) {
        await processarLocalizacao(pos.coords.latitude, pos.coords.longitude, expectedRevision);
        if (revision.current !== expectedRevision) return;
        setStatus('granted');
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível obter as coordenadas');
      }
    } catch (err: unknown) {
      if (revision.current !== expectedRevision) return;
      console.warn('[LocationContext] Erro ao obter localização:');
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao buscar localização');
    }
  };

  // Permite selecionar manualmente a cidade (caso o usuário não queira dar permissão)
  const definirCidadeManual = (cidadeNome: string) => {
    revision.current++;
    setStatus('idle');
    setErrorMessage(null);
    const coordsCidade = obterCoordenadasDaCidade(cidadeNome);
    const ehSerra = verificaSeEhSerraGaucha(cidadeNome);

    setBairro(null);
    setCoords(coordsCidade || null);
    setCidadeSerraMaisProxima(coordsCidade ? encontrarCidadeMaisProxima(coordsCidade) : null);
    setCidade(cidadeNome);
    setEstado('RS');
    setEnderecoCurto(`${cidadeNome}, RS`);
    setIsSerraGaucha(ehSerra);

    if (coordsCidade) {
      setCoords(coordsCidade);
      const maisProxima = encontrarCidadeMaisProxima(coordsCidade);
      setCidadeSerraMaisProxima(maisProxima);
    }
  };

  /**
   * Calcula a distância em km do usuário até o ponto de destino
   */
  const calcularDistanciaAte = (
    destino?: { latitude?: number; longitude?: number } | null,
    cidadeNomeFallback?: string
  ): number | null => {
    if (!coords) return null;

    let destCoords: Coordenadas | undefined = undefined;

    if (coordenadasValidas(destino)) {
      destCoords = { latitude: Number(destino.latitude), longitude: Number(destino.longitude) };
    } else if (cidadeNomeFallback) {
      destCoords = obterCoordenadasDaCidade(cidadeNomeFallback);
    }

    if (!destCoords) return null;

    return calcularDistanciaKm(coords, destCoords);
  };

  /**
   * Formata a distância para exibição (ex: "1.2 km" ou "850 m")
   */
  const formatarDistanciaAte = (
    destino?: { latitude?: number; longitude?: number } | null,
    cidadeNomeFallback?: string
  ): string | null => {
    const dist = calcularDistanciaAte(destino, cidadeNomeFallback);
    if (dist === null) return null;
    return formatarDistanciaAmigavel(dist);
  };

  // Automatic location starts after local hydration, so old cache cannot overwrite GPS.

  return (
    <LocationContext.Provider
      value={{
        coords,
        cidade,
        bairro,
        estado,
        enderecoCurto,
        isSerraGaucha,
        cidadeSerraMaisProxima,
        status,
        errorMessage,
        atualizarLocalizacao,
        definirCidadeManual,
        calcularDistanciaAte,
        formatarDistanciaAte,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): UserLocationState => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation deve ser usado dentro de um LocationProvider');
  }
  return context;
};
