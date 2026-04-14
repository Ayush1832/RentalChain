import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusColors, Colors } from '../constants/colors';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const color = StatusColors[status] || Colors.gray[400];
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  text: { fontSize: 12, fontWeight: '600' },
  textSm: { fontSize: 11 },
});
