import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlantStore,
  selectCurrentLevel,
  selectXpProgress,
} from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';

interface SetActiveView {
  (view: 'onboarding'): void;
}

interface HomeScreenProps {
  onSelectPlant: (plantId: string) => void;
  isLofiPlaying: boolean;
  onToggleLofi: () => void;
  setActiveView?: SetActiveView;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPlant,
  isLofiPlaying,
  onToggleLofi,
  setActiveView = () => {},
}) => {
  const plants = usePlantStore((s) => s.plants);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const simulateDay = usePlantStore((s) => s.simulateDay);
  const level = usePlantStore(selectCurrentLevel);
  const xpProgress = usePlantStore(selectXpProgress);

  const thirstyCount = plants.filter((p) => p.hp <= 40).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Colorido Estilo Cozy Game */}
      <View style={styles.header}>
        {/* Barra Superior de Navegação e Música */}
        <View style={styles.topActionBar}>
          <TouchableOpacity
            style={styles.navPillBtn}
            onPress={() => setActiveView('onboarding')}
            activeOpacity={0.8}
          >
            <Ionicons name="apps" size={16} color="#244233" />
            <Text style={styles.navPillText}>Início</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={[
                styles.lofiBtn,
                isLofiPlaying && styles.lofiBtnActive,
              ]}
              onPress={onToggleLofi}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isLofiPlaying ? 'volume-high' : 'musical-notes'}
                size={16}
                color={isLofiPlaying ? '#FFFFFF' : '#244233'}
              />
              <Text
                style={[
                  styles.lofiText,
                  isLofiPlaying && { color: '#FFFFFF' },
                ]}
              >
                {isLofiPlaying ? 'Lo-Fi ON' : 'Lo-Fi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addPlantPill}
              onPress={() => setActiveView('onboarding')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addPlantPillText}>Planta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Título e Status */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>A Estufa</Text>
            <Text style={styles.headerSubtitle}>
              Jardineira Nível {level} •{' '}
              {thirstyCount > 0
                ? `${thirstyCount} planta(s) com sede`
                : 'Todas hidratadas!'}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Ionicons name="trophy" size={16} color="#D97B59" />
            <Text style={styles.levelBadgeText}>Lvl {level}</Text>
          </View>
        </View>

        {/* Barra de XP */}
        <View style={styles.xpContainer}>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpLabel}>{xpProgress}/100 XP</Text>
        </View>

        {/* Botão Simular Tempo */}
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={simulateDay}
          activeOpacity={0.75}
        >
          <Ionicons name="time-outline" size={15} color="#D9E8DE" />
          <Text style={styles.simulateText}>
            Simular 1 Dia (-20 HP em todas)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Plantas */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {plants.map((plant) => {
          const isLowHp = plant.hp <= 40;
          const isFull = plant.hp === plant.maxHp;

          return (
            <TouchableOpacity
              key={plant.id}
              style={[
                styles.card,
                isLowHp && styles.cardThirsty,
              ]}
              onPress={() => onSelectPlant(plant.id)}
              activeOpacity={0.9}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.avatarFrame,
                    isLowHp && styles.avatarFrameThirsty,
                  ]}
                >
                  <PlantIllustration
                    category={plant.category}
                    species={plant.species}
                    isLowHp={isLowHp}
                    size="small"
                  />
                </View>

                <View style={styles.plantInfo}>
                  <View style={styles.roomBadge}>
                    <Ionicons name="location" size={11} color="#D97B59" />
                    <Text style={styles.roomBadgeText}>
                      {plant.location || 'Casa'}
                    </Text>
                  </View>
                  <Text style={styles.plantName} numberOfLines={1}>
                    {plant.name}
                  </Text>
                  <Text style={styles.plantSpecies} numberOfLines={1}>
                    {plant.species}
                  </Text>
                </View>

                <View
                  style={[
                    styles.hpBadge,
                    isLowHp ? styles.hpBadgeLow : styles.hpBadgeOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.hpBadgeText,
                      isLowHp ? styles.hpTextLow : styles.hpTextOk,
                    ]}
                  >
                    {plant.hp}%
                  </Text>
                </View>
              </View>

              {/* Barra de Vida */}
              <View style={styles.hpBarTrack}>
                <View
                  style={[
                    styles.hpBarFill,
                    {
                      width: `${(plant.hp / plant.maxHp) * 100}%`,
                      backgroundColor: isLowHp ? '#D96B52' : '#4E9463',
                    },
                  ]}
                />
              </View>

              {/* Ações do Card */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[
                    styles.waterBtn,
                    isFull && styles.waterBtnDisabled,
                  ]}
                  onPress={() => waterPlant(plant.id)}
                  disabled={isFull}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="water"
                    size={17}
                    color={isFull ? '#9E9990' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.waterBtnText,
                      isFull && styles.waterBtnTextDisabled,
                    ]}
                  >
                    {isFull ? 'Hidratada' : 'Regar (+10 XP)'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.shelfHint}>
                  <Text style={styles.shelfHintText}>Ver na prateleira</Text>
                  <Ionicons name="chevron-forward" size={15} color="#4A7C59" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    shadowColor: '#1A3025',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BCE3C8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  navPillText: { fontSize: 12.5, fontWeight: '800', color: '#244233' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lofiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4EBD8',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 99,
  },
  lofiBtnActive: { backgroundColor: '#D97B59' },
  lofiText: { fontSize: 12, fontWeight: '800', color: '#244233' },
  addPlantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#4E9463',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  addPlantPillText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#C7DFCF', marginTop: 2 },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  levelBadgeText: { fontSize: 13, fontWeight: '800', color: '#244233' },
  xpContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  xpTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: '#8CE0A5', borderRadius: 99 },
  xpLabel: { fontSize: 12, fontWeight: '700', color: '#BCE3C8' },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    borderRadius: 12,
  },
  simulateText: { fontSize: 12, color: '#D9E8DE', fontWeight: '600' },
  listContent: { padding: 18, paddingBottom: 110, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5EDE6',
    shadowColor: '#244233',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardThirsty: { borderColor: '#F2C1B3', backgroundColor: '#FFFDFB' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarFrame: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: '#F4EBD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrameThirsty: { backgroundColor: '#FCEBE6' },
  plantInfo: { flex: 1 },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  roomBadgeText: { fontSize: 11, fontWeight: '700', color: '#D97B59' },
  plantName: { fontSize: 17, fontWeight: '800', color: '#244233' },
  plantSpecies: { fontSize: 12, fontStyle: 'italic', color: '#7D786F', marginTop: 1 },
  hpBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  hpBadgeOk: { backgroundColor: '#E6F4EA' },
  hpBadgeLow: { backgroundColor: '#FCE8E3' },
  hpBadgeText: { fontSize: 12.5, fontWeight: '800' },
  hpTextOk: { color: '#2E7D47' },
  hpTextLow: { color: '#C85A43' },
  hpBarTrack: {
    height: 8,
    backgroundColor: '#EFECE6',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 14,
  },
  hpBarFill: { height: '100%', borderRadius: 99 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  waterBtn: {
    flex: 1,
    backgroundColor: '#4E9463',
    paddingVertical: 11,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  waterBtnDisabled: { backgroundColor: '#EFECE6' },
  waterBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
  waterBtnTextDisabled: { color: '#9E9990' },
  shelfHint: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  shelfHintText: { fontSize: 12, fontWeight: '700', color: '#4A7C59' },
});
