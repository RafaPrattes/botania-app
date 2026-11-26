import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PALETTES } from '../theme/theme';

interface NearbyGardenPlace {
  id: string;
  name: string;
  address: string;
  rating?: number;
  openNow?: boolean;
  lat: number;
  lng: number;
}

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const GardenMapScreen: React.FC = () => {
  const profile = usePlantStore((s) => s.profile);
  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;

  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [places, setPlaces] = useState<NearbyGardenPlace[]>([]);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    loadNearbyPlaces();
  }, []);

  const loadNearbyPlaces = async () => {
    setLoading(true);
    setStatusNote(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusNote(
          'Ative a permissão de localização para encontrar floriculturas e garden centers perto de você.'
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });

      if (MAPS_KEY) {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&keyword=${encodeURIComponent(
          'garden center floricultura plantas substrato'
        )}&language=pt-BR&key=${MAPS_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data.results) && data.results.length > 0) {
          setPlaces(
            data.results.slice(0, 10).map((item: any) => ({
              id: item.place_id,
              name: item.name,
              address: item.vicinity || 'Endereço disponível no mapa',
              rating: item.rating,
              openNow: item.opening_hours?.open_now,
              lat: item.geometry?.location?.lat ?? latitude,
              lng: item.geometry?.location?.lng ?? longitude,
            }))
          );
          setLoading(false);
          return;
        }
      }

      // Fallback direto para abrir busca georreferenciada no Google Maps
      setStatusNote(
        'Toque abaixo para explorar todas as floriculturas, viveiros e lojas de insumos botânicos na sua região pelo Google Maps.'
      );
    } catch {
      setStatusNote('Não foi possível obter sua localização atual.');
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = (queryOrPlace: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      queryOrPlace
    )}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Garden Centers & Insumos
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Viveiros, substratos e vasos perto de você
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadNearbyPlaces}
          style={[styles.refreshBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="refresh" size={18} color={colors.mossPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.mossPrimary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Buscando lojas botânicas próximas...
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <TouchableOpacity
              style={[
                styles.mapsBanner,
                { backgroundColor: colors.mossPrimary },
              ]}
              onPress={() =>
                openInGoogleMaps(
                  coords
                    ? `garden center floricultura perto de ${coords.lat},${coords.lng}`
                    : 'garden center floricultura'
                )
              }
            >
              <Ionicons name="map-outline" size={24} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  Explorar no Google Maps
                </Text>
                <Text style={styles.bannerSub}>
                  Ver rota, horários e avaliações de viveiros locais
                </Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          }
          ListEmptyComponent={
            statusNote ? (
              <View
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={28}
                  color={colors.mossPrimary}
                />
                <Text
                  style={[styles.noteText, { color: colors.textSecondary }]}
                >
                  {statusNote}
                </Text>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.placeCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => openInGoogleMaps(`${item.name} ${item.address}`)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.placeName, { color: colors.textPrimary }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.placeAddr, { color: colors.textSecondary }]}
                >
                  {item.address}
                </Text>
                <View style={styles.metaRow}>
                  {item.rating && (
                    <Text
                      style={[
                        styles.metaBadge,
                        { color: colors.mossPrimary },
                      ]}
                    >
                      Nota {item.rating.toFixed(1)}
                    </Text>
                  )}
                  {typeof item.openNow === 'boolean' && (
                    <Text
                      style={[
                        styles.metaBadge,
                        {
                          color: item.openNow
                            ? colors.mossPrimary
                            : colors.terracotta,
                        },
                      ]}
                    >
                      {item.openNow ? 'Aberto agora' : 'Fechado'}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name="navigate-circle-outline"
                size={28}
                color={colors.mossPrimary}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  mapsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  bannerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  noteCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  noteText: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  placeName: { fontSize: 15, fontWeight: '700' },
  placeAddr: { fontSize: 12.5, marginTop: 3 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaBadge: { fontSize: 12, fontWeight: '700' },
});
