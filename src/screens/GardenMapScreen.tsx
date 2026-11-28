import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
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
  tagline: string;
  neighborhood: string;
  lat: number;
  lng: number;
  distanceKm: number;
  photoUrl: string;
  isSupplies?: boolean;
}

const EDITORIAL_PHOTOS = [
  'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
];

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
  const [cityLabel, setCityLabel] = useState('São Paulo, SP');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'near' | 'supplies' | 'map'>(
    'near'
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [places, setPlaces] = useState<NearbyGardenPlace[]>([]);
  const [selectedPlace, setSelectedPlace] =
    useState<NearbyGardenPlace | null>(null);

  useEffect(() => {
    loadNearbyPlaces();
  }, []);

  const loadNearbyPlaces = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });

      // Detecta cidade e estado reais do usuário para o campo de busca
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo[0]) {
          const city = geo[0].city || geo[0].subregion || 'Sua região';
          const region = geo[0].region || '';
          setCityLabel(region ? `${city}, ${region}` : city);
        }
      } catch {
        // Mantém rótulo padrão
      }

      const overpassQuery = `[out:json][timeout:10];(node["shop"~"florist|garden_centre"](around:7000,${latitude},${longitude});way["shop"~"florist|garden_centre"](around:7000,${latitude},${longitude});node["landuse"="plant_nursery"](around:7000,${latitude},${longitude}););out center 15;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });
      const data = await res.json();

      if (Array.isArray(data?.elements) && data.elements.length > 0) {
        const mapped: NearbyGardenPlace[] = data.elements
          .map((el: any, idx: number) => {
            const pLat = el.lat ?? el.center?.lat;
            const pLng = el.lon ?? el.center?.lon;
            if (!pLat || !pLng) return null;
            const isGardenCenter = el.tags?.shop === 'garden_centre';
            const street = el.tags?.['addr:street'];
            const suburb = el.tags?.['addr:suburb'];
            return {
              id: String(el.id),
              name: el.tags?.name || 'Viveiro & Floricultura Local',
              tagline: isGardenCenter
                ? 'Plantas tropicais, vasos de cerâmica e substratos.'
                : 'Plantas, vasos e boas conversas.',
              neighborhood:
                suburb || street || cityLabel || 'Perto da sua localização',
              lat: pLat,
              lng: pLng,
              distanceKm: getDistanceKm(latitude, longitude, pLat, pLng),
              photoUrl: EDITORIAL_PHOTOS[idx % EDITORIAL_PHOTOS.length],
              isSupplies: isGardenCenter,
            };
          })
          .filter(Boolean)
          .sort(
            (a: NearbyGardenPlace, b: NearbyGardenPlace) =>
              a.distanceKm - b.distanceKm
          );

        setPlaces(mapped);
      }
    } catch {
      // Fallback elegante silencioso
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = useMemo(() => {
    let base = places;
    if (activeTab === 'supplies') {
      const onlySupplies = places.filter((p) => p.isSupplies);
      base = onlySupplies.length > 0 ? onlySupplies : places;
    }
    const q = searchText.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q)
    );
  }, [places, activeTab, searchText]);

  const openRoute = (place: NearbyGardenPlace) => {
    const query = `${encodeURIComponent(place.name)}@${place.lat},${place.lng}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

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
          html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #ECE7DC; }
          .user-dot { width: 16px; height: 16px; border-radius: 50%; background: #1F3A2E; border: 3px solid #FAF7F0; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
          .shop-pin { width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #3D6249; transform: rotate(-45deg); border: 2px solid #FAF7F0; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${coords.lat}, ${coords.lng}], 13);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Header Editorial */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mossMuted }]}>
            {t.mapEyebrow}
          </Text>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
            {t.mapTitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadNearbyPlaces}
          style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Campo de Busca / Cidade Atual */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchPill,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={cityLabel || t.mapSearchPlaceholder}
            placeholderTextColor={colors.textPrimary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pílulas de Filtro (Perto de mim / Plantas e vasos / Mapa ao vivo) */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'near', label: t.mapFilterNear },
            { key: 'supplies', label: t.mapFilterSupplies },
            { key: 'map', label: t.mapFilterLiveMap },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active
                    ? profile.darkMode
                      ? colors.mossPrimary
                      : colors.mossDeep
                    : colors.surfaceAlt,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modo Mapa ao Vivo */}
      {activeTab === 'map' ? (
        <View style={[styles.liveMapCard, { borderColor: colors.border }]}>
          {coords ? (
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
            />
          ) : (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.mossPrimary} />
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t.mapSectionTitle}
            </Text>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.mossPrimary} />
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  {t.mapEmptyNote}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.editorialCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    padding: 22,
                    alignItems: 'center',
                  },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={28}
                  color={colors.mossPrimary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.textSecondary, marginVertical: 10 },
                  ]}
                >
                  {t.mapEmptyNote}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `garden center floricultura ${cityLabel}`
                      )}`
                    )
                  }
                  style={[
                    styles.cardCtaBtn,
                    {
                      backgroundColor: profile.darkMode
                        ? colors.mossPrimary
                        : colors.mossDeep,
                      width: '100%',
                    },
                  ]}
                >
                  <Text style={styles.cardCtaText}>{t.mapModalRouteBtn}</Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.editorialCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.photoBox}>
                <Image
                  source={{ uri: item.photoUrl }}
                  style={styles.cardPhoto}
                  resizeMode="cover"
                />
                <View style={styles.distanceBadge}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color="#1F3A2E"
                  />
                  <Text style={styles.distanceText}>
                    {item.distanceKm.toFixed(1).replace('.', ',')} km
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={[styles.placeName, { color: colors.textPrimary }]}>
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.placeTagline,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.tagline}
                </Text>

                <View style={styles.addressRow}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color={colors.mossMuted}
                  />
                  <Text
                    style={[styles.addressText, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.neighborhood}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedPlace(item)}
                  activeOpacity={0.85}
                  style={[
                    styles.cardCtaBtn,
                    {
                      backgroundColor: profile.darkMode
                        ? colors.mossPrimary
                        : colors.mossDeep,
                    },
                  ]}
                >
                  <Text style={styles.cardCtaText}>{t.mapSeeDetails}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal Editorial "Seu próximo passeio verde." Fiel ao Vídeo */}
      <Modal visible={Boolean(selectedPlace)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.detailModal,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalEyebrow, { color: colors.mossMuted }]}>
              {selectedPlace?.name.toUpperCase()} / GARDEN CENTER
            </Text>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t.mapModalTitle}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {selectedPlace?.tagline}
            </Text>

            <View
              style={[
                styles.modalAddressBox,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Text
                style={[styles.modalAddrTitle, { color: colors.textPrimary }]}
              >
                {selectedPlace?.neighborhood}
              </Text>
              <Text
                style={[styles.modalAddrSub, { color: colors.textSecondary }]}
              >
                {selectedPlace?.distanceKm.toFixed(1).replace('.', ',')} km ·{' '}
                {cityLabel}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (selectedPlace) openRoute(selectedPlace);
              }}
              style={[
                styles.modalPrimaryBtn,
                {
                  backgroundColor: profile.darkMode
                    ? colors.mossPrimary
                    : colors.mossDeep,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>{t.mapModalRouteBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPlace(null)}
              style={[
                styles.modalSecondaryBtn,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Text
                style={[
                  styles.modalSecondaryText,
                  { color: colors.textPrimary },
                ]}
              >
                {t.mapModalBackBtn}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 14,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  editorialCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  photoBox: {
    height: 190,
    position: 'relative',
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F3A2E',
  },
  cardContent: {
    padding: 18,
  },
  placeName: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  placeTagline: {
    fontSize: 13.5,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardCtaBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardCtaText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  liveMapCard: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 22, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  detailModal: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  modalAddressBox: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  modalAddrTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  modalAddrSub: {
    fontSize: 12.5,
    marginTop: 3,
  },
  modalPrimaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
