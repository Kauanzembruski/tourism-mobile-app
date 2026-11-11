import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';

interface TagProps {
  label: string;
}

export const Tag: React.FC<TagProps> = ({ label }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(107, 26, 42, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  text: {
    color: THEME.colors.wineRed,
    fontSize: 10,
    fontWeight: '700',
  },
});
