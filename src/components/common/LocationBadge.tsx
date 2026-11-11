import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { THEME } from '../../constants/theme';
import { formatarDistanciaAmigavel } from '../../utils/geo';

export const LocationBadge: React.FC = () => {
  const {
    cidade,
    estado,
    isSerraGaucha,
    cidadeSerraMaisProxima,
    status,
    atualizarLocalizacao,
  } = useLocation();

  const handlePress = () => {
    atualizarLocalizacao();
  };

  const isLoading = status === 'loading';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label}>
            {status === 'granted' || cidade ? "LOCALIZAÇÃO ATUAL" : "LOCALIZAÇÃO"}
          </Text>
          {isSerraGaucha && (
            <View style={styles.serraBadge}>
              <Text style={styles.serraBadgeText}>● Serra Gaúcha</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.pinIcon}>📍</Text>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={THEME.colors.white} />
              <Text style={styles.locationText}>Identificando onde você está...</Text>
            </View>
          ) : cidade ? (
            <View style={styles.textContainer}>
              <Text style={styles.locationText} numberOfLines={1}>
                {cidade}{estado ? `, ${estado}` : ''}
              </Text>
              {!isSerraGaucha && cidadeSerraMaisProxima && (
                <Text style={styles.subDistText}>
                  A {formatarDistanciaAmigavel(cidadeSerraMaisProxima.distanciaKm)} de {cidadeSerraMaisProxima.cidade.nome}
                </Text>
              )}
            </View>
          ) : status === 'denied' ? (
            <Text style={styles.actionText}>Toque para ativar localização GPS</Text>
          ) : (
            <Text style={styles.actionText}>Toque para identificar sua localização</Text>
          )}
        </View>
      </View>

      <View style={styles.refreshIconWrapper}>
        <Text style={styles.refreshIcon}>🔄</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.6,
  },
  serraBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  serraBadgeText: {
    color: THEME.colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinIcon: {
    fontSize: 13,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textContainer: {
    flex: 1,
  },
  locationText: {
    color: THEME.colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  subDistText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  actionText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  refreshIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 12,
  },
});
