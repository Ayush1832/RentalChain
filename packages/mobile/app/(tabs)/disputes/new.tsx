import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';

const TYPES = ['DEPOSIT_REFUND', 'PROPERTY_DAMAGE', 'UNPAID_RENT', 'AGREEMENT_BREACH', 'OTHER'];
const TYPE_LABELS: Record<string, string> = {
  DEPOSIT_REFUND: 'Deposit Refund', PROPERTY_DAMAGE: 'Property Damage',
  UNPAID_RENT: 'Unpaid Rent', AGREEMENT_BREACH: 'Agreement Breach', OTHER: 'Other',
};

export default function NewDisputeScreen() {
  const { agreementId: paramAgreementId } = useLocalSearchParams<{ agreementId?: string }>();
  const [agreementId, setAgreementId] = useState(paramAgreementId || '');
  const [disputeType, setDisputeType] = useState('DEPOSIT_REFUND');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/disputes', { agreementId, disputeType, description }),
    onSuccess: (r) => {
      Alert.alert('Dispute Raised', 'Your dispute has been submitted and is being anchored on blockchain.', [
        { text: 'View', onPress: () => router.replace(`/(tabs)/disputes/${r.data.dispute.id}`) },
      ]);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed to raise dispute'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Raise a Dispute</Text>
      <Text style={styles.warning}>⚠️ Disputes are permanent and anchored on blockchain. Only raise if genuinely unresolved.</Text>

      {!paramAgreementId && (
        <>
          <Text style={styles.label}>Agreement ID *</Text>
          <TextInput style={styles.input} placeholder="UUID of the agreement" value={agreementId} onChangeText={setAgreementId} />
        </>
      )}

      <Text style={styles.label}>Dispute Type *</Text>
      <View style={styles.typeList}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.typeItem, disputeType === t && styles.typeItemActive]} onPress={() => setDisputeType(t)}>
            <View style={[styles.radio, disputeType === t && styles.radioActive]} />
            <Text style={[styles.typeText, disputeType === t && styles.typeTextActive]}>{TYPE_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description * (min 20 characters)</Text>
      <TextInput
        style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
        placeholder="Describe the dispute in detail. Include dates, amounts, and what resolution you expect."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
      />
      <Text style={styles.charCount}>{description.length} characters</Text>

      <TouchableOpacity
        style={[styles.btn, (mutation.isPending || !agreementId || description.length < 20) && styles.btnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending || !agreementId || description.length < 20}
      >
        {mutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Submit Dispute</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 12 },
  warning: { backgroundColor: Colors.error + '10', borderWidth: 1, borderColor: Colors.error + '30', borderRadius: 12, padding: 14, fontSize: 14, color: Colors.error, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  typeList: { marginBottom: 20, gap: 10 },
  typeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, padding: 14 },
  typeItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0A' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.gray[300] },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  typeText: { fontSize: 15, color: Colors.gray[700] },
  typeTextActive: { color: Colors.primary, fontWeight: '600' },
  charCount: { fontSize: 12, color: Colors.gray[400], textAlign: 'right', marginTop: -12, marginBottom: 20 },
  btn: { backgroundColor: Colors.error, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
