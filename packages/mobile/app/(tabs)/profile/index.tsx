import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');

  const { data: reputation } = useQuery({
    queryKey: ['reputation'],
    queryFn: () => api.get('/users/me/reputation').then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put('/users/me', { fullName, email: email || undefined }),
    onSuccess: (r) => { updateUser(r.data.user); setEditing(false); Alert.alert('Saved', 'Profile updated.'); },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed'),
  });

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || '?'}</Text>
      </View>

      <Text style={styles.name}>{user?.fullName || 'No name set'}</Text>
      <Text style={styles.phone}>+91 {user?.phone}</Text>
      <View style={styles.badges}>
        <StatusBadge status={user?.role || ''} size="sm" />
        <StatusBadge status={user?.kycStatus || 'PENDING'} size="sm" />
      </View>

      {/* Reputation */}
      <View style={styles.repCard}>
        <Text style={styles.repLabel}>Reputation Score</Text>
        <Text style={styles.repScore}>{reputation?.score?.toFixed(1) || user?.reputationScore?.toFixed(1) || '0.0'} / 10</Text>
        {reputation?.didHash && (
          <>
            <Text style={styles.didLabel}>Rental ID (DID)</Text>
            <Text style={styles.did} numberOfLines={1}>{reputation.didHash}</Text>
          </>
        )}
      </View>

      {/* Edit Profile */}
      {!editing ? (
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.editForm}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} autoFocus />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnOutline, { flex: 1 }]} onPress={() => setEditing(false)}>
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <MenuItem emoji="🪪" label="KYC Verification" onPress={() => router.push('/(tabs)/profile/kyc')} />
        <MenuItem emoji="📄" label="My Agreements" onPress={() => router.push('/(tabs)/agreements')} />
        <MenuItem emoji="💳" label="Payment History" onPress={() => router.push('/(tabs)/payments')} />
        <MenuItem emoji="⚖️" label="My Disputes" onPress={() => router.push('/(tabs)/disputes')} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  inner: { padding: 24, paddingBottom: 48, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  name: { fontSize: 22, fontWeight: '800', color: Colors.gray[900], textAlign: 'center' },
  phone: { fontSize: 15, color: Colors.gray[500], marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  repCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '100%', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  repLabel: { fontSize: 13, color: Colors.gray[500], marginBottom: 4 },
  repScore: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  didLabel: { fontSize: 12, color: Colors.gray[400] },
  did: { fontSize: 12, fontFamily: 'monospace', color: Colors.gray[600] },
  editBtn: { backgroundColor: Colors.gray[100], paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, marginBottom: 20 },
  editBtnText: { fontSize: 15, fontWeight: '600', color: Colors.gray[700] },
  editForm: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '100%', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  editActions: { flexDirection: 'row', gap: 10 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  btnOutline: { borderWidth: 2, borderColor: Colors.gray[300], paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnOutlineText: { color: Colors.gray[600], fontWeight: '700', fontSize: 15 },
  actions: { backgroundColor: Colors.white, borderRadius: 16, width: '100%', marginBottom: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  menuEmoji: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 16, color: Colors.gray[800] },
  menuArrow: { fontSize: 20, color: Colors.gray[300] },
  logoutBtn: { width: '100%', backgroundColor: Colors.error + '15', borderWidth: 1, borderColor: Colors.error + '30', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 16 },
});
