import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';

export default function NewPropertyScreen() {
  const [form, setForm] = useState({
    title: '', city: '', state: '', pincode: '', addressLine1: '',
    propertyType: 'APARTMENT', bedrooms: '', bathrooms: '', areaSqft: '',
    monthlyRent: '', securityDeposit: '', description: '',
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/properties', {
      title: form.title,
      addressLine1: form.addressLine1,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      propertyType: form.propertyType,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
      areaSqft: form.areaSqft ? parseInt(form.areaSqft) : undefined,
      monthlyRent: Math.round(parseFloat(form.monthlyRent) * 100),
      securityDeposit: form.securityDeposit ? Math.round(parseFloat(form.securityDeposit) * 100) : 0,
      description: form.description || undefined,
    }),
    onSuccess: (res) => {
      Alert.alert('Success', 'Property listed!', [{ text: 'OK', onPress: () => router.push(`/(tabs)/properties/${res.data.property.id}`) }]);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed to create property'),
  });

  const Field = ({ label, field, ...props }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={form[field as keyof typeof form]} onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))} {...props} />
    </View>
  );

  const TYPES = ['APARTMENT', 'HOUSE', 'PG', 'COMMERCIAL'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>List a Property</Text>

      <Field label="Title *" field="title" placeholder="2BHK in Koramangala" />
      <Field label="Address Line 1 *" field="addressLine1" placeholder="123 5th Block" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Field label="City *" field="city" placeholder="Bangalore" /></View>
        <View style={{ flex: 1 }}><Field label="State *" field="state" placeholder="Karnataka" /></View>
      </View>
      <Field label="Pincode *" field="pincode" placeholder="560034" keyboardType="number-pad" maxLength={6} />

      <Text style={styles.label}>Property Type *</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.typeBtn, form.propertyType === t && styles.typeBtnActive]} onPress={() => setForm((f) => ({ ...f, propertyType: t }))}>
            <Text style={[styles.typeText, form.propertyType === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}><Field label="Bedrooms" field="bedrooms" placeholder="2" keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label="Bathrooms" field="bathrooms" placeholder="2" keyboardType="number-pad" /></View>
      </View>
      <Field label="Area (sqft)" field="areaSqft" placeholder="900" keyboardType="number-pad" />
      <Field label="Monthly Rent (₹) *" field="monthlyRent" placeholder="25000" keyboardType="decimal-pad" />
      <Field label="Security Deposit (₹)" field="securityDeposit" placeholder="50000" keyboardType="decimal-pad" />
      <Field label="Description" field="description" placeholder="Describe your property…" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />

      <TouchableOpacity style={[styles.btn, mutation.isPending && styles.btnDisabled]} onPress={() => mutation.mutate()} disabled={mutation.isPending || !form.title || !form.city || !form.monthlyRent}>
        {mutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>List Property</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeBtn: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: 13, color: Colors.gray[600] },
  typeTextActive: { color: Colors.white, fontWeight: '600' },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
