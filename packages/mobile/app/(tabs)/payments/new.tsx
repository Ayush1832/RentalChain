import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';

const METHODS = ['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE'];

export default function RecordPaymentScreen() {
  const { agreementId } = useLocalSearchParams<{ agreementId: string }>();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [upiRefId, setUpiRefId] = useState('');
  const [method, setMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      const payload = {
        amount: Math.round(parseFloat(amount) * 100),
        paymentDate,
        paymentMonth,
        upiRefId: upiRefId || undefined,
        paymentMethod: method,
        notes: notes || undefined,
      };
      formData.append('data', JSON.stringify(payload));
      if (receipt) {
        formData.append('receipt', {
          uri: receipt.uri,
          name: `receipt.${receipt.uri.split('.').pop()}`,
          type: `image/${receipt.uri.split('.').pop()}`,
        } as any);
      }
      return api.post(`/agreements/${agreementId}/payments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Payment recorded!', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed to record payment'),
  });

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setReceipt(result.assets[0]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Record Payment</Text>

      <Text style={styles.label}>Amount (₹) *</Text>
      <TextInput style={styles.input} placeholder="25000" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      <Text style={styles.label}>Payment Date *</Text>
      <TextInput style={styles.input} placeholder="2025-01-05" value={paymentDate} onChangeText={setPaymentDate} />

      <Text style={styles.label}>Payment Month *</Text>
      <TextInput style={styles.input} placeholder="2025-01" value={paymentMonth} onChangeText={setPaymentMonth} />

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.methodRow}>
        {METHODS.map((m) => (
          <TouchableOpacity key={m} style={[styles.methodBtn, method === m && styles.methodActive]} onPress={() => setMethod(m)}>
            <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {method === 'UPI' && (
        <>
          <Text style={styles.label}>UPI Reference ID</Text>
          <TextInput style={styles.input} placeholder="UPI123456789" value={upiRefId} onChangeText={setUpiRefId} />
        </>
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="January 2025 rent" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />

      <Text style={styles.label}>Receipt (optional)</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
        <Text style={styles.uploadText}>{receipt ? `✓ ${receipt.uri.split('/').pop()}` : '📷 Attach Receipt Photo'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, (mutation.isPending || !amount) && styles.btnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending || !amount}
      >
        {mutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Record Payment</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  multiline: { height: 72, textAlignVertical: 'top' },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  methodBtn: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  methodActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontSize: 13, color: Colors.gray[600] },
  methodTextActive: { color: Colors.white, fontWeight: '600' },
  uploadBtn: { borderWidth: 2, borderColor: Colors.gray[200], borderRadius: 12, borderStyle: 'dashed', padding: 18, alignItems: 'center', marginBottom: 24 },
  uploadText: { fontSize: 15, color: Colors.gray[500] },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
