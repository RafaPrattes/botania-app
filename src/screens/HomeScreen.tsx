import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlantStore,
  selectCurrentLevel,
  selectXpProgress,
  Plant,
} from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { useWeatherSync } from '../hooks/useWeatherSync';

interface HomeScreenProps {
  onSelectPlant: (plantId: string) => void;
  isLofiPlaying: boolean;
  onToggleLofi: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPlant,
  isLofiPlaying,
  onToggleLofi,
}) => {
  const currentUser = usePlantStore((s) => s.currentUser);
  const plants = usePlantStore((s) => s.plants);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const simulateDay = usePlantStore((s) => s.simulateDay);
  const setActiveView = usePlantStore((s) => s.setActiveView);
  const logoutUser = usePlantStore((s) => s.logoutUser);

  const level = usePlantStore(selectCurrentLevel);
  const xpProgress = usePlantStore(selectXpProgress);
  const { weather, temperature, weatherLabel } = useWeatherSync();

  const renderPlantCard = ({ item }: { item: Plant }) => {
    const isLowHp = item.hp <= 40;
    const isFull = item.hp === item.maxHp;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => onSelectPlant(item.id)}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatarBox}>
            <PlantIllustration
              category={item.category}
              species={item.species}
              isLowHp={isLowHp}
              size="small"
            />
          </View>

          <View style={styles.plantMeta}>
            <Text style={styles.plantName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.plantSpecies} numberOfLines={1}>
              {item.species}
            </Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location-outline" size={11} color="#4A7C59" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>

          <View
            style={[
              styles.hpBadge,
              { backgroundColor: isLowHp ? '#FDECE8' : '#E5F2E8' },
            ]}
          >
            <Text
              style={[
                styles.hpBadgeText,
                { color: isLowHp ? '#C85A43' : '#2E7D47' },
              ]}
            >
              {item.hp}%
            </Text>
          </View>
        </View>

        <View style={styles.hpTrack}>
          <View
            style={[
              styles.hpFill,
              {
                width: `${(item.hp / item.maxHp) * 100}%`,
                backgroundColor: isLowHp ? '#D96B52' : '#4E9463',
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.waterBtn, isFull && styles.waterBtnDisabled]}
          onPress={() => waterPlant(item.id)}
          disabled={isFull}
          activeOpacity={0.8}
        >
          <Ionicons
            name="water"
            size={17}
            color={isFull ? '#9A948C' : '#FFFFFF'}
          />
          <Text
            style={[styles.waterBtnText, isFull && styles.waterBtnTextDisabled]}
          >
            {isFull ? 'Hidratada' : 'Regar (+10 XP)'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {/* Barra Superior de Ações Reais */}
        <View style={styles.topNavBar}>
          <TouchableOpacity
            style={styles.navPill}
            onPress={logoutUser}
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
            <Text style={styles.navPillText}>Trocar Conta</Text>
          </TouchableOpacity>

          <View style={styles.rightPills}>
            <TouchableOpacity
              style={[
                styles.navPill,
                isLofiPlaying && { backgroundColor: '#569E6F' },
              ]}
              onPress={onToggleLofi}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isLofiPlaying ? 'volume-high' : 'musical-notes'}
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.navPillText}>
                {isLofiPlaying ? 'Lo-Fi ON' : 'Lo-Fi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navPill, { backgroundColor: '#D97B59' }]}
              onPress={() => setActiveView('onboarding')}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.navPillText}>Planta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Título + Clima Local */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>
              Estufa de {currentUser?.name || 'Jardineira'}
            </Text>
            <Text style={styles.headerSub}>
              Nível {level} • {plants.length}{' '}
              {plants.length === 1 ? 'planta' : 'plantas'}
            </Text>
          </View>

          <View style={styles.weatherPill}>
            <Ionicons
              name={
                weather === 'rain'
                  ? 'rainy'
                  : weather === 'cloudy'
                  ? 'cloudy'
                  : 'sunny'
              }
              size={15}
              color="#FFE082"
            />
            <Text style={styles.weatherText}>
              {weatherLabel}
              {temperature !== null ? ` ${temperature}°C` : ''}
            </Text>
          </View>
        </View>

        {/* Barra de XP */}
        <View style={styles.xpRow}>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpText}>{xpProgress}/100 XP</Text>
        </View>

        <TouchableOpacity
          style={styles.simBtn}
          onPress={simulateDay}
          activeOpacity={0.75}
        >
          <Ionicons name="time-outline" size={14} color="#D4E6DA" />
          <Text style={styles.simBtnText}>Simular 1 Dia (-20 HP)</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        renderItem={renderPlantCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyGarden}>
            <Ionicons name="leaf-outline" size={44} color="#6E8F7B" />
            <Text style={styles.emptyTitle}>Sua estufa ainda está vazia</Text>
            <Text style={styles.emptySub}>
              Toque em "+ Planta" no topo para adicionar suas primeiras espécies.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F3EC' },
  header: {
    backgroundColor: '#244233',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rightPills: { flexDirection: 'row', gap: 8 },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 99,
  },
  navPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12.5, color: '#BCE3C8', marginTop: 2 },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weatherText: { color: '#FFF7D6', fontSize: 11.5, fontWeight: '700' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  xpTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: '#8CE0A8', borderRadius: 99 },
  xpText: { fontSize: 11.5, fontWeight: '700', color: '#BCE3C8' },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 7,
    borderRadius: 12,
  },
  simBtnText: { fontSize: 12, fontWeight: '600', color: '#D4E6DA' },
  listContent: { padding: 18, paddingBottom: 30, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E3ECE4',
    shadowColor: '#244233',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarBox: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: '#F3EFE6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  plantMeta: { flex: 1 },
  plantName: { fontSize: 16.5, fontWeight: '800', color: '#244233' },
  plantSpecies: { fontSize: 12, fontStyle: 'italic', color: '#7A746C', marginTop: 2 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { fontSize: 11, fontWeight: '600', color: '#4A7C59' },
  hpBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  hpBadgeText: { fontSize: 12, fontWeight: '800' },
  hpTrack: {
    height: 8,
    backgroundColor: '#EFECE6',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 12,
  },
  hpFill: { height: '100%', borderRadius: 99 },
  waterBtn: {
    backgroundColor: '#4E9463',
    borderRadius: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  waterBtnDisabled: { backgroundColor: '#EFECE6' },
  waterBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  waterBtnTextDisabled: { color: '#9A948C' },
  emptyGarden: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#244233', marginTop: 12 },
  emptySub: { fontSize: 13.5, color: '#6E6A63', textAlign: 'center', marginTop: 6 },
});
