import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { BlockchainBadge } from '../../../components/BlockchainBadge';

export default function EvidenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: evidence, isLoading } = useQuery({
    queryKey: ['evidence', id],
    queryFn: () => api.get(`/evidence/${id}`).then((r) => r.data.evidence),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;
  if (!evidence) return <Text style={{ padding: 24 }}>Evidence not found</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.topRow}>
        <StatusBadge status={evidence.evidenceType} />
        <BlockchainBadge txHash={evidence.blockchainTxHash} />
      </View>

      <Text style={styles.date}>{evidence.createdAt.slice(0, 10)}</Text>
      {evidence.description && <Text style={styles.desc}>{evidence.description}</Text>}

      <Text style={styles.sectionTitle}>Photos ({evidence.cloudUrls?.length || 0})</Text>
      <View style={styles.photoGrid}>
        {(evidence.cloudUrls || []).map((url: string, i: number) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(url)}>
            <Image source={{ uri: url }} style={styles.photo} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>

      {evidence.blockchainTxHash && (
        <View style={styles.proofBox}>
          <Text style={styles.proofTitle}>Blockchain Proof</Text>
          <Text style={styles.proofLabel}>Evidence Hash</Text>
          <Text style={styles.hash} numberOfLines={2}>{evidence.evidenceHash}</Text>
          <Text style={styles.proofLabel}>IPFS CID</Text>
          <Text style={styles.hash} numberOfLines={1}>{evidence.ipfsCidBundle}</Text>
          <Text style={styles.proofLabel}>TX Hash</Text>
          <Text style={styles.hash} numberOfLines={1}>{evidence.blockchainTxHash}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`https://sepolia.etherscan.io/tx/${evidence.blockchainTxHash}`)}>
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
  topRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  date: { fontSize: 14, color: Colors.gray[500], marginBottom: 8 },
  desc: { fontSize: 16, color: Colors.gray[700], marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[800], marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  photo: { width: 100, height: 100, borderRadius: 10 },
  proofBox: { backgroundColor: Colors.gray[50], borderRadius: 14, padding: 16 },
  proofTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[800], marginBottom: 12 },
  proofLabel: { fontSize: 12, color: Colors.gray[400], marginBottom: 4, marginTop: 8 },
  hash: { fontSize: 12, color: Colors.gray[700], fontFamily: 'monospace' },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 12 },
});
