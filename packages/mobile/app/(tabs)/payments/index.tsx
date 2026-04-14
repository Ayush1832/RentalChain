import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { BlockchainBadge } from '../../../components/BlockchainBadge';
import { Payment } from '../../../types';

function formatPaise(p: number) { return '₹' + (p / 100).toLocaleString('en-IN'); }

export default function PaymentsScreen() {
  const { user } = useAuthStore();

  // Get active agreement first, then its payments
  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get('/agreements').then((r) => r.data.agreements),
  });

  const activeAgreement = agreements?.find((a: any) => a.status === 'ACTIVE');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', activeAgreement?.id],
    queryFn: () => api.get(`/agreements/${activeAgreement!.id}/payments`).then((r) => r.data.payments),
    enabled: !!activeAgreement,
  });

  const isTenant = user?.role === 'TENANT' || user?.role === 'BOTH';

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
      ) : !activeAgreement ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No active agreement</Text></View>
      ) : (
        <FlatList
          data={payments || []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          ListHeaderComponent={
            isTenant ? (
              <TouchableOpacity style={styles.recordBtn} onPress={() => router.push({ pathname: '/(tabs)/payments/new', params: { agreementId: activeAgreement.id } })}>
                <Text style={styles.recordBtnText}>+ Record New Payment</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }: { item: Payment }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.amount}>{formatPaise(item.amount)}</Text>
                <StatusBadge status={item.status} size="sm" />
              </View>
              <Text style={styles.month}>{item.paymentMonth} · {item.paymentDate}</Text>
              {item.upiRefId && <Text style={styles.upi}>UPI Ref: {item.upiRefId}</Text>}
              <View style={styles.cardBottom}>
                <BlockchainBadge txHash={item.blockchainTxHash} />
                {item.status === 'PENDING' && user?.role !== 'TENANT' && (
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => api.post(`/payments/${item.id}/confirm`).then(() => {})}>
                    <Text style={styles.confirmText}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No payments recorded yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: Colors.gray[400], fontSize: 16 },
  recordBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 6 },
  recordBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  amount: { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  month: { fontSize: 14, color: Colors.gray[500], marginBottom: 4 },
  upi: { fontSize: 13, color: Colors.gray[500], fontFamily: 'monospace', marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  confirmBtn: { backgroundColor: Colors.success + '20', borderWidth: 1, borderColor: Colors.success, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  confirmText: { color: Colors.success, fontWeight: '600', fontSize: 13 },
});
