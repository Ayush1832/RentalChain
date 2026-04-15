import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';
import { StatusBadge } from '../../components/StatusBadge';

function formatPaise(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'BOTH';
  const isTenant = user?.role === 'TENANT' || user?.role === 'BOTH';

  const { data: agreementsData, isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get('/agreements').then((r) => r.data.agreements),
  });

  const activeAgreement = agreementsData?.find((a: any) => a.status === 'ACTIVE');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetText}>Hello, {user?.fullName?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.roleText}>{user?.role} · KYC: {user?.kycStatus}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* KYC Banner */}
      {user?.kycStatus !== 'VERIFIED' && (
        <TouchableOpacity style={styles.kycBanner} onPress={() => router.push('/(tabs)/profile/kyc')}>
          <Text style={styles.kycBannerText}>
            {user?.kycStatus === 'PENDING' ? '⚠️ Complete KYC to unlock all features' : user?.kycStatus === 'SUBMITTED' ? '⏳ KYC under review' : '❌ KYC rejected — resubmit'}
          </Text>
          <Text style={styles.kycBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Active Rental Card */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ margin: 24 }} />
      ) : activeAgreement ? (
        <TouchableOpacity style={styles.rentalCard} onPress={() => router.push(`/(tabs)/agreements/${activeAgreement.id}`)}>
          <Text style={styles.cardLabel}>Active Rental</Text>
          <Text style={styles.rentalRent}>{formatPaise(activeAgreement.monthlyRent)}<Text style={styles.perMonth}>/mo</Text></Text>
          <Text style={styles.rentalDates}>{activeAgreement.startDate} → {activeAgreement.endDate || 'Open-ended'}</Text>
          <StatusBadge status={activeAgreement.status} />
        </TouchableOpacity>
      ) : (
        <View style={styles.noRentalCard}>
          <Text style={styles.noRentalText}>No active rental agreement</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        {isTenant && activeAgreement && (
          <>
            <ActionBtn emoji="💳" label="Pay Rent" onPress={() => router.push({ pathname: '/(tabs)/payments/new', params: { agreementId: activeAgreement.id } })} />
            <ActionBtn emoji="📸" label="Upload Evidence" onPress={() => router.push({ pathname: '/(tabs)/evidence/upload', params: { agreementId: activeAgreement.id } })} />
            <ActionBtn emoji="🔧" label="Maintenance" onPress={() => router.push('/(tabs)/maintenance')} />
          </>
        )}
        {isLandlord && (
          <>
            <ActionBtn emoji="🏢" label="My Properties" onPress={() => router.push('/(tabs)/properties/index')} />
            <ActionBtn emoji="➕" label="Add Property" onPress={() => router.push('/(tabs)/properties/new')} />
          </>
        )}
        <ActionBtn emoji="⚖️" label="Disputes" onPress={() => router.push('/(tabs)/disputes')} />
        <ActionBtn emoji="📄" label="Agreements" onPress={() => router.push('/(tabs)/agreements')} />
      </View>

      {/* Reputation */}
      <View style={styles.repCard}>
        <Text style={styles.repLabel}>Reputation Score</Text>
        <Text style={styles.repScore}>{user?.reputationScore?.toFixed(1) || '—'} / 10</Text>
        {user?.didHash && <Text style={styles.didText}>DID: {user.didHash.slice(0, 18)}…</Text>}
      </View>
    </ScrollView>
  );
}

function ActionBtn({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  inner: { padding: 20, paddingBottom: 40 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetText: { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  roleText: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  logoutBtn: { backgroundColor: Colors.gray[100], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { fontSize: 13, color: Colors.gray[600] },
  kycBanner: { backgroundColor: Colors.warning + '1A', borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.warning + '40' },
  kycBannerText: { fontSize: 14, color: Colors.warning, flex: 1 },
  kycBannerArrow: { fontSize: 16, color: Colors.warning },
  rentalCard: { backgroundColor: Colors.primary, borderRadius: 18, padding: 22, marginBottom: 20 },
  cardLabel: { fontSize: 12, fontWeight: '600', color: Colors.white + '99', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  rentalRent: { fontSize: 32, fontWeight: '800', color: Colors.white },
  perMonth: { fontSize: 16, fontWeight: '400' },
  rentalDates: { fontSize: 14, color: Colors.white + 'CC', marginBottom: 10, marginTop: 4 },
  noRentalCard: { backgroundColor: Colors.gray[100], borderRadius: 18, padding: 22, marginBottom: 20, alignItems: 'center' },
  noRentalText: { fontSize: 15, color: Colors.gray[500] },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray[800], marginBottom: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionBtn: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', width: '47%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  actionEmoji: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray[700] },
  repCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  repLabel: { fontSize: 13, color: Colors.gray[500], marginBottom: 4 },
  repScore: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  didText: { fontSize: 12, color: Colors.gray[400], marginTop: 6, fontFamily: 'monospace' },
});
