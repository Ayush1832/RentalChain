import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';

export default function NewAgreementScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const [form, setForm] = useState({
    propertyId: propertyId || '', tenantId: '', tenantPhone: '',
    monthlyRent: '', securityDeposit: '', startDate: '', endDate: '',
    noticePeriodDays: '30', rentDueDay: '5',
  });

  const lookupMutation = useMutation({
    mutationFn: () => api.get('/users/by-phone', { params: { phone: form.tenantPhone } }),
    onSuccess: (r) => {
      setForm((f) => ({ ...f, tenantId: r.data.user.id }));
      Alert.alert('Tenant Found', `${r.data.user.fullName || 'User'} (${r.data.user.kycStatus})`);
    },
    onError: () => Alert.alert('Not Found', 'No user with that phone number'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/agreements', {
      propertyId: form.propertyId,
      tenantId: form.tenantId,
      monthlyRent: Math.round(parseFloat(form.monthlyRent) * 100),
      securityDeposit: Math.round(parseFloat(form.securityDeposit) * 100),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      noticePeriodDays: parseInt(form.noticePeriodDays),
      rentDueDay: parseInt(form.rentDueDay),
    }),
    onSuccess: (r) => {
      Alert.alert('Created', 'Agreement created. Generate PDF to proceed.', [
        { text: 'View', onPress: () => router.replace(`/(tabs)/agreements/${r.data.agreement.id}`) },
      ]);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed'),
  });

  const F = ({ label, field, ...p }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={form[field as keyof typeof form]} onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))} {...p} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>New Agreement</Text>

      <F label="Property ID *" field="propertyId" placeholder="UUID of property" />

      <Text style={styles.label}>Tenant Phone *</Text>
      <View style={styles.phoneRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="9876543210" value={form.tenantPhone} onChangeText={(v) => setForm((f) => ({ ...f, tenantPhone: v }))} keyboardType="phone-pad" maxLength={10} />
        <TouchableOpacity style={styles.lookupBtn} onPress={() => lookupMutation.mutate()} disabled={lookupMutation.isPending}>
          {lookupMutation.isPending ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.lookupText}>Lookup</Text>}
        </TouchableOpacity>
      </View>
      {form.tenantId && <Text style={styles.tenantFound}>✓ Tenant ID: {form.tenantId.slice(0, 16)}…</Text>}

      <F label="Monthly Rent (₹) *" field="monthlyRent" placeholder="25000" keyboardType="decimal-pad" />
      <F label="Security Deposit (₹) *" field="securityDeposit" placeholder="50000" keyboardType="decimal-pad" />
      <F label="Start Date *" field="startDate" placeholder="2025-02-01" />
      <F label="End Date (optional)" field="endDate" placeholder="2026-01-31" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}><F label="Notice Period (days)" field="noticePeriodDays" keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><F label="Rent Due Day" field="rentDueDay" keyboardType="number-pad" /></View>
      </View>

      <TouchableOpacity
        style={[styles.btn, (createMutation.isPending || !form.tenantId) && styles.btnDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !form.tenantId}
      >
        {createMutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Create Agreement</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  lookupBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  lookupText: { color: Colors.white, fontWeight: '700' },
  tenantFound: { fontSize: 13, color: Colors.success, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
