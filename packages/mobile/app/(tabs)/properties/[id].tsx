import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';

function formatPaise(p: number) { return '₹' + (p / 100).toLocaleString('en-IN'); }

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`).then((r) => r.data.property),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;
  if (!data) return <Text style={{ padding: 24 }}>Property not found</Text>;

  const p = data;
  const isOwner = p.landlordId === user?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Image */}
      {p.images?.[0]?.cloudUrl ? (
        <Image source={{ uri: p.images[0].cloudUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ fontSize: 48 }}>🏢</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={3}>{p.title}</Text>
          <StatusBadge status={p.listingStatus} />
        </View>

        <Text style={styles.city}>📍 {p.addressLine1}, {p.city}, {p.state} — {p.pincode}</Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Monthly Rent</Text>
            <Text style={styles.price}>{formatPaise(p.monthlyRent)}</Text>
          </View>
          <View>
            <Text style={styles.priceLabel}>Deposit</Text>
            <Text style={styles.price}>{formatPaise(p.securityDeposit)}</Text>
          </View>
        </View>

        {/* Details grid */}
        <View style={styles.grid}>
          {p.propertyType && <Chip label={p.propertyType} />}
          {p.bedrooms && <Chip label={`${p.bedrooms} BHK`} />}
          {p.bathrooms && <Chip label={`${p.bathrooms} Bath`} />}
          {p.areaSqft && <Chip label={`${p.areaSqft} sqft`} />}
          {p.isFurnished && <Chip label="Furnished" />}
        </View>

        {p.amenities?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.grid}>
              {p.amenities.map((a: string) => <Chip key={a} label={a} />)}
            </View>
          </>
        )}

        {p.description && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{p.description}</Text>
          </>
        )}

        {/* Actions */}
        {isOwner ? (
          <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/(tabs)/agreements/new', params: { propertyId: id } })}>
            <Text style={styles.btnText}>Create Agreement</Text>
          </TouchableOpacity>
        ) : (
          p.listingStatus === 'ACTIVE' && (
            <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/(tabs)/agreements/new', params: { propertyId: id } })}>
              <Text style={styles.btnText}>Request Agreement</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </ScrollView>
  );
}

function Chip({ label }: { label: string }) {
  return <View style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  image: { width: '100%', height: 220 },
  imagePlaceholder: { backgroundColor: Colors.gray[100], justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  city: { fontSize: 14, color: Colors.gray[500], marginBottom: 20 },
  priceRow: { flexDirection: 'row', gap: 24, backgroundColor: Colors.gray[50], borderRadius: 14, padding: 18, marginBottom: 20 },
  priceLabel: { fontSize: 12, color: Colors.gray[500], marginBottom: 4 },
  price: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: Colors.gray[100], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 13, color: Colors.gray[700] },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[800], marginBottom: 10, marginTop: 4 },
  description: { fontSize: 15, color: Colors.gray[600], lineHeight: 22 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
