import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Cidade } from '../../types';
import { THEME } from '../../constants/theme';

interface CardCidadeProps {
  cidade: Cidade;
  isSelected?: boolean;
  onPress: () => void;
}

export const CardCidade: React.FC<CardCidadeProps> = ({ cidade, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
    >
      <Text style={styles.emoji}>{cidade.emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {cidade.nome}
      </Text>
      <Text style={styles.count}>{cidade.estabelecimentos === undefined ? 'Explorar locais' : `${cidade.estabelecimentos} locais`}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    minWidth: 84,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: THEME.colors.wineRed,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  name: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.dark,
    textAlign: 'center',
  },
  count: {
    fontSize: 9,
    color: THEME.colors.gray,
    marginTop: 2,
  },
});
