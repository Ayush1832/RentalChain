import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { BlockchainBadge } from '../../../components/BlockchainBadge';

export default function DisputeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => api.get(`/disputes/${id}`).then((r) => r.data.dispute),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;
  if (!dispute) return <Text style={{ padding: 24 }}>Dispute not found</Text>;

  const d = dispute;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.topRow}>
        <StatusBadge status={d.status} />
        <BlockchainBadge txHash={d.blockchainTxHash} />
      </View>

      <Text style={styles.type}>{d.disputeType.replace(/_/g, ' ')}</Text>
      <Text style={styles.date}>{d.createdAt.slice(0, 10)}</Text>
      <Text style={styles.desc}>{d.description}</Text>

      {d.status === 'RESOLVED' && (
        <View style={styles.resolution}>
          <Text style={styles.resTitle}>Resolution</Text>
          <Text style={styles.outcome}>Outcome: {d.outcome?.replace(/_/g, ' ')}</Text>
          {d.resolutionNotes && <Text style={styles.resNotes}>{d.resolutionNotes}</Text>}
          {d.resolvedAt && <Text style={styles.resDate}>Resolved: {d.resolvedAt.slice(0, 10)}</Text>}
        </View>
      )}

      {d.blockchainTxHash && (
        <View style={styles.proof}>
          <Text style={styles.proofTitle}>Blockchain Proof</Text>
          <Text style={styles.hash} numberOfLines={1}>{d.blockchainTxHash}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`https://sepolia.etherscan.io/tx/${d.blockchainTxHash}`)}>
            <Text style={styles.link}>View on Etherscan →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  topRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  type: { fontSize: 22, fontWeight: '800', color: Colors.gray[900], marginBottom: 4 },
  date: { fontSize: 14, color: Colors.gray[500], marginBottom: 16 },
  desc: { fontSize: 16, color: Colors.gray[700], lineHeight: 24, marginBottom: 20 },
  resolution: { backgroundColor: Colors.success + '10', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.success + '30', marginBottom: 20 },
  resTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[800], marginBottom: 8 },
  outcome: { fontSize: 15, fontWeight: '600', color: Colors.success },
  resNotes: { fontSize: 14, color: Colors.gray[600], marginTop: 8 },
  resDate: { fontSize: 13, color: Colors.gray[400], marginTop: 6 },
  proof: { backgroundColor: Colors.gray[50], borderRadius: 14, padding: 16 },
  proofTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[800], marginBottom: 8 },
  hash: { fontSize: 12, fontFamily: 'monospace', color: Colors.gray[700], marginBottom: 8 },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
