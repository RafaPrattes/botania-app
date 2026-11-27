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
import { PALETTES, TRANSLATIONS } from '../theme/theme';

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
  const t = TRANSLATIONS[profile.language];

  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [places, setPlaces] = useState<NearbyGardenPlace[]>([]);
  const [statusKey, setStatusKey] = useState<
    'denied' | 'empty' | 'fallback' | null
  >(null);

  useEffect(() => {
    loadNearbyPlaces();
  }, []);

  const loadNearbyPlaces = async () => {
    setLoading(true);
    setStatusKey(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusKey('denied');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });

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
              name: el.tags?.name || 'Garden Center',
              type:
                el.tags?.shop === 'garden_centre'
                  ? 'Garden Center'
                  : 'Florist & Plants',
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
        setStatusKey('empty');
      }
    } catch {
      setStatusKey('fallback');
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

  // Tiles gratuitos da Esri (zero API key, carrega sempre no Android/iOS)
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
          .user-dot { width: 16px; height: 16px; border-radius: 50%; background: #1E352B; border: 3px solid #FAF7F0; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
          .shop-pin { width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #3A5A40; transform: rotate(-45deg); border: 2px solid #FAF7F0; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${coords.lat}, ${coords.lng}], 14);
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: 'Tiles &copy; Esri'
          }).addTo(map);

          const userIcon = L.divIcon({ className: 'user-dot', iconSize: [16, 16] });
          L.marker([${coords.lat}, ${coords.lng}], { icon: userIcon }).addTo(map);

          const shopIcon = L.divIcon({ className: 'shop-pin', iconSize: [26, 26], iconAnchor: [13, 26] });
          const places = ${markersJson};
          places.forEach(p => {
            L.marker([p.lat, p.lng], { icon: shopIcon })
              .addTo(map)
              .bindPopup('<b>' + p.name + '</b><br/>' + p.distanceKm.toFixed(1) + ' km');
          });
        </script>
      </body>
      </html>
    `;
  }, [coords, places]);

  const statusText =
    statusKey === 'denied'
      ? t.mapPermissionDenied
      : statusKey === 'empty'
      ? t.mapEmptyNote
      : statusKey === 'fallback'
      ? t.mapFallbackNote
      : null;

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
            {t.mapTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.mapSub}
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadNearbyPlaces}
          style={[styles.refreshBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="refresh" size={18} color={colors.mossPrimary} />
        </TouchableOpacity>
      </View>

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
              {t.mapLocating}
            </Text>
          </View>
        )}
      </View>

      {loading && coords ? (
        <View style={styles.listLoading}>
          <ActivityIndicator size="small" color={colors.mossPrimary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {t.mapSearching}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            statusText ? (
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
                  {statusText}
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
                    {t.mapOpenExpanded}
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
                  {item.type} • {item.distanceKm.toFixed(1)}{' '}
                  {t.mapDistanceSuffix}
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
