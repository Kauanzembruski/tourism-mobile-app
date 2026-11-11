import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';

interface StarsProps {
  n: number;
  showNumber?: boolean;
}

export const Stars: React.FC<StarsProps> = ({ n, showNumber = true }) => {
  const rating = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;
  const fullStars = Math.floor(rating);
  const emptyStars = Math.max(0, 5 - fullStars);

  return (
    <View style={styles.container}>
      <Text style={styles.stars}>
        {"★".repeat(fullStars)}
        {"☆".repeat(emptyStars)}
      </Text>
      {showNumber && <Text style={styles.number}>{rating > 0 ? rating.toFixed(1) : 'Sem avaliações'}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    color: THEME.colors.gold,
    fontSize: 13,
    letterSpacing: 1,
  },
  number: {
    color: THEME.colors.gray,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
});
