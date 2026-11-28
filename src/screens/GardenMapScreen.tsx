import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Keyboard,
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
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  photoUrl: string;
  mapsUrl: string;
  rating?: number;
  isSupplies?: boolean;
  hasRealStorePhoto?: boolean;
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

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

// Gera uma prévia real do mapa/localização da loja (Esri World Imagery / Street) quando não há chave do Google Places
function buildLocationPreviewPhoto(lat: number, lng: number): string {
  const delta = 0.0035;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=${bbox}&bboxSR=4326&size=800,450&imageSR=4326&format=png&f=image`;
}

export const GardenMapScreen: React.FC = () => {
  const profile = usePlantStore((s) => s.profile);
  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  const [loading, setLoading] = useState(true);
  const [cityLabel, setCityLabel] = useState('Localizando...');
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
  const [statusError, setStatusError] = useState<string | null>(null);

  // Busca real usando Google Places API (New) -> Fotos reais + Endereço real + Link oficial do Google Maps
  const fetchWithGooglePlaces = async (
    lat: number,
    lng: number,
    keyword: string
  ): Promise<NearbyGardenPlace[] | null> => {
    if (!GOOGLE_MAPS_KEY) return null;

    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.photos,places.rating,places.primaryTypeDisplayName',
          },
          body: JSON.stringify({
            textQuery: keyword,
            languageCode: profile.language === 'en' ? 'en' : 'pt-BR',
            maxResultCount: 10,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: 8000.0,
              },
            },
          }),
        }
      );

      const data = await response.json();
      if (!Array.isArray(data?.places) || data.places.length === 0) return null;

      return data.places
        .map((p: any) => {
          const pLat = p.location?.latitude ?? lat;
          const pLng = p.location?.longitude ?? lng;
          const photoName = p.photos?.[0]?.name;
          const realPhotoUrl = photoName
            ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=900&key=${GOOGLE_MAPS_KEY}`
            : buildLocationPreviewPhoto(pLat, pLng);

          return {
            id: p.id,
            name: p.displayName?.text || 'Garden Center',
            tagline:
              p.primaryTypeDisplayName?.text ||
              'Plantas, vasos e cuidados botânicos',
            address: p.formattedAddress || cityLabel,
            lat: pLat,
            lng: pLng,
            distanceKm: getDistanceKm(lat, lng, pLat, pLng),
            photoUrl: realPhotoUrl,
            mapsUrl:
              p.googleMapsUri ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${p.displayName?.text} ${p.formattedAddress || ''}`
              )}`,
            rating: p.rating,
            isSupplies: keyword.toLowerCase().includes('vaso'),
            hasRealStorePhoto: Boolean(photoName),
          };
        })
        .sort(
          (a: NearbyGardenPlace, b: NearbyGardenPlace) =>
            a.distanceKm - b.distanceKm
        );
    } catch {
      return null;
    }
  };

  // Busca real gratuita (Nominatim + Overpass OpenStreetMap) com endereço real + link real no Google Maps
  const fetchWithOpenStreetMap = async (
    lat: number,
    lng: number,
    term: string
  ): Promise<NearbyGardenPlace[]> => {
    const delta = 0.08; // ~8km ao redor
    const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;

    // 1. Nominatim (muito mais estável e rápido que Overpass!)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=12&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(
        term
      )}`;
      const res = await fetch(nomUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BotanIAApp/1.0 (https://github.com/RafaPrattes/botania-app)',
        },
      });
      const list = await res.json();

      if (Array.isArray(list) && list.length > 0) {
        return list
          .map((item: any) => {
            const pLat = parseFloat(item.lat);
            const pLng = parseFloat(item.lon);
            const addr = item.address || {};
            const street = [addr.road, addr.house_number]
              .filter(Boolean)
              .join(', ');
            const district =
              addr.suburb || addr.neighbourhood || addr.city || addr.town || '';
            const fullAddress =
              [street, district].filter(Boolean).join(' • ') ||
              item.display_name.split(',').slice(0, 3).join(',');
            const name =
              item.name ||
              item.display_name.split(',')[0] ||
              'Floricultura';

            return {
              id: String(item.place_id),
              name,
              tagline:
                item.type === 'garden_centre'
                  ? 'Garden Center • Plantas, vasos e substratos'
                  : 'Floricultura & Plantas ornamentais',
              address: fullAddress,
              lat: pLat,
              lng: pLng,
              distanceKm: getDistanceKm(lat, lng, pLat, pLng),
              photoUrl: buildLocationPreviewPhoto(pLat, pLng),
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${name}, ${fullAddress}`
              )}`,
              isSupplies: item.type === 'garden_centre',
            };
          })
          .sort(
            (a: NearbyGardenPlace, b: NearbyGardenPlace) =>
              a.distanceKm - b.distanceKm
          );
      }
    } catch {
      // Continua para Overpass
    }

    // 2. Fallback Overpass caso Nominatim não retorne na área
    try {
      const overpassQuery = `[out:json][timeout:10];(node["shop"~"florist|garden_centre"](around:8000,${lat},${lng});way["shop"~"florist|garden_centre"](around:8000,${lat},${lng}););out center 15;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });
      const data = await res.json();
      if (Array.isArray(data?.elements)) {
        return data.elements
          .map((el: any) => {
            const pLat = el.lat ?? el.center?.lat;
            const pLng = el.lon ?? el.center?.lon;
            if (!pLat || !pLng) return null;
            const name = el.tags?.name || 'Floricultura Local';
            const addr =
              [el.tags?.['addr:street'], el.tags?.['addr:suburb']]
                .filter(Boolean)
                .join(' • ') || cityLabel;
            return {
              id: String(el.id),
              name,
              tagline:
                el.tags?.shop === 'garden_centre'
                  ? 'Garden Center • Plantas e vasos'
                  : 'Floricultura & Plantas',
              address: addr,
              lat: pLat,
              lng: pLng,
              distanceKm: getDistanceKm(lat, lng, pLat, pLng),
              photoUrl: buildLocationPreviewPhoto(pLat, pLng),
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${name} @${pLat},${pLng}`
              )}`,
              isSupplies: el.tags?.shop === 'garden_centre',
            };
          })
          .filter(Boolean)
          .sort(
            (a: NearbyGardenPlace, b: NearbyGardenPlace) =>
              a.distanceKm - b.distanceKm
          );
      }
    } catch {
      // Sem resultados
    }

    return [];
  };

  const runNearbySearch = useCallback(
    async (mode: 'near' | 'supplies', customQuery?: string) => {
      setLoading(true);
      setStatusError(null);
      Keyboard.dismiss();

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setStatusError(
            'Ative o GPS para listar floriculturas e garden centers reais perto de você.'
          );
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = loc.coords;
        setCoords({ lat: latitude, lng: longitude });

        let detectedCity = cityLabel;
        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          if (geo[0]) {
            const c = geo[0].city || geo[0].subregion || 'Sua região';
            const r = geo[0].region || '';
            detectedCity = r ? `${c}, ${r}` : c;
            setCityLabel(detectedCity);
          }
        } catch {
          // Mantém rótulo anterior
        }

        const queryTerm = customQuery?.trim()
          ? `${customQuery.trim()} floricultura garden center`
          : mode === 'supplies'
          ? 'garden center plantas vasos substrato'
          : 'floricultura garden center plantas';

        // 1. Tenta Google Places API (New) com fotos reais de fachada
        const googleResults = await fetchWithGooglePlaces(
          latitude,
          longitude,
          queryTerm
        );
        if (googleResults && googleResults.length > 0) {
          setPlaces(googleResults);
          setLoading(false);
          return;
        }

        // 2. Fallback gratuito real (Nominatim + Overpass) com endereços reais
        const osmResults = await fetchWithOpenStreetMap(
          latitude,
          longitude,
          customQuery?.trim() || (mode === 'supplies' ? 'garden' : 'floricultura')
        );

        setPlaces(osmResults);
        if (osmResults.length === 0) {
          setStatusError(
            `Nenhum garden center mapeado em ${detectedCity} via OpenStreetMap. Toque abaixo para ver todos no Google Maps.`
          );
        }
      } catch {
        setStatusError(
          'Não foi possível buscar sua localização agora. Tente tocar em atualizar.'
        );
      } finally {
        setLoading(false);
      }
    },
    [cityLabel, profile.language]
  );

  useEffect(() => {
    runNearbySearch('near');
  }, []);

  const handleSelectFilter = (tab: 'near' | 'supplies' | 'map') => {
    setActiveTab(tab);
    if (tab === 'near') {
      setSearchText('');
      runNearbySearch('near');
    } else if (tab === 'supplies') {
      runNearbySearch('supplies', searchText);
    }
  };

  const openRoute = (place: NearbyGardenPlace) => {
    Linking.openURL(place.mapsUrl);
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
          onPress={() =>
            runNearbySearch(
              activeTab === 'supplies' ? 'supplies' : 'near',
              searchText
            )
          }
          style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Busca Real por Cidade, Bairro ou Nome */}
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
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() =>
              runNearbySearch(
                activeTab === 'supplies' ? 'supplies' : 'near',
                searchText
              )
            }
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                runNearbySearch(
                  activeTab === 'supplies' ? 'supplies' : 'near',
                  searchText
                )
              }
            >
              <Ionicons
                name="arrow-forward-circle"
                size={22}
                color={colors.mossPrimary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pílulas de Filtro (Agora disparam busca real!) */}
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
              onPress={() => handleSelectFilter(tab.key)}
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
      ) : loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.mossPrimary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t.mapEmptyNote}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeaderRow}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t.mapSectionTitle}
              </Text>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {places.length} locais
              </Text>
            </View>
          }
          ListEmptyComponent={
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
                name="location-outline"
                size={28}
                color={colors.mossPrimary}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.textSecondary, marginVertical: 10 },
                ]}
              >
                {statusError || t.mapEmptyNote}
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
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openRoute(item)}
                style={styles.photoBox}
              >
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

                {item.rating && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#C78A28" />
                    <Text style={styles.distanceText}>
                      {item.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

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

                <TouchableOpacity
                  onPress={() => openRoute(item)}
                  style={styles.addressRow}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={15}
                    color={colors.mossPrimary}
                  />
                  <Text
                    style={[styles.addressText, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {item.address}
                  </Text>
                </TouchableOpacity>

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

      {/* Modal Editorial "Seu próximo passeio verde." com rota real */}
      <Modal visible={Boolean(selectedPlace)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.detailModal,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalEyebrow, { color: colors.mossMuted }]}>
              {selectedPlace?.name.toUpperCase()}
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
                {selectedPlace?.address}
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
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  editorialCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  photoBox: {
    height: 185,
    position: 'relative',
    backgroundColor: '#E5DFD2',
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
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
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
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  placeTagline: {
    fontSize: 13.5,
    marginBottom: 10,
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
    lineHeight: 20,
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
    fontSize: 14,
    fontWeight: '700',
  },
  modalAddrSub: {
    fontSize: 12.5,
    marginTop: 4,
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