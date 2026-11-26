import React, { useEffect, useState, useMemo } from 'react';
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
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PALETTES } from '../theme/theme';

interface NearbyGardenPlace {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
          'Ative a permissão de localização para exibir o mapa com floriculturas e viveiros próximos.'
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });

      // Busca real e gratuita de floriculturas, garden centers e viveiros via OpenStreetMap Overpass
      const overpassQuery = `[out:json][timeout:10];(node["shop"~"florist|garden_centre"](around:6000,${latitude},${longitude});way["shop"~"florist|garden_centre"](around:6000,${latitude},${longitude});node["landuse"="plant_nursery"](around:6000,${latitude},${longitude}););out center 15;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });
      const data = await res.json();

      if (Array.isArray(data?.elements) && data.elements.length > 0) {
        const mapped: NearbyGardenPlace[] = data.elements
          .map((el: any) => {
            const pLat = el.lat ?? el.center?.lat;
            const pLng = el.lon ?? el.center?.lon;
            if (!pLat || !pLng) return null;
            return {
              id: String(el.id),
              name: el.tags?.name || 'Floricultura / Viveiro Local',
              type:
                el.tags?.shop === 'garden_centre'
                  ? 'Garden Center'
                  : 'Floricultura & Plantas',
              lat: pLat,
              lng: pLng,
              distanceKm: getDistanceKm(latitude, longitude, pLat, pLng),
            };
          })
          .filter(Boolean)
          .sort(
            (a: NearbyGardenPlace, b: NearbyGardenPlace) =>
              a.distanceKm - b.distanceKm
          );

        setPlaces(mapped);
      } else {
        setStatusNote(
          'Nenhuma floricultura mapeada num raio de 6 km. Você pode expandir a busca no Google Maps abaixo.'
        );
      }
    } catch {
      setStatusNote(
        'Mapa carregado! Caso a lista demore, você também pode abrir rotas no Google Maps.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openRoute = (lat: number, lng: number, label?: string) => {
    const query = label
      ? `${encodeURIComponent(label)}@${lat},${lng}`
      : `${lat},${lng}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  // HTML do Mapa Interativo Leaflet embutido (zero chave paga)
  const mapHtml = useMemo(() => {
    if (!coords) return '';
    const markersJson = JSON.stringify(places);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EAE5D9; }
          .user-dot { width: 16px; height: 16px; border-radius: 50%; background: #1E352B; border: 3px solid #FAF7F0; box-shadow: 0 2px 8px rgba(0,0,0,0.35); }
          .shop-pin { width: 28px; height: 28px; border-radius: 50% 50% 50% 0; background: #3A5A40; transform: rotate(-45deg); border: 2px solid #FAF7F0; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${coords.lat}, ${coords.lng}], 13);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          const userIcon = L.divIcon({ className: 'user-dot', iconSize: [16, 16] });
          L.marker([${coords.lat}, ${coords.lng}], { icon: userIcon }).addTo(map).bindPopup('<b>Você está aqui</b>');

          const shopIcon = L.divIcon({ className: 'shop-pin', iconSize: [26, 26], iconAnchor: [13, 26] });
          const places = ${markersJson};
          places.forEach(p => {
            L.marker([p.lat, p.lng], { icon: shopIcon })
              .addTo(map)
              .bindPopup('<b>' + p.name + '</b><br/>' + p.type + ' • ' + p.distanceKm.toFixed(1) + ' km');
          });
        </script>
      </body>
      </html>
    `;
  }, [coords, places]);

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
            Garden Centers & Viveiros
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Mapa ao vivo de lojas botânicas perto de você
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadNearbyPlaces}
          style={[styles.refreshBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="refresh" size={18} color={colors.mossPrimary} />
        </TouchableOpacity>
      </View>

      {/* Mapa Interativo Embutido */}
      <View style={[styles.mapCard, { borderColor: colors.border }]}>
        {coords ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
          />
        ) : (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color={colors.mossPrimary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Localizando viveiros na sua região...
            </Text>
          </View>
        )}
      </View>

      {/* Lista de Locais Encontrados */}
      {loading && coords ? (
        <View style={styles.listLoading}>
          <ActivityIndicator size="small" color={colors.mossPrimary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Buscando floriculturas próximas...
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
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
                <Text
                  style={[styles.noteText, { color: colors.textSecondary }]}
                >
                  {statusNote}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        'garden center floricultura'
                      )}`
                    )
                  }
                  style={[
                    styles.fallbackBtn,
                    { backgroundColor: colors.mossPrimary },
                  ]}
                >
                  <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.fallbackBtnText}>
                    Abrir busca expandida no Maps
                  </Text>
                </TouchableOpacity>
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
              onPress={() => openRoute(item.lat, item.lng, item.name)}
            >
              <View
                style={[
                  styles.placeIcon,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={colors.mossPrimary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.placeName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.placeAddr, { color: colors.textSecondary }]}
                >
                  {item.type} • {item.distanceKm.toFixed(1)} km de você
                </Text>
              </View>
              <Ionicons
                name="navigate-circle-outline"
                size={26}
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
    paddingHorizontal: 18,
    paddingVertical: 12,
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
  mapCard: {
    height: 290,
    margin: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  webview: { flex: 1 },
  mapLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  listLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  noteCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  noteText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fallbackBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: { fontSize: 14.5, fontWeight: '700' },
  placeAddr: { fontSize: 12, marginTop: 2 },
});
