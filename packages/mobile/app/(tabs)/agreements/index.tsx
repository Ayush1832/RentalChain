import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { BlockchainBadge } from '../../../components/BlockchainBadge';
import { Agreement } from '../../../types';

function formatPaise(p: number) { return '₹' + (p / 100).toLocaleString('en-IN'); }

export default function AgreementsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get('/agreements').then((r) => r.data.agreements),
  });

  const agreements: Agreement[] = data || [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={agreements}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(tabs)/agreements/${item.id}`)}>
              <View style={styles.cardTop}>
                <StatusBadge status={item.status} />
                <BlockchainBadge txHash={item.blockchainTxHash} />
              </View>
              <Text style={styles.rent}>{formatPaise(item.monthlyRent)}<Text style={styles.perMo}>/mo</Text></Text>
              <Text style={styles.dates}>{item.startDate} → {item.endDate || 'Open-ended'}</Text>
              <View style={styles.sigRow}>
                <Text style={item.landlordSignedAt ? styles.sigDone : styles.sigPending}>Landlord {item.landlordSignedAt ? '✓' : '⏳'}</Text>
                <Text style={item.tenantSignedAt ? styles.sigDone : styles.sigPending}>Tenant {item.tenantSignedAt ? '✓' : '⏳'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No agreements yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  rent: { fontSize: 26, fontWeight: '800', color: Colors.gray[900] },
  perMo: { fontSize: 14, fontWeight: '400', color: Colors.gray[500] },
  dates: { fontSize: 13, color: Colors.gray[500], marginTop: 4, marginBottom: 10 },
  sigRow: { flexDirection: 'row', gap: 16 },
  sigDone: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  sigPending: { fontSize: 13, color: Colors.warning, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.gray[400], fontSize: 16, marginTop: 60 },
});
