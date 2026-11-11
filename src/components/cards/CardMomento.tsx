import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { THEME } from '../../constants/theme';
import { EstabelecimentoRecomendado } from '../../utils/recommender';
import { Stars } from '../common/Stars';
import { abrirOpcoesNavegacao } from '../../utils/navigationApps';
import { useRoteiro } from '../../context/RoteiroContext';

interface CardMomentoProps {
  recomendado: EstabelecimentoRecomendado;
  posicaoRank: number;
  onPress: () => void;
}

export const CardMomento: React.FC<CardMomentoProps> = ({
  recomendado,
  posicaoRank,
  onPress,
}) => {
  const { item, scoreFinal, statusOperacional, statusBadgeLabel, motivoRecomendacao, distanciaFormatada } = recomendado;
  const [imageError, setImageError] = useState(false);
  const { isNoRoteiro, toggleRoteiro } = useRoteiro();
  const noRoteiro = isNoRoteiro(item.id);
  const bgCor = item.cor || THEME.colors.wineRed;

  const isSaindoDoForno = statusOperacional === 'proximo_abrir';
  const isAberto = statusOperacional === 'aberto';
  const isFechando = statusOperacional === 'fechamento_iminente';

  const getStatusColor = () => {
    if (isSaindoDoForno) return { bg: '#FFF7ED', border: '#FDBA74', text: '#C2410C' };
    if (isAberto) return { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' };
    if (isFechando) return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' };
    return { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' };
  };

  const statusStyle = getStatusColor();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        isSaindoDoForno && styles.cardSaindoDoForno,
      ]}
    >
      {/* Topo com Rank e Score */}
      <View style={styles.headerRow}>
        <View style={styles.rankWrapper}>
          <Text style={styles.rankText}>#{posicaoRank}</Text>
          <Text style={styles.categoriaTag}>{item.categoria}</Text>
        </View>

        <View style={styles.scoreBadge}>
          <Text style={styles.scoreIcon}>⚡</Text>
          <Text style={styles.scoreNumber}>{scoreFinal}</Text>
          <Text style={styles.scoreUnit}>pts</Text>
        </View>
      </View>

      {/* Corpo com Imagem e Informações Principais */}
      <View style={styles.bodyRow}>
        <View style={[styles.thumbnail, { backgroundColor: bgCor }]}>
          {item.imagemUrl && !imageError ? (
            <Image
              source={{ uri: item.imagemUrl }}
              style={styles.thumbImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.thumbEmoji}>
              {item.categoria === 'Vinícola' ? '🍷' : item.categoria === 'Gastronomia' ? '🍽️' : '🏛️'}
            </Text>
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>
            {item.nome}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.cityText} numberOfLines={1}>
              📍 {item.cidade}
            </Text>
            {distanciaFormatada && (
              <View style={styles.distBadge}>
                <Text style={styles.distBadgeText}>{distanciaFormatada}</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Stars n={item.avaliacao} />
            <Text style={styles.reviewsCount}>
              ({item.totalAvaliacoes || 45})
            </Text>
          </View>
        </View>
      </View>

      {/* Selo Operacional e Ações */}
      <View style={styles.actionRow}>
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusBadgeLabel}
          </Text>
        </View>

        <View style={styles.buttonsGroup}>
          <TouchableOpacity
            style={[styles.btnRoteiro, noRoteiro && styles.btnRoteiroAtivo]}
            activeOpacity={0.8}
            onPress={() => toggleRoteiro(item)}
          >
            <Text style={[styles.btnRoteiroText, noRoteiro && styles.btnRoteiroTextAtivo]}>
              {noRoteiro ? '✓ Roteiro' : '+ Roteiro'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnIrGps}
            activeOpacity={0.8}
            onPress={() => abrirOpcoesNavegacao(item)}
          >
            <Text style={styles.btnIrGpsIcon}>🚗</Text>
            <Text style={styles.btnIrGpsText}>Ir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivo da Recomendação Contextual (Horário + Estação) */}
      <View style={styles.motivoContainer}>
        <Text style={styles.motivoIcon}>✨</Text>
        <Text style={styles.motivoText} numberOfLines={2}>
          {motivoRecomendacao}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  cardSaindoDoForno: {
    borderColor: '#FB923C',
    backgroundColor: '#FFFCFA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.wineRed,
  },
  categoriaTag: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.gray,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  scoreIcon: {
    fontSize: 11,
  },
  scoreNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  scoreUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: THEME.borderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 72,
    height: 72,
  },
  thumbEmoji: {
    fontSize: 28,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 11,
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
    fontWeight: '800',
    color: THEME.colors.wineRed,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsCount: {
    fontSize: 10,
    color: THEME.colors.gray,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  statusBanner: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnRoteiro: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRoteiroAtivo: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  btnRoteiroText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  btnRoteiroTextAtivo: {
    color: '#059669',
  },
  btnIrGps: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnIrGpsIcon: {
    fontSize: 12,
  },
  btnIrGpsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  motivoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  motivoIcon: {
    fontSize: 11,
    marginTop: 1,
  },
  motivoText: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 15,
  },
});
