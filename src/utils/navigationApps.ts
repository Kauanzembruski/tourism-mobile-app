import { Linking, Platform, Alert, AlertButton } from 'react-native';
import { coordenadasValidas, obterCoordenadasDaCidade } from './geo';

export interface DestinoNavegacao {
  nome: string;
  cidade?: string;
  endereco?: string;
  coordenadas?: {
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Abre o Waze direcionando diretamente para as coordenadas com navegação ativada
 */
export async function abrirWaze(lat: number, lng: number): Promise<void> {
  const url = `waze://?ll=${lat},${lng}&navigate=yes`;
  const fallbackUrl = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  try {
    const supported = await Linking.canOpenURL('waze://');
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(fallbackUrl);
    }
  } catch {
    await Linking.openURL(fallbackUrl);
  }
}

/**
 * Abre o Google Maps com rota e navegação até o destino
 */
export async function abrirGoogleMaps(lat: number, lng: number, nome?: string): Promise<void> {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  try {
    if (Platform.OS === 'android') {
      const navUrl = `google.navigation:q=${lat},${lng}`;
      const canNav = await Linking.canOpenURL(navUrl);
      if (canNav) {
        await Linking.openURL(navUrl);
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(url);
  }
}

/**
 * Abre o Apple Maps (disponível no iOS)
 */
export async function abrirAppleMaps(lat: number, lng: number, nome?: string): Promise<void> {
  const label = nome ? encodeURIComponent(nome) : 'Destino';
  const url = `maps://?daddr=${lat},${lng}&q=${label}&dirflg=d`;
  const fallbackUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(fallbackUrl);
    }
  } catch {
    await Linking.openURL(fallbackUrl);
  }
}

/**
 * Exibe o seletor nativo e abre o app de direção escolhido (Waze, Google Maps ou Apple Maps)
 */
export function abrirOpcoesNavegacao(destino: DestinoNavegacao): void {
  let lat = destino.coordenadas?.latitude;
  let lng = destino.coordenadas?.longitude;

  // Fallback caso o local não tenha coordenadas exatas cadastradas
  if ((!coordenadasValidas({ latitude: lat, longitude: lng })) && destino.cidade) {
    const coordsCidade = obterCoordenadasDaCidade(destino.cidade);
    if (coordsCidade) {
      lat = coordsCidade.latitude;
      lng = coordsCidade.longitude;
    }
  }

  // Se não encontrar nenhuma coordenada, busca pelo nome no Google Maps
  if (!coordenadasValidas({ latitude: lat, longitude: lng })) {
    const busca = encodeURIComponent(`${destino.nome}, ${destino.cidade || 'Serra Gaúcha'}, RS`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${busca}`);
    return;
  }

  const latitude = lat!;
  const longitude = lng!;

  const botoes: AlertButton[] = [
    {
      text: '🚗 Waze',
      onPress: () => abrirWaze(latitude, longitude),
    },
    {
      text: '🗺️ Google Maps',
      onPress: () => abrirGoogleMaps(latitude, longitude, destino.nome),
    },
  ];

  if (Platform.OS === 'ios') {
    botoes.push({
      text: '🍎 Mapas (Apple)',
      onPress: () => abrirAppleMaps(latitude, longitude, destino.nome),
    });
  }

  botoes.push({
    text: 'Cancelar',
    style: 'cancel',
  });

  Alert.alert(
    `Como deseja ir até ${destino.nome}?`,
    'Selecione seu aplicativo de navegação GPS preferido:',
    botoes
  );
}
