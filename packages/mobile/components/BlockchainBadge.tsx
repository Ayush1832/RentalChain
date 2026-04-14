import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  txHash?: string | null;
  label?: string;
}

export function BlockchainBadge({ txHash, label = 'On-Chain Verified' }: Props) {
  if (!txHash) {
    return (
      <View style={[styles.badge, styles.pending]}>
        <Text style={[styles.dot, { color: Colors.warning }]}>●</Text>
        <Text style={[styles.text, { color: Colors.warning }]}>Anchoring…</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.verified]}>
      <Text style={[styles.dot, { color: Colors.success }]}>●</Text>
      <Text style={[styles.text, { color: Colors.success }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    alignSelf: 'flex-start',
  },
  pending: { backgroundColor: Colors.warning + '20', borderColor: Colors.warning, borderWidth: 1 },
  verified: { backgroundColor: Colors.success + '20', borderColor: Colors.success, borderWidth: 1 },
  dot: { fontSize: 8 },
  text: { fontSize: 12, fontWeight: '600' },
});
