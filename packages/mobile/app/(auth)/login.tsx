import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown(seconds = 300) {
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSendOTP() {
    if (phone.length !== 10) { Alert.alert('Invalid phone', 'Enter a 10-digit Indian mobile number.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setStep('otp');
      startCountdown(300);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      const { user, accessToken, refreshToken } = res.data;
      await setAuth(user, accessToken, refreshToken);
      if (!user.fullName) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const canResend = countdown === 0 && step === 'otp';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔗 RentalChain</Text>
          <Text style={styles.tagline}>Blockchain-secured rentals for India</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>Enter your 10-digit mobile number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}><Text style={styles.countryText}>+91</Text></View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, (loading || phone.length !== 10) && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={loading || phone.length !== 10}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Send OTP</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>Sent to +91 {phone}</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
              {countdown > 0 && (
                <Text style={styles.timer}>OTP expires in {minutes}:{seconds.toString().padStart(2, '0')}</Text>
              )}
              <TouchableOpacity
                style={[styles.btn, (loading || otp.length !== 6) && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Verify & Continue</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resendBtn, !canResend && styles.resendDisabled]}
                onPress={canResend ? () => { setOtp(''); handleSendOTP(); } : undefined}
                disabled={!canResend}
              >
                <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                  {canResend ? 'Resend OTP' : `Resend in ${minutes}:${seconds.toString().padStart(2, '0')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }}>
                <Text style={styles.changePhone}>← Change number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>By continuing you agree to our Terms of Service</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 28, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 14, color: Colors.white + 'CC', marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.gray[900], marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  phoneRow: { flexDirection: 'row', marginBottom: 20 },
  countryCode: { backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', marginRight: 8 },
  countryText: { fontSize: 16, fontWeight: '600', color: Colors.gray[700] },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  otpInput: { fontSize: 28, letterSpacing: 8, textAlign: 'center' },
  timer: { textAlign: 'center', color: Colors.gray[500], fontSize: 13, marginBottom: 16 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendDisabled: { opacity: 0.5 },
  resendText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  resendTextDisabled: { color: Colors.gray[400] },
  changePhone: { color: Colors.gray[500], fontSize: 14, textAlign: 'center', marginTop: 12 },
  footer: { textAlign: 'center', color: Colors.white + '99', fontSize: 12, marginTop: 24 },
});
