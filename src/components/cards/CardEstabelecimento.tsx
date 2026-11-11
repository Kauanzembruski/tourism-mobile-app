import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Estabelecimento } from '../../types';
import { THEME } from '../../constants/theme';
import { Stars } from '../common/Stars';
import { useLocation } from '../../context/LocationContext';
import { useRoteiro } from '../../context/RoteiroContext';
import { abrirOpcoesNavegacao } from '../../utils/navigationApps';

interface CardEstabelecimentoProps {
  item: Estabelecimento;
  onPress: () => void;
}

export const CardEstabelecimento: React.FC<CardEstabelecimentoProps> = ({ item, onPress }) => {
  const bgCor = item.cor || THEME.colors.wineRed;
  const [imageError, setImageError] = useState(false);
  const { formatarDistanciaAte } = useLocation();
  const { isNoRoteiro, toggleRoteiro } = useRoteiro();

  const noRoteiro = isNoRoteiro(item.id);
  const distanciaTexto = formatarDistanciaAte(item.coordenadas, item.cidade);

  const getEmojiIcon = (categoria: string) => {
    switch (categoria) {
      case 'Vinícola': return '🍷';
      case 'Gastronomia': return '🍽️';
      case 'Hospedagem': return '🏨';
      case 'Turismo': return '🌿';
      case 'Eventos': return '🎪';
      default: return '🏛️';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, noRoteiro && styles.cardNoRoteiro]}
    >
      <View style={[styles.thumbnail, { backgroundColor: bgCor }]}>
        {item.imagemUrl && !imageError ? (
          <Image
            source={{ uri: item.imagemUrl }}
            style={styles.thumbImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.thumbEmoji}>{getEmojiIcon(item.categoria)}</Text>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={styles.category}>{item.categoria}</Text>
        
        <View style={styles.locationRow}>
          <Text style={styles.city} numberOfLines={1}>📍 {item.cidade}</Text>
          {distanciaTexto && (
            <View style={styles.distBadge}>
              <Text style={styles.distBadgeText}>{distanciaTexto}</Text>
            </View>
          )}
        </View>

        <View style={styles.starsWrapper}>
          <Stars n={item.avaliacao} />
          {item.totalAvaliacoes && (
            <Text style={styles.reviewCount}>({item.totalAvaliacoes})</Text>
          )}
        </View>
      </View>

      <View style={styles.actionColumn}>
        {/* Botão de Adicionar ao Roteiro */}
        <TouchableOpacity
          style={[styles.btnRoteiro, noRoteiro && styles.btnRoteiroAtivo]}
          activeOpacity={0.8}
          onPress={() => toggleRoteiro(item)}
        >
          <Text style={[styles.btnRoteiroIcon, noRoteiro && styles.btnRoteiroIconAtivo]}>
            {noRoteiro ? '✓' : '+'}
          </Text>
          <Text style={[styles.btnRoteiroText, noRoteiro && styles.btnRoteiroTextAtivo]}>
            Rota
          </Text>
        </TouchableOpacity>

        {/* Botão de Navegar com GPS */}
        <TouchableOpacity
          style={styles.btnIrGps}
          activeOpacity={0.8}
          onPress={() => abrirOpcoesNavegacao(item)}
        >
          <Text style={styles.btnIrGpsIcon}>🚗</Text>
          <Text style={styles.btnIrGpsText}>Ir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  thumbnail: {
    width: 80,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: 80,
    height: 90,
  },
  thumbEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.wineRed,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  city: {
    fontSize: 10,
    color: THEME.colors.gray,
    flexShrink: 1,
  },
  distBadge: {
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  distBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.wineRed,
  },
  starsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  reviewCount: {
    fontSize: 9,
    color: THEME.colors.gray,
  },
  cardNoRoteiro: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  actionColumn: {
    paddingRight: 10,
    paddingLeft: 4,
    alignItems: 'center',
    gap: 6,
  },
  btnRoteiro: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
  },
  btnRoteiroAtivo: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  btnRoteiroIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  btnRoteiroIconAtivo: {
    color: '#059669',
  },
  btnRoteiroText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  btnRoteiroTextAtivo: {
    color: '#059669',
  },
  btnIrGps: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
  },
  btnIrGpsIcon: {
    fontSize: 11,
  },
  btnIrGpsText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
});
