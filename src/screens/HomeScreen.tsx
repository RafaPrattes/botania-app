import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlantStore,
  selectCurrentLevel,
  selectXpProgress,
} from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import {
  PALETTES,
  TRANSLATIONS,
  getGreetingByHour,
  getGardenerRank,
} from '../theme/theme';
import { getNextWateringLabel } from '../utils/wateringSchedule';

interface HomeScreenProps {
  onSelectPlant: (id: string) => void;
  onAddPlant: () => void;
  onOpenDrawer: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPlant,
  onAddPlant,
  onOpenDrawer,
  isMusicPlaying,
  onToggleMusic,
}) => {
  const plants = usePlantStore((s) => s.plants);
  const profile = usePlantStore((s) => s.profile);
  const streakDays = usePlantStore((s) => s.streakDays);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const simulateDay = usePlantStore((s) => s.simulateDay);
  const addPlantsBatch = usePlantStore((s) => s.addPlantsBatch);
  const currentLevel = usePlantStore(selectCurrentLevel);
  const xpProgress = usePlantStore(selectXpProgress);

  const [filter, setFilter] = useState<'all' | 'thirsty'>('all');
  const [careModalVisible, setCareModalVisible] = useState(false);

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];
  const greeting = getGreetingByHour(profile.language);
  const rankTitle = getGardenerRank(currentLevel, profile.language);

  const thirstyPlants = useMemo(
    () => plants.filter((p) => p.hp <= 45),
    [plants]
  );

  const visiblePlants = filter === 'thirsty' ? thirstyPlants : plants;

  const handleLoadSampleGreenhouse = () => {
    addPlantsBatch([
      {
        name: 'Costela-de-adão',
        species: 'Monstera deliciosa',
        category: 'folhagem',
        location: 'Sala de Estar',
      },
      {
        name: 'Maranta',
        species: 'Calathea orbifolia',
        category: 'pendente',
        location: 'Quarto',
      },
      {
        name: 'Cacto Florido',
        species: 'Mammillaria',
        category: 'cacto',
        location: 'Varanda',
      },
    ]);
  };

  const handleWaterCard = (plantId: string) => {
    waterPlant(plantId);
    setCareModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Header Editorial Fiel ao Figma */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onOpenDrawer}
          activeOpacity={0.75}
          style={styles.headerLeft}
        >
          <View style={styles.greetingRow}>
            {profile.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.miniAvatar}
              />
            ) : (
              <Ionicons
                name="menu-outline"
                size={15}
                color={colors.mossMuted}
              />
            )}
            <Text style={[styles.eyebrow, { color: colors.mossMuted }]}>
              {greeting}, {profile.name.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
            {t.yourGreenhouse}
          </Text>
        </TouchableOpacity>

        {/* Botões Circulares: Lo-Fi + Adicionar Planta */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onToggleMusic}
            activeOpacity={0.8}
            style={[
              styles.circleBtn,
              {
                backgroundColor: isMusicPlaying
                  ? colors.mossPrimary
                  : colors.surfaceAlt,
              },
            ]}
          >
            <Ionicons
              name={isMusicPlaying ? 'musical-notes' : 'musical-notes-outline'}
              size={20}
              color={isMusicPlaying ? '#FFFFFF' : colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onAddPlant}
            activeOpacity={0.85}
            style={[
              styles.circleBtn,
              {
                backgroundColor: profile.darkMode
                  ? colors.mossPrimary
                  : colors.mossDeep,
              },
            ]}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={visiblePlants}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Card Verde Musgo Profundo de Ofensiva & XP */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: profile.darkMode ? '#1C3026' : '#1F3A2E',
                },
              ]}
            >
              <View style={styles.streakRow}>
                <Ionicons name="sunny-outline" size={20} color="#E7DFCE" />
                <Text style={styles.streakTitle}>
                  {streakDays}{' '}
                  {streakDays === 1 ? t.streakLabelSingle : t.streakLabel}
                </Text>
              </View>

              <View style={styles.levelMetaRow}>
                <Text style={styles.levelMetaText}>
                  {t.level} {currentLevel} · {rankTitle}
                </Text>
                <Text style={styles.xpMetaText}>{xpProgress} / 100 XP</Text>
              </View>

              <View style={styles.heroTrack}>
                <View
                  style={[
                    styles.heroFill,
                    { width: `${Math.max(8, xpProgress)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Cabeçalho da Lista: Suas plantas + Contagem */}
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t.yourPlants}
              </Text>
              <View style={styles.sectionRight}>
                <Text
                  style={[
                    styles.companionsText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {plants.length}{' '}
                  {plants.length === 1 ? t.companionSingle : t.companions}
                </Text>
                {plants.length > 0 && (
                  <TouchableOpacity
                    onPress={simulateDay}
                    style={[
                      styles.simMiniPill,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Text
                      style={[
                        styles.simMiniText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      +1d
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Filtros em Pílula Fiel ao Vídeo */}
            {plants.length > 0 && (
              <View style={styles.filterRow}>
                <TouchableOpacity
                  onPress={() => setFilter('all')}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor:
                        filter === 'all'
                          ? profile.darkMode
                            ? colors.mossPrimary
                            : colors.mossDeep
                          : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color:
                          filter === 'all' ? '#FFFFFF' : colors.textPrimary,
                      },
                    ]}
                  >
                    {t.filterAll} · {plants.length}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFilter('thirsty')}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor:
                        filter === 'thirsty'
                          ? profile.darkMode
                            ? colors.mossPrimary
                            : colors.mossDeep
                          : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color:
                          filter === 'thirsty' ? '#FFFFFF' : colors.textPrimary,
                      },
                    ]}
                  >
                    {t.filterThirsty} · {thirstyPlants.length}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          plants.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Ionicons
                  name="leaf-outline"
                  size={28}
                  color={colors.mossPrimary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {t.emptyTitle}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {t.emptySub}
              </Text>
              <TouchableOpacity
                onPress={onAddPlant}
                style={[
                  styles.emptyPrimaryBtn,
                  {
                    backgroundColor: profile.darkMode
                      ? colors.mossPrimary
                      : colors.mossDeep,
                  },
                ]}
              >
                <Text style={styles.emptyPrimaryText}>{t.emptyAddBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLoadSampleGreenhouse}
                style={[
                  styles.emptySecondaryBtn,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Text
                  style={[
                    styles.emptySecondaryText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t.emptySampleBtn}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={30}
                color={colors.mossPrimary}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.textPrimary, marginTop: 10 },
                ]}
              >
                {t.emptyThirstyTitle}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {t.emptyThirstySub}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isLowHp = item.hp <= 45;
          const isHydrated = item.hp >= item.maxHp;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSelectPlant(item.id)}
              style={[
                styles.plantCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardBody}>
                {/* Miniatura da Planta */}
                <View
                  style={[
                    styles.thumbFrame,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <PlantIllustration
                    category={item.category}
                    species={item.species}
                    generatedArtUri={item.generatedArtUri}
                    isLowHp={isLowHp}
                    size="small"
                  />
                </View>

                {/* Conteúdo Editorial Direito */}
                <View style={styles.cardRight}>
                  <Text
                    style={[styles.plantName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.plantSpecies,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.species}
                  </Text>

                  {/* Barra de HP Fina */}
                  <View
                    style={[
                      styles.hpTrack,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <View
                      style={[
                        styles.hpFill,
                        {
                          width: `${item.hp}%`,
                          backgroundColor: isLowHp
                            ? colors.terracotta
                            : colors.mossPrimary,
                        },
                      ]}
                    />
                  </View>

                  {/* Linha Inferior: Status + Botão Regar */}
                  <View style={styles.cardBottomRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isLowHp
                              ? colors.terracotta
                              : colors.mossPrimary,
                          },
                        ]}
                      >
                        {item.hp}% · {isLowHp ? t.drySoil : t.healthy}
                      </Text>
                      <Text
                        style={[
                          styles.scheduleCaption,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {t.nextWatering}:{' '}
                        {getNextWateringLabel(
                          item.category,
                          item.lastWateredAt,
                          profile.language
                        )}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleWaterCard(item.id)}
                      disabled={isHydrated}
                      activeOpacity={0.8}
                      style={[
                        styles.waterPill,
                        {
                          backgroundColor: isHydrated
                            ? colors.surfaceAlt
                            : isLowHp
                            ? colors.terracotta
                            : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.waterPillText,
                          {
                            color: isHydrated
                              ? colors.textSecondary
                              : isLowHp
                              ? '#FFFFFF'
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        {isHydrated ? t.wateredBtn : t.waterQuick}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal "Cuidado registrado." 100% Fiel ao Vídeo do Protótipo */}
      <Modal visible={careModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.careModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.dropCircle,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Ionicons
                name="water-outline"
                size={24}
                color={colors.mossPrimary}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t.waterModalTitle}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {t.waterModalDesc}
            </Text>

            <TouchableOpacity
              onPress={() => setCareModalVisible(false)}
              activeOpacity={0.85}
              style={[
                styles.modalCtaBtn,
                {
                  backgroundColor: profile.darkMode
                    ? colors.mossPrimary
                    : colors.mossDeep,
                },
              ]}
            >
              <Text style={styles.modalCtaText}>{t.waterModalBtn}</Text>
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
  headerLeft: { flex: 1 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  streakTitle: {
    color: '#FAF7F0',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  levelMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelMetaText: {
    color: 'rgba(246, 243, 236, 0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  xpMetaText: {
    color: 'rgba(246, 243, 236, 0.92)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  heroTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#C5D5C8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companionsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  simMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  simMiniText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  plantCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumbFrame: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRight: {
    flex: 1,
  },
  plantName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  plantSpecies: {
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: 10,
  },
  hpTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  hpFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleCaption: {
    fontSize: 11.5,
    marginTop: 2,
  },
  waterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
  },
  waterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyPrimaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySecondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptySecondaryText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 22, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  careModalCard: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
  },
  dropCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  modalCtaBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
