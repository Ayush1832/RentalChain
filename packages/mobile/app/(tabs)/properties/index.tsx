import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import { StatusBadge } from '../../../components/StatusBadge';
import { Property } from '../../../types';

function formatPaise(p: number) { return '₹' + (p / 100).toLocaleString('en-IN'); }

export default function PropertiesScreen() {
  const { user } = useAuthStore();
  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'BOTH';
  const [mine, setMine] = useState(false);
  const [city, setCity] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties', mine, city],
    queryFn: () =>
      api.get('/properties', { params: { mine: mine ? 'true' : undefined, city: city || undefined } })
        .then((r) => r.data),
  });

  const properties: Property[] = data?.properties || [];

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search by city…"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => refetch()}
          returnKeyType="search"
        />
        {isLandlord && (
          <TouchableOpacity style={[styles.toggleBtn, mine && styles.toggleActive]} onPress={() => setMine(!mine)}>
            <Text style={[styles.toggleText, mine && styles.toggleTextActive]}>{mine ? 'My Listings' : 'Browse All'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(tabs)/properties/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <StatusBadge status={item.listingStatus} size="sm" />
              </View>
              <Text style={styles.cardCity}>📍 {item.city}, {item.state}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardRent}>{formatPaise(item.monthlyRent)}<Text style={styles.perMonth}>/mo</Text></Text>
                <Text style={styles.cardType}>{item.propertyType}</Text>
              </View>
              {item.bedrooms && <Text style={styles.cardDetails}>{item.bedrooms} BHK · {item.areaSqft} sqft{item.isFurnished ? ' · Furnished' : ''}</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No properties found</Text>}
        />
      )}

      {isLandlord && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/properties/new')}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  searchRow: { flexDirection: 'row', padding: 14, gap: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  search: { flex: 1, borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  toggleBtn: { backgroundColor: Colors.gray[100], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: 13, color: Colors.gray[600], fontWeight: '600' },
  toggleTextActive: { color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  cardCity: { fontSize: 13, color: Colors.gray[500], marginBottom: 10 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRent: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  perMonth: { fontSize: 13, fontWeight: '400', color: Colors.gray[500] },
  cardType: { backgroundColor: Colors.gray[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 13, color: Colors.gray[600] },
  cardDetails: { fontSize: 13, color: Colors.gray[400], marginTop: 6 },
  empty: { textAlign: 'center', color: Colors.gray[400], fontSize: 16, marginTop: 60 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: Colors.white, lineHeight: 32 },
});
