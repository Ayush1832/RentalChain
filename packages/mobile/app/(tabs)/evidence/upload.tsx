import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../services/api';
import { Colors } from '../../../constants/colors';

const TYPES = ['MOVE_IN', 'MOVE_OUT', 'MAINTENANCE', 'INSPECTION'];
const TYPE_LABELS: Record<string, string> = {
  MOVE_IN: '🏠 Move-In', MOVE_OUT: '📦 Move-Out', MAINTENANCE: '🔧 Maintenance', INSPECTION: '🔍 Inspection',
};

export default function UploadEvidenceScreen() {
  const { agreementId } = useLocalSearchParams<{ agreementId: string }>();
  const [evidenceType, setEvidenceType] = useState('MOVE_IN');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const { TextInput } = require('react-native');

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos((prev) => [...prev, ...result.assets].slice(0, 20));
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setPhotos((prev) => [...prev, result.assets[0]].slice(0, 20));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ evidenceType, description: description || undefined }));
      photos.forEach((photo, i) => {
        const ext = photo.uri.split('.').pop() || 'jpg';
        formData.append('photos', { uri: photo.uri, name: `photo-${i + 1}.${ext}`, type: `image/${ext}` } as any);
      });
      return api.post(`/agreements/${agreementId}/evidence/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (r) => {
      Alert.alert('Uploaded!', `${photos.length} photos uploaded. Blockchain anchoring in progress.`, [
        { text: 'View Evidence', onPress: () => router.push(`/(tabs)/evidence/${r.data.evidence.id}`) },
        { text: 'Back', onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.error?.message || 'Upload failed'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Upload Evidence</Text>

      <Text style={styles.label}>Evidence Type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.typeBtn, evidenceType === t && styles.typeActive]} onPress={() => setEvidenceType(t)}>
            <Text style={[styles.typeText, evidenceType === t && styles.typeTextActive]}>{TYPE_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
        placeholder="Describe the evidence…"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Photos ({photos.length}/20)</Text>
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhotos}>
          <Text style={styles.photoBtnText}>📁 Choose Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
          <Text style={styles.photoBtnText}>📷 Take Photo</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoWrapper}>
              <Image source={{ uri: p.uri }} style={styles.photo} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, (mutation.isPending || photos.length === 0) && styles.btnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending || photos.length === 0}
      >
        {mutation.isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeBtn: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  typeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: 14, color: Colors.gray[600] },
  typeTextActive: { color: Colors.white, fontWeight: '600' },
  photoActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: { flex: 1, borderWidth: 2, borderColor: Colors.gray[200], borderRadius: 12, borderStyle: 'dashed', padding: 16, alignItems: 'center' },
  photoBtnText: { fontSize: 15, color: Colors.gray[500] },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  photoWrapper: { position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 10 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.error, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
