import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { BlockchainBadge } from '../../../components/BlockchainBadge';

function formatPaise(p: number) { return '₹' + (p / 100).toLocaleString('en-IN'); }

export default function AgreementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [otp, setOtp] = useState('');
  const [showSignForm, setShowSignForm] = useState(false);

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement', id],
    queryFn: () => api.get(`/agreements/${id}`).then((r) => r.data.agreement),
  });

  const generatePDF = useMutation({
    mutationFn: () => api.post(`/agreements/${id}/generate-pdf`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agreement', id] }); Alert.alert('Done', 'PDF generated successfully'); },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed'),
  });

  const signMutation = useMutation({
    mutationFn: () => api.post(`/agreements/${id}/sign`, { otp, method: 'OTP' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agreement', id] }); setShowSignForm(false); setOtp(''); Alert.alert('Signed!', 'Agreement signed successfully.'); },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Signing failed'),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;
  if (!agreement) return <Text style={{ padding: 24 }}>Agreement not found</Text>;

  const a = agreement;
  const isLandlord = a.landlordId === user?.id;
  const isTenant = a.tenantId === user?.id;
  const mySignedAt = isLandlord ? a.landlordSignedAt : a.tenantSignedAt;
  const canSign = (isLandlord || isTenant) && !mySignedAt && a.pdfIpfsCid && a.status !== 'ACTIVE';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.topRow}>
        <StatusBadge status={a.status} />
        <BlockchainBadge txHash={a.blockchainTxHash} />
      </View>

      <Text style={styles.rent}>{formatPaise(a.monthlyRent)}<Text style={styles.perMo}>/mo</Text></Text>
      <Text style={styles.dates}>{a.startDate} → {a.endDate || 'Open-ended'}</Text>

      <View style={styles.section}>
        <Row label="Deposit" value={formatPaise(a.securityDeposit)} />
        <Row label="Notice Period" value={`${a.noticePeriodDays} days`} />
        <Row label="Rent Due Day" value={`Day ${a.rentDueDay}`} />
      </View>

      {/* Signing status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signatures</Text>
        <Row label="Landlord" value={a.landlordSignedAt ? `✅ Signed ${a.landlordSignedAt.slice(0, 10)}` : '⏳ Pending'} />
        <Row label="Tenant" value={a.tenantSignedAt ? `✅ Signed ${a.tenantSignedAt.slice(0, 10)}` : '⏳ Pending'} />
      </View>

      {/* Blockchain info */}
      {a.blockchainTxHash && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>On-Chain Proof</Text>
          <Text style={styles.hashLabel}>TX Hash</Text>
          <Text style={styles.hash} numberOfLines={1}>{a.blockchainTxHash}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`https://sepolia.etherscan.io/tx/${a.blockchainTxHash}`)}>
            <Text style={styles.link}>View on Etherscan →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Generate PDF */}
      {isLandlord && !a.pdfIpfsCid && a.status === 'DRAFT' && (
        <TouchableOpacity style={styles.btn} onPress={() => generatePDF.mutate()} disabled={generatePDF.isPending}>
          {generatePDF.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Generate Agreement PDF</Text>}
        </TouchableOpacity>
      )}

      {/* View PDF */}
      {a.pdfCloudUrl && (
        <TouchableOpacity style={styles.btnOutline} onPress={() => Linking.openURL(a.pdfCloudUrl)}>
          <Text style={styles.btnOutlineText}>📄 View PDF</Text>
        </TouchableOpacity>
      )}

      {/* Sign */}
      {canSign && !showSignForm && (
        <TouchableOpacity style={styles.btn} onPress={() => setShowSignForm(true)}>
          <Text style={styles.btnText}>Sign Agreement</Text>
        </TouchableOpacity>
      )}
      {canSign && showSignForm && (
        <View style={styles.signBox}>
          <Text style={styles.signTitle}>Enter OTP to Sign</Text>
          <Text style={styles.signNote}>An OTP will be sent to your registered mobile number.</Text>
          <TextInput style={styles.otpInput} placeholder="123456" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} autoFocus />
          <TouchableOpacity style={[styles.btn, (signMutation.isPending || otp.length !== 6) && styles.btnDisabled]} onPress={() => signMutation.mutate()} disabled={signMutation.isPending || otp.length !== 6}>
            {signMutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Confirm & Sign</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setShowSignForm(false)}>
            <Text style={{ color: Colors.gray[500] }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      {a.status === 'ACTIVE' && (
        <View style={styles.actionRow}>
          {isTenant && (
            <>
              <TouchableOpacity style={styles.actionChip} onPress={() => router.push({ pathname: '/(tabs)/payments/new', params: { agreementId: id } })}>
                <Text style={styles.actionChipText}>💳 Pay Rent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={() => router.push({ pathname: '/(tabs)/evidence/upload', params: { agreementId: id } })}>
                <Text style={styles.actionChipText}>📸 Evidence</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push({ pathname: '/(tabs)/disputes/new', params: { agreementId: id } })}>
            <Text style={styles.actionChipText}>⚖️ Dispute</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  topRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  rent: { fontSize: 34, fontWeight: '800', color: Colors.gray[900] },
  perMo: { fontSize: 16, fontWeight: '400', color: Colors.gray[500] },
  dates: { fontSize: 14, color: Colors.gray[500], marginBottom: 20 },
  section: { backgroundColor: Colors.gray[50], borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[700], marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowLabel: { fontSize: 14, color: Colors.gray[500] },
  rowValue: { fontSize: 14, color: Colors.gray[900], fontWeight: '600' },
  hashLabel: { fontSize: 12, color: Colors.gray[500], marginBottom: 4 },
  hash: { fontSize: 13, color: Colors.gray[800], fontFamily: 'monospace', marginBottom: 6 },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  btn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  btnOutline: { borderWidth: 2, borderColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnOutlineText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  signBox: { backgroundColor: Colors.gray[50], borderRadius: 16, padding: 20, marginBottom: 16 },
  signTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray[900], marginBottom: 6 },
  signNote: { fontSize: 14, color: Colors.gray[500], marginBottom: 16 },
  otpInput: { borderWidth: 2, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 14, fontSize: 28, letterSpacing: 8, textAlign: 'center', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionChip: { backgroundColor: Colors.primary + '15', borderWidth: 1, borderColor: Colors.primary + '40', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  actionChipText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
