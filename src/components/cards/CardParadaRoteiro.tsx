import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { THEME } from '../../constants/theme';
import { ParadaRoteiro } from '../../utils/routeOptimizer';
import { abrirOpcoesNavegacao } from '../../utils/navigationApps';

interface CardParadaRoteiroProps {
  parada: ParadaRoteiro;
  isUltima: boolean;
  onPressItem: () => void;
  onRemover: () => void;
}

export const CardParadaRoteiro: React.FC<CardParadaRoteiroProps> = ({
  parada,
  isUltima,
  onPressItem,
  onRemover,
}) => {
  const { estabelecimento, ordem, distanciaDoAnteriorFormatada } = parada;
  const [imageError, setImageError] = useState(false);
  const bgCor = estabelecimento.cor || THEME.colors.wineRed;

  return (
    <View style={styles.container}>
      {/* Indicador Vertical da Linha do Tempo */}
      <View style={styles.timelineCol}>
        <View style={styles.pinWrapper}>
          <Text style={styles.pinNumber}>{ordem}</Text>
        </View>
        {!isUltima && <View style={styles.timelineLine} />}
      </View>

      {/* Card da Parada */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPressItem}
        style={styles.card}
      >
        {/* Topo do Card com Número e Distância */}
        <View style={styles.headerRow}>
          <View style={styles.badgeParada}>
            <Text style={styles.badgeParadaText}>{ordem}ª PARADA</Text>
          </View>

          {ordem > 1 ? (
            <View style={styles.distBadge}>
              <Text style={styles.distBadgeText}>+ {distanciaDoAnteriorFormatada}</Text>
            </View>
          ) : (
            <View style={styles.startBadge}>
              <Text style={styles.startBadgeText}>Partida Inicial</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.btnRemove}
            onPress={onRemover}
            activeOpacity={0.7}
          >
            <Text style={styles.btnRemoveText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Informações Principais */}
        <View style={styles.bodyRow}>
          <View style={[styles.thumbnail, { backgroundColor: bgCor }]}>
            {estabelecimento.imagemUrl && !imageError ? (
              <Image
                source={{ uri: estabelecimento.imagemUrl }}
                style={styles.thumbImage}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.thumbEmoji}>
                {estabelecimento.categoria === 'Vinícola' ? '🍷' : estabelecimento.categoria === 'Gastronomia' ? '🍽️' : '📍'}
              </Text>
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.name} numberOfLines={1}>
              {estabelecimento.nome}
            </Text>
            <Text style={styles.category}>{estabelecimento.categoria}</Text>
            <Text style={styles.city} numberOfLines={1}>
              📍 {estabelecimento.cidade}
            </Text>
          </View>

          {/* Botão de Navegação Direta */}
          <TouchableOpacity
            style={styles.btnGps}
            activeOpacity={0.8}
            onPress={() => abrirOpcoesNavegacao(estabelecimento)}
          >
            <Text style={styles.btnGpsIcon}>🚗</Text>
            <Text style={styles.btnGpsText}>Ir</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  pinWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.wineRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 2,
  },
  pinNumber: {
    color: THEME.colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },
  card: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeParada: {
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeParadaText: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.colors.wineRed,
    letterSpacing: 0.3,
  },
  distBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E40AF',
  },
  startBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  startBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  btnRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRemoveText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.gray,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 48,
    height: 48,
  },
  thumbEmoji: {
    fontSize: 22,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 2,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.wineRed,
  },
  city: {
    fontSize: 10,
    color: THEME.colors.gray,
    marginTop: 1,
  },
  btnGps: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnGpsIcon: {
    fontSize: 12,
  },
  btnGpsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
});
