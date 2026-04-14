import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';
import { UserRole } from '../../types';

type Step = 'role' | 'profile' | 'kyc' | 'done';

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'TENANT', label: '🏠 Tenant', desc: 'I am looking to rent a property' },
  { value: 'LANDLORD', label: '🏢 Landlord', desc: 'I want to list my property' },
  { value: 'BOTH', label: '🔄 Both', desc: 'I rent and also own property' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

  async function handleProfileSave() {
    if (!fullName.trim()) { Alert.alert('Required', 'Enter your full name'); return; }
    setLoading(true);
    try {
      const res = await api.put('/users/me', { fullName, email: email || undefined, role: role! });
      updateUser(res.data.user);
      setStep('kyc');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleKYCSubmit() {
    if (aadhaar.length !== 12) { Alert.alert('Invalid Aadhaar', 'Enter 12-digit Aadhaar number'); return; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) { Alert.alert('Invalid PAN', 'Enter valid PAN (e.g. ABCDE1234F)'); return; }
    setLoading(true);
    try {
      await api.post('/users/me/kyc', { aadhaarNumber: aadhaar, panNumber: pan, fullName });
      updateUser({ kycStatus: 'SUBMITTED' });
      setStep('done');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error?.message || 'KYC submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneIcon}>🎉</Text>
        <Text style={styles.doneTitle}>You're all set!</Text>
        <Text style={styles.doneSubtitle}>Your KYC is under review. You'll be notified once verified.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/dashboard')}>
          <Text style={styles.btnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      {/* Progress */}
      <View style={styles.progress}>
        {(['role', 'profile', 'kyc'] as Step[]).map((s, i) => (
          <View key={s} style={[styles.dot, step === s && styles.dotActive, (['role', 'profile', 'kyc'] as Step[]).indexOf(step) > i && styles.dotDone]} />
        ))}
      </View>

      {step === 'role' && (
        <>
          <Text style={styles.title}>I am a…</Text>
          {ROLES.map((r) => (
            <TouchableOpacity key={r.value} style={[styles.roleCard, role === r.value && styles.roleCardActive]} onPress={() => setRole(r.value)}>
              <Text style={styles.roleLabel}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.btn, !role && styles.btnDisabled]} onPress={() => role && setStep('profile')} disabled={!role}>
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'profile' && (
        <>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} placeholder="Rahul Sharma" value={fullName} onChangeText={setFullName} autoFocus />
          <Text style={styles.label}>Email (optional)</Text>
          <TextInput style={styles.input} placeholder="rahul@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={[styles.btn, (loading || !fullName) && styles.btnDisabled]} onPress={handleProfileSave} disabled={loading || !fullName}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Save & Continue</Text>}
          </TouchableOpacity>
        </>
      )}

      {step === 'kyc' && (
        <>
          <Text style={styles.title}>KYC Verification</Text>
          <Text style={styles.kycNote}>Your data is encrypted at rest and never shared. Required by law.</Text>
          <Text style={styles.label}>Aadhaar Number *</Text>
          <TextInput style={styles.input} placeholder="123456789012" value={aadhaar} onChangeText={setAadhaar} keyboardType="number-pad" maxLength={12} />
          <Text style={styles.label}>PAN Number *</Text>
          <TextInput style={styles.input} placeholder="ABCDE1234F" value={pan} onChangeText={(t) => setPan(t.toUpperCase())} autoCapitalize="characters" maxLength={10} />
          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleKYCSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Submit KYC</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/dashboard')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 24, paddingBottom: 48 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray[200] },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  dotDone: { backgroundColor: Colors.success },
  title: { fontSize: 26, fontWeight: '800', color: Colors.gray[900], marginBottom: 24 },
  roleCard: { borderWidth: 2, borderColor: Colors.gray[200], borderRadius: 14, padding: 18, marginBottom: 12 },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0D' },
  roleLabel: { fontSize: 18, fontWeight: '700', color: Colors.gray[900] },
  roleDesc: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  kycNote: { backgroundColor: Colors.primary + '0D', borderRadius: 10, padding: 12, color: Colors.primary, fontSize: 13, marginBottom: 20 },
  skipBtn: { marginTop: 16, alignItems: 'center' },
  skipText: { color: Colors.gray[500], fontSize: 15 },
  doneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: Colors.white },
  doneIcon: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: Colors.gray[900], marginBottom: 12 },
  doneSubtitle: { fontSize: 16, color: Colors.gray[500], textAlign: 'center', marginBottom: 32 },
});
