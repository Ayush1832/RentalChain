import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { MaintenanceTicket } from '../../../types';

export default function MaintenanceScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agreementId, setAgreementId] = useState('');

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get('/agreements').then((r) => r.data.agreements),
  });
  const activeAgreement = agreements?.find((a: any) => a.status === 'ACTIVE');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', activeAgreement?.id],
    queryFn: () => api.get(`/agreements/${activeAgreement!.id}/maintenance`).then((r) => r.data.tickets),
    enabled: !!activeAgreement,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post(`/agreements/${activeAgreement!.id}/maintenance`, { title, description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); setShowForm(false); setTitle(''); setDescription(''); },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Failed'),
  });

  const tickets: MaintenanceTicket[] = data || [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          ListHeaderComponent={
            activeAgreement ? (
              <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.newBtnText}>+ Raise Maintenance Ticket</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <StatusBadge status={item.status} size="sm" />
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.meta}>Priority: {item.priority}</Text>
                <Text style={styles.meta}>{item.createdAt.slice(0, 10)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No maintenance tickets</Text>}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Raise Ticket</Text>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} placeholder="Leaking pipe in kitchen" value={title} onChangeText={setTitle} />
          <Text style={styles.label}>Description *</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Describe the issue in detail…" value={description} onChangeText={setDescription} multiline />
          <TouchableOpacity style={[styles.btn, (!title || !description) && styles.btnDisabled]} onPress={() => createMutation.mutate()} disabled={!title || !description || createMutation.isPending}>
            {createMutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Submit Ticket</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  newBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 6 },
  newBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  cardDesc: { fontSize: 14, color: Colors.gray[600], marginBottom: 10 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: Colors.gray[400] },
  empty: { textAlign: 'center', color: Colors.gray[400], fontSize: 16, marginTop: 60 },
  modal: { flex: 1, padding: 24, backgroundColor: Colors.white },
  modalTitle: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: Colors.gray[500], fontSize: 15 },
});
