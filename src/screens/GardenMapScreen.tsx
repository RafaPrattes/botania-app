import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlantStore } from '../store/usePlantStore';

type FilterKey = 'nearby' | 'florist' | 'supplies';

interface GardenPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distanceKm: number;
  category: 'florist' | 'supplies' | 'garden';
  rating?: number;
  photoUrl?: string;
  mapsUrl: string;
}

interface Coords {
  latitude: number;
  longitude: number;
}

interface CachePayload {
  timestamp: number;
  coords: Coords;
  places: GardenPlace[];
}

const CACHE_KEY = '@botania_garden_centers_cache_v2';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos
const DEFAULT_COORDS: Coords = { latitude: -15.793889, longitude: -47.882778 }; // Fallback

let memoryCache: CachePayload | null = null;

const COPY = {
  pt: {
    eyebrow: 'MAPA BOTÂNICO',
    title: 'Garden Centers',
    subtitle: 'Lojas botânicas, floriculturas e insumos perto de você',
    filters: {
      nearby: 'Perto de mim',
      florist: 'Floriculturas',
      supplies: 'Insumos',
    },
    loading: 'Localizando espaços próximos...',
    emptyTitle: 'Nenhum espaço encontrado neste filtro',
    emptySubtitle: 'Tente ampliar a busca diretamente no Google Maps.',
    openMaps: 'Abrir no Google Maps',
    route: 'Ver rota',
    away: 'km de você',
    updating: 'Atualizando...',
  },
  en: {
    eyebrow: 'BOTANICAL MAP',
    title: 'Garden Centers',
    subtitle: 'Botanical shops, florists and supplies near you',
    filters: {
      nearby: 'Near me',
      florist: 'Florists',
      supplies: 'Supplies',
    },
    loading: 'Finding nearby botanical spots...',
    emptyTitle: 'No places found for this filter',
    emptySubtitle: 'Try expanding your search directly in Google Maps.',
    openMaps: 'Open in Google Maps',
    route: 'Directions',
    away: 'km away',
    updating: 'Updating...',
  },
  es: {
    eyebrow: 'MAPA BOTÁNICO',
    title: 'Garden Centers',
    subtitle: 'Tiendas botánicas, florerías e insumos cerca de ti',
    filters: {
      nearby: 'Cerca de mí',
      florist: 'Florerías',
      supplies: 'Insumos',
    },
    loading: 'Buscando espacios cercanos...',
    emptyTitle: 'No encontramos lugares en este filtro',
    emptySubtitle: 'Prueba ampliar la búsqueda directamente en Google Maps.',
    openMaps: 'Abrir en Google Maps',
    route: 'Cómo llegar',
    away: 'km de distancia',
    updating: 'Actualizando...',
  },
} as const;

function calcDistanceKm(a: Coords, b: Coords): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Number((2 * R * Math.asin(Math.sqrt(h))).toFixed(1));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 4500
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function classifyPlace(name: string, rawType = ''): GardenPlace['category'] {
  const text = `${name} ${rawType}`.toLowerCase();
  if (
    text.includes('substrato') ||
    text.includes('adubo') ||
    text.includes('agro') ||
    text.includes('insumo') ||
    text.includes('sement') ||
    text.includes('paisag')
  ) {
    return 'supplies';
  }
  if (text.includes('flor') || text.includes('orquid')) {
    return 'florist';
  }
  return 'garden';
}

function mergePlaces(existing: GardenPlace[], incoming: GardenPlace[]): GardenPlace[] {
  const map = new Map<string, GardenPlace>();
  [...existing, ...incoming].forEach((place) => {
    const key = `${place.name.toLowerCase().trim().slice(0, 24)}_${place.lat.toFixed(3)}_${place.lon.toFixed(3)}`;
    if (!map.has(key) || (place.photoUrl && !map.get(key)?.photoUrl)) {
      map.set(key, place);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.distanceKm - b.distanceKm);
}

async function resolveFastCoords(): Promise<Coords> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return DEFAULT_COORDS;

    // 1. Tenta posição em cache do aparelho (instantâneo)
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
    });
    if (lastKnown?.coords) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }

    // 2. Se não houver cache, busca com baixa/média precisão e timeout de 4s
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    if (position?.coords) {
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }
  } catch {
    // Fallback silencioso
  }
  return DEFAULT_COORDS;
}

async function searchGooglePlaces(coords: Coords, apiKey: string): Promise<GardenPlace[]> {
  const response = await fetchWithTimeout(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos,places.googleMapsUri',
      },
      body: JSON.stringify({
        textQuery: 'garden center floricultura jardinagem substratos',
        languageCode: 'pt-BR',
        maxResultCount: 15,
        locationBias: {
          circle: {
            center: { latitude: coords.latitude, longitude: coords.longitude },
            radius: 15000,
          },
        },
      }),
    },
    4500
  );

  if (!response.ok) return [];
  const data = await response.json();
  const list = Array.isArray(data?.places) ? data.places : [];

  return list
    .filter((p: any) => p?.location?.latitude && p?.location?.longitude)
    .map((p: any) => {
      const lat = p.location.latitude;
      const lon = p.location.longitude;
      const name = p.displayName?.text || 'Garden Center';
      const photoName = p.photos?.[0]?.name;
      const photoUrl = photoName
        ? `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=320&maxWidthPx=480&key=${apiKey}`
        : undefined;

      return {
        id: `g_${p.id}`,
        name,
        address: p.formattedAddress || 'Endereço disponível no mapa',
        lat,
        lon,
        distanceKm: calcDistanceKm(coords, { latitude: lat, longitude: lon }),
        category: classifyPlace(name),
        rating: p.rating,
        photoUrl,
        mapsUrl:
          p.googleMapsUri ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}@${lat},${lon}`,
      };
    });
}

async function searchNominatimFast(coords: Coords): Promise<GardenPlace[]> {
  const delta = 0.14; // ~15 km ao redor
  const viewbox = `${coords.longitude - delta},${coords.latitude + delta},${coords.longitude + delta},${coords.latitude - delta}`;
  const queries = ['garden center', 'floricultura', 'jardinagem'];

  const requests = queries.map(async (q) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&viewbox=${viewbox}&bounded=1&limit=8&addressdetails=1`;
      const res = await fetchWithTimeout(
        url,
        { headers: { 'User-Agent': 'BotanIA-App/1.0' } },
        4000
      );
      if (!res.ok) return [];
      const items = await res.json();
      if (!Array.isArray(items)) return [];

      return items.map((item: any): GardenPlace => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const name =
          item.name ||
          item.display_name?.split(',')[0]?.trim() ||
          'Espaço Botânico';
        const road = item.address?.road || item.address?.suburb || '';
        const city =
          item.address?.city ||
          item.address?.town ||
          item.address?.municipality ||
          '';
        const address = [road, city].filter(Boolean).join(' • ') || item.display_name;

        return {
          id: `nom_${item.place_id}`,
          name,
          address,
          lat,
          lon,
          distanceKm: calcDistanceKm(coords, { latitude: lat, longitude: lon }),
          category: classifyPlace(name, q),
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${name} ${city}`
          )}`,
        };
      });
    } catch {
      return [];
    }
  });

  const settled = await Promise.all(requests);
  return mergePlaces([], settled.flat());
}

async function searchOverpassBackground(coords: Coords): Promise<GardenPlace[]> {
  const query = `[out:json][timeout:4];(node["shop"~"garden_centre|florist"](around:12000,${coords.latitude},${coords.longitude});way["shop"~"garden_centre|florist"](around:12000,${coords.latitude},${coords.longitude}););out center 20;`;
  try {
    const res = await fetchWithTimeout(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      },
      4500
    );
    if (!res.ok) return [];
    const data = await res.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];

    return elements
      .filter((el: any) => el?.tags?.name)
      .map((el: any): GardenPlace => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        const name = el.tags.name;
        const address =
          [el.tags['addr:street'], el.tags['addr:suburb'], el.tags['addr:city']]
            .filter(Boolean)
            .join(', ') || 'Localização confirmada no mapa';

        return {
          id: `osm_${el.id}`,
          name,
          address,
          lat,
          lon,
          distanceKm: calcDistanceKm(coords, { latitude: lat, longitude: lon }),
          category: classifyPlace(name, el.tags.shop || ''),
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
        };
      })
      .filter((p: GardenPlace) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  } catch {
    return [];
  }
}

export const GardenMapScreen: React.FC = () => {
  const profile = usePlantStore((state) => state.profile);
  const darkMode = Boolean(profile?.darkMode);
  const lang = (profile?.language as 'pt' | 'en' | 'es') || 'pt';
  const copy = COPY[lang] || COPY.pt;

  const [coords, setCoords] = useState<Coords>(memoryCache?.coords || DEFAULT_COORDS);
  const [places, setPlaces] = useState<GardenPlace[]>(memoryCache?.places || []);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('nearby');
  const [loading, setLoading] = useState<boolean>(!memoryCache?.places.length);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  const palette = useMemo(
    () =>
      darkMode
        ? {
            bg: '#111C17',
            card: '#192922',
            border: '#273C32',
            text: '#F2EFE9',
            muted: '#9FB1A7',
            primary: '#74A685',
            primaryText: '#0F1B15',
            pillBg: '#1C2E26',
            accent: '#D4785C',
          }
        : {
            bg: '#F4F1EA',
            card: '#FFFFFF',
            border: '#E5DFD3',
            text: '#1E352B',
            muted: '#5F6F67',
            primary: '#1E352B',
            primaryText: '#F4F1EA',
            pillBg: '#EAE4D7',
            accent: '#B85D43',
          },
    [darkMode]
  );

  const saveCache = useCallback(async (nextCoords: Coords, nextPlaces: GardenPlace[]) => {
    const payload: CachePayload = {
      timestamp: Date.now(),
      coords: nextCoords,
      places: nextPlaces,
    };
    memoryCache = payload;
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignora falha de cache
    }
  }, []);

  const loadPlaces = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        // 1. Tenta cache em memória
        if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
          setCoords(memoryCache.coords);
          setPlaces(memoryCache.places);
          setLoading(false);
          return;
        }
        // 2. Tenta cache em disco (instantâneo ao reabrir o app)
        try {
          const raw = await AsyncStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed: CachePayload = JSON.parse(raw);
            if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.places.length > 0) {
              memoryCache = parsed;
              if (isMountedRef.current) {
                setCoords(parsed.coords);
                setPlaces(parsed.places);
                setLoading(false);
              }
              return;
            }
          }
        } catch {
          // Segue para rede
        }
      }

      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const currentCoords = await resolveFastCoords();
      if (!isMountedRef.current) return;
      setCoords(currentCoords);

      const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

      if (googleApiKey) {
        const googleResults = await searchGooglePlaces(currentCoords, googleApiKey);
        if (!isMountedRef.current) return;
        if (googleResults.length > 0) {
          setPlaces(googleResults);
          saveCache(currentCoords, googleResults);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // Modo gratuito: dispara Nominatim (rápido) e Overpass (enriquecimento) em paralelo
      const overpassPromise = searchOverpassBackground(currentCoords);
      const fastResults = await searchNominatimFast(currentCoords);

      if (!isMountedRef.current) return;

      if (fastResults.length > 0) {
        setPlaces(fastResults);
        saveCache(currentCoords, fastResults);
        // Libera a tela imediatamente sem esperar o Overpass
        setLoading(false);
        setRefreshing(false);
      }

      // Mescla Overpass assim que terminar (sem travar a tela se já houver resultados)
      const osmResults = await overpassPromise;
      if (!isMountedRef.current) return;

      if (osmResults.length > 0) {
        setPlaces((prev) => {
          const merged = mergePlaces(prev, osmResults);
          saveCache(currentCoords, merged);
          return merged;
        });
      }

      setLoading(false);
      setRefreshing(false);
    },
    [saveCache]
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadPlaces(false);
    return () => {
      isMountedRef.current = false;
    };
  }, [loadPlaces]);

  const filteredPlaces = useMemo(() => {
    if (activeFilter === 'nearby') return places;
    return places.filter((p) => p.category === activeFilter);
  }, [places, activeFilter]);

  const openGeneralMaps = () => {
    const term =
      activeFilter === 'florist'
        ? 'floricultura'
        : activeFilter === 'supplies'
          ? 'loja de jardinagem substrato'
          : 'garden center floricultura';
    Linking.openURL(
      `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${coords.latitude},${coords.longitude},13z`
    );
  };

  const mapHtml = useMemo(() => {
    const markersJson = JSON.stringify(
      filteredPlaces.slice(0, 15).map((p) => ({
        name: p.name.replace(/'/g, ''),
        lat: p.lat,
        lon: p.lon,
      }))
    );

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: ${palette.bg}; }
  .leaflet-tile-pane { filter: saturate(0.45) contrast(0.95); }
  .user-dot { width: 14px; height: 14px; border-radius: 50%; background: #1E352B; border: 3px solid #FFF; box-shadow: 0 0 0 4px rgba(30,53,43,0.28); }
  .pin-wrap { position: relative; display: flex; flex-direction: column; align-items: center; }
  .pin-dot { width: 16px; height: 16px; border-radius: 50%; background: #B85D43; border: 2.5px solid #FFF; box-shadow: 0 2px 8px rgba(0,0,0,0.35); }
  .pin-label { margin-top: 2px; background: #1E352B; color: #F4F1EA; font-family: -apple-system, sans-serif; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
</style>
</head>
<body>
<div id="map"></div>
<script>
  const userLat = ${coords.latitude};
  const userLon = ${coords.longitude};
  const places = ${markersJson};

  const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([userLat, userLon], 13);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18
  }).addTo(map);

  const bounds = [[userLat, userLon]];
  L.marker([userLat, userLon], {
    icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [14, 14], iconAnchor: [7, 7] })
  }).addTo(map);

  places.forEach((p) => {
    bounds.push([p.lat, p.lon]);
    L.marker([p.lat, p.lon], {
      icon: L.divIcon({
        className: '',
        html: '<div class="pin-wrap"><div class="pin-dot"></div><div class="pin-label">' + p.name + '</div></div>',
        iconSize: [120, 36],
        iconAnchor: [60, 10]
      })
    }).addTo(map);
  });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }
</script>
</body>
</html>`;
  }, [coords, filteredPlaces, palette.bg]);

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'nearby', label: copy.filters.nearby },
    { key: 'florist', label: copy.filters.florist },
    { key: 'supplies', label: copy.filters.supplies },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{copy.eyebrow}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>{copy.subtitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => loadPlaces(true)}
          style={[styles.refreshBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
          activeOpacity={0.75}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={palette.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filtros (sem "Plantas e vasos") */}
      <View style={styles.filtersRow}>
        {filterOptions.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setActiveFilter(item.key)}
              activeOpacity={0.8}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isActive ? palette.primary : palette.pillBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? palette.primaryText : palette.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mapa ao vivo embutido */}
      <View style={[styles.mapCard, { borderColor: palette.border }]}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.mapWebView}
          scrollEnabled={false}
          originWhitelist={['*']}
        />
      </View>

      {/* Lista de resultados */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.muted }]}>{copy.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="location-outline" size={26} color={palette.muted} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>{copy.emptyTitle}</Text>
              <Text style={[styles.emptySubtitle, { color: palette.muted }]}>{copy.emptySubtitle}</Text>
              <TouchableOpacity
                onPress={openGeneralMaps}
                style={[styles.mapsButton, { backgroundColor: palette.primary }]}
              >
                <Ionicons name="map-outline" size={16} color={palette.primaryText} />
                <Text style={[styles.mapsButtonText, { color: palette.primaryText }]}>
                  {copy.openMaps}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.mapsUrl)}
              activeOpacity={0.85}
              style={[styles.placeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.placeThumb} />
              ) : (
                <View style={[styles.placeIconBox, { backgroundColor: palette.pillBg }]}>
                  <Ionicons name="leaf-outline" size={22} color={palette.text} />
                </View>
              )}

              <View style={styles.placeInfo}>
                <Text style={[styles.placeName, { color: palette.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.placeAddress, { color: palette.muted }]} numberOfLines={1}>
                  {item.address}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.distanceText, { color: palette.accent }]}>
                    {item.distanceKm} {copy.away}
                  </Text>
                  {item.rating ? (
                    <Text style={[styles.ratingText, { color: palette.muted }]}>
                      • ★ {item.rating.toFixed(1)}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.routeBadge, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="navigate-outline" size={16} color={palette.text} />
              </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  mapCard: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  mapWebView: { flex: 1, backgroundColor: 'transparent' },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 14 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 10,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  placeThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
  },
  placeIconBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '700' },
  placeAddress: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  distanceText: { fontSize: 12, fontWeight: '600' },
  ratingText: { fontSize: 12, fontWeight: '600' },
  routeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  mapsButtonText: { fontSize: 13, fontWeight: '700' },
});