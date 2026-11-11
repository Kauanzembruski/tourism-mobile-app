import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { THEME } from '../../constants/theme';
import { Stars } from './Stars';
import { YelpReview } from '../../types';

interface YelpReviewsSectionProps {
  rating: number;
  totalRatings: number;
  reviews: YelpReview[];
  isYelpData: boolean;
  isLoading?: boolean;
  yelpUrl?: string;
}

export const YelpReviewsSection: React.FC<YelpReviewsSectionProps> = ({
  rating,
  totalRatings,
  reviews,
  isYelpData,
  isLoading,
  yelpUrl,
}) => {
  const handleOpenYelp = () => {
    if (yelpUrl) {
      Linking.openURL(yelpUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Avaliações e Notas</Text>
            {isYelpData && (
              <View style={styles.yelpBadge}>
                <Text style={styles.yelpBadgeText}>yelp *</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtext}>
            {isYelpData ? 'Sincronizado em tempo real com o Yelp' : 'Avaliações médias de visitantes'}
          </Text>
        </View>

        {yelpUrl ? (
          <TouchableOpacity onPress={handleOpenYelp} style={styles.linkButton}>
            <Text style={styles.linkText}>Ver no Yelp →</Text>
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
          {isYelpData && (
            <Text style={styles.verifiedTag}>✓ Dados verificados via Yelp Fusion</Text>
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
          {reviews.map((rev) => (
            <TouchableOpacity
              key={rev.id}
              style={styles.reviewCard}
              activeOpacity={rev.url ? 0.7 : 1}
              onPress={() => rev.url && Linking.openURL(rev.url)}
            >
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
                    {rev.dataPublicacao ? (
                      <Text style={styles.timeAgo}>
                        • {rev.dataPublicacao.slice(0, 10)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {rev.texto ? (
                <Text style={styles.reviewText} numberOfLines={4}>
                  "{rev.texto}"
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Atribuição Yelp */}
      {isYelpData && (
        <View style={styles.attributionRow}>
          <Text style={styles.attributionText}>Powered by Yelp Fusion API</Text>
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
  yelpBadge: {
    backgroundColor: '#D32323',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yelpBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    color: '#D32323',
  },
  summaryCard: {
    backgroundColor: THEME.colors.cream,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(211, 35, 35, 0.12)',
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
    color: '#D32323',
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
    backgroundColor: '#D32323',
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
