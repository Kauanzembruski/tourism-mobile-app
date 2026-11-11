import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Noticia } from '../../types';
import { THEME } from '../../constants/theme';

interface CardNoticiaProps {
  noticia: Noticia;
  onPress?: () => void;
}

export const CardNoticia: React.FC<CardNoticiaProps> = ({ noticia, onPress }) => {
  const dataFormatada = noticia.published_at
    ? new Date(noticia.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : '';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      {noticia.cover ? (
        <Image source={{ uri: noticia.cover }} style={styles.imageCover} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>📰</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.metaRow}>
          {noticia.featured && <Text style={styles.badgeDestaque}>⭐ DESTAQUE</Text>}
          {dataFormatada ? <Text style={styles.dateText}>{dataFormatada}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {noticia.title}
        </Text>
        {noticia.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {noticia.summary}
          </Text>
        ) : null}
        <Text style={styles.readMore}>Ler notícia →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginRight: 14,
  },
  imageCover: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: THEME.colors.wineRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  content: {
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeDestaque: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dateText: {
    fontSize: 10,
    color: THEME.colors.gray,
    fontWeight: '600',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
    lineHeight: 18,
    marginBottom: 4,
  },
  summary: {
    fontSize: 11,
    color: THEME.colors.gray,
    lineHeight: 15,
    marginBottom: 6,
  },
  readMore: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.wineRed,
  },
});
