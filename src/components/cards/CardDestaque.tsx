import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Estabelecimento } from '../../types';
import { THEME } from '../../constants/theme';
import { Tag } from '../common/Tag';
import { TAG_LABELS } from '../../constants/data';
import { useLocation } from '../../context/LocationContext';

interface CardDestaqueProps {
  item: Estabelecimento;
  onPress: () => void;
}

export const CardDestaque: React.FC<CardDestaqueProps> = ({ item, onPress }) => {
  const bgCor = item.cor || THEME.colors.wineRed;
  const [imageError, setImageError] = useState(false);
  const { formatarDistanciaAte } = useLocation();

  const distanciaTexto = formatarDistanciaAte(item.coordenadas, item.cidade);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.imageCover, { backgroundColor: bgCor }]}>
        {item.imagemUrl && !imageError && (
          <Image
            source={{ uri: item.imagemUrl }}
            style={StyleSheet.absoluteFill}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        )}
        <Text style={styles.badgeCategoria}>{item.categoria}</Text>
        {distanciaTexto && (
          <View style={styles.badgeDistancia}>
            <Text style={styles.badgeDistanciaText}>📍 {distanciaTexto}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={styles.city}>📍 {item.cidade}</Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((t, idx) => (
              <Tag key={idx} label={TAG_LABELS[t] || t} />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
  },
  imageCover: {
    height: 90,
    justifyContent: 'flex-end',
    padding: 8,
  },
  badgeCategoria: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: THEME.colors.white,
    fontSize: 9,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeDistancia: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  badgeDistanciaText: {
    color: THEME.colors.white,
    fontSize: 8,
    fontWeight: '700',
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 2,
  },
  city: {
    fontSize: 10,
    color: THEME.colors.gray,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
});
