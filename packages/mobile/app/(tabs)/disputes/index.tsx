import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { BlockchainBadge } from '../../../components/BlockchainBadge';
import { Dispute } from '../../../types';

const DISPUTE_LABELS: Record<string, string> = {
  DEPOSIT_REFUND: 'Deposit Refund', PROPERTY_DAMAGE: 'Property Damage',
  UNPAID_RENT: 'Unpaid Rent', AGREEMENT_BREACH: 'Agreement Breach', OTHER: 'Other',
};

export default function DisputesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => api.get('/disputes').then((r) => r.data.disputes),
  });

  const disputes: Dispute[] = data || [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          ListHeaderComponent={
            <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(tabs)/disputes/new')}>
              <Text style={styles.newBtnText}>+ Raise a Dispute</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(tabs)/disputes/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.type}>{DISPUTE_LABELS[item.disputeType]}</Text>
                <StatusBadge status={item.status} size="sm" />
              </View>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.date}>{item.createdAt.slice(0, 10)}</Text>
                <BlockchainBadge txHash={item.blockchainTxHash} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No disputes raised</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  newBtn: { backgroundColor: Colors.error, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 6 },
  newBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  type: { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  desc: { fontSize: 14, color: Colors.gray[600], marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: Colors.gray[400] },
  empty: { textAlign: 'center', color: Colors.gray[400], fontSize: 16, marginTop: 60 },
});
