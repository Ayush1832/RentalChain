import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';

export default function KYCScreen() {
  const { user, updateUser } = useAuthStore();
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/users/me/kyc', { aadhaarNumber: aadhaar, panNumber: pan, fullName: user?.fullName || '' }),
    onSuccess: () => {
      updateUser({ kycStatus: 'SUBMITTED' });
      Alert.alert('Submitted!', 'KYC submitted for review. You will be notified once verified.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'KYC submission failed'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>KYC Verification</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <StatusBadge status={user?.kycStatus || 'PENDING'} />
        {user?.kycStatus === 'VERIFIED' && <Text style={styles.verifiedNote}>✅ Your identity is verified. You have full access.</Text>}
        {user?.kycStatus === 'SUBMITTED' && <Text style={styles.submittedNote}>⏳ Under review. We'll notify you once verified.</Text>}
        {user?.kycStatus === 'REJECTED' && <Text style={styles.rejectedNote}>❌ Your KYC was rejected. Please resubmit with correct details.</Text>}
      </View>

      {(user?.kycStatus === 'PENDING' || user?.kycStatus === 'REJECTED') && (
        <>
          <View style={styles.encNote}>
            <Text style={styles.encNoteText}>🔒 Your Aadhaar and PAN are encrypted at rest using AES-256. They are never shared or stored in plaintext.</Text>
          </View>

          <Text style={styles.label}>Aadhaar Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="123456789012"
            value={aadhaar}
            onChangeText={setAadhaar}
            keyboardType="number-pad"
            maxLength={12}
          />

          <Text style={styles.label}>PAN Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="ABCDE1234F"
            value={pan}
            onChangeText={(t) => setPan(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
          />

          <TouchableOpacity
            style={[styles.btn, (mutation.isPending || aadhaar.length !== 12 || pan.length !== 10) && styles.btnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending || aadhaar.length !== 12 || pan.length !== 10}
          >
            {mutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Submit KYC</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 20 },
  statusCard: { backgroundColor: Colors.gray[50], borderRadius: 14, padding: 16, marginBottom: 20 },
  statusLabel: { fontSize: 13, color: Colors.gray[500], marginBottom: 8 },
  verifiedNote: { fontSize: 14, color: Colors.success, marginTop: 8 },
  submittedNote: { fontSize: 14, color: Colors.warning, marginTop: 8 },
  rejectedNote: { fontSize: 14, color: Colors.error, marginTop: 8 },
  encNote: { backgroundColor: Colors.primary + '0D', borderRadius: 12, padding: 14, marginBottom: 20 },
  encNoteText: { fontSize: 14, color: Colors.primary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
