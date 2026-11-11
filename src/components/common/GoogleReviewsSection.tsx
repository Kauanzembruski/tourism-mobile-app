import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { THEME } from '../../constants/theme';
import { Stars } from './Stars';
import { GoogleReview } from '../../types';

interface GoogleReviewsSectionProps {
  rating: number;
  totalRatings: number;
  reviews: GoogleReview[];
  isGoogleData: boolean;
  isLoading?: boolean;
  googleMapsUrl?: string;
}

export const GoogleReviewsSection: React.FC<GoogleReviewsSectionProps> = ({
  rating,
  totalRatings,
  reviews,
  isGoogleData,
  isLoading,
  googleMapsUrl,
}) => {
  const handleOpenGoogleMaps = () => {
    if (googleMapsUrl) {
      Linking.openURL(googleMapsUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Avaliações e Notas</Text>
            {isGoogleData && (
              <View style={styles.googleBadge}>
                <Text style={styles.googleBadgeText}>G Google</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtext}>
            {isGoogleData ? 'Sincronizado em tempo real com o Google Places' : 'Avaliações médias de visitantes'}
          </Text>
        </View>

        {googleMapsUrl ? (
          <TouchableOpacity onPress={handleOpenGoogleMaps} style={styles.linkButton}>
            <Text style={styles.linkText}>Ver no Google →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Card Resumo da Nota */}
      <View style={styles.summaryCard}>
        <View style={styles.scoreBox}>
          <Text style={styles.bigScore}>{rating.toFixed(1)}</Text>
          <Stars n={rating} showNumber={false} />
          <Text style={styles.totalCount}>
            {totalRatings > 0 ? `${totalRatings} avaliações` : 'Sem avaliações recentes'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.highlightsBox}>
          <Text style={styles.highlightTitle}>Experiência no local</Text>
          <Text style={styles.highlightDesc}>
            {rating >= 4.5
              ? 'Classificado como excelente pela maioria dos visitantes.'
              : rating >= 4.0
              ? 'Muito bem avaliado pelo público.'
              : 'Opção com boa aceitação dos turistas.'}
          </Text>
          {isGoogleData && (
            <Text style={styles.verifiedTag}>✓ Dados verificados via Google Places</Text>
          )}
        </View>
      </View>

      {/* Lista de Comentários / Reviews */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Carregando avaliações em tempo real...</Text>
        </View>
      ) : reviews && reviews.length > 0 ? (
        <View style={styles.reviewsList}>
          {reviews.slice(0, 4).map((rev, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                {rev.autorFoto ? (
                  <Image source={{ uri: rev.autorFoto }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(rev.autorNome || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.authorInfo}>
                  <Text style={styles.authorName} numberOfLines={1}>
                    {rev.autorNome}
                  </Text>
                  <View style={styles.authorMeta}>
                    <Stars n={rev.avaliacao} showNumber={false} />
                    {rev.tempoRelativo ? (
                      <Text style={styles.timeAgo}>• {rev.tempoRelativo}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {rev.texto ? (
                <Text style={styles.reviewText} numberOfLines={4}>
                  "{rev.texto}"
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Rodapé Obrigatório de Atribuição */}
      {isGoogleData && (
        <View style={styles.attributionRow}>
          <Text style={styles.attributionText}>Powered by Google</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  googleBadge: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  googleBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 11,
    color: THEME.colors.gray,
    marginTop: 2,
  },
  linkButton: {
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.wineRed,
  },
  summaryCard: {
    backgroundColor: THEME.colors.cream,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 26, 42, 0.08)',
    marginBottom: 12,
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 14,
    minWidth: 90,
  },
  bigScore: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.wineRed,
    marginBottom: 2,
  },
  totalCount: {
    fontSize: 10,
    color: THEME.colors.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginRight: 14,
  },
  highlightsBox: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 11,
    color: THEME.colors.darkMid,
    lineHeight: 16,
  },
  verifiedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 4,
  },
  loadingBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: THEME.colors.gray,
    fontStyle: 'italic',
  },
  reviewsList: {
    gap: 10,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: THEME.colors.grayLight,
    padding: 12,
    borderRadius: THEME.borderRadius.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.wineRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 10,
    color: THEME.colors.gray,
  },
  reviewText: {
    fontSize: 11,
    color: THEME.colors.darkMid,
    lineHeight: 16,
    marginTop: 2,
  },
  attributionRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  attributionText: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.colors.grayMid,
  },
});
