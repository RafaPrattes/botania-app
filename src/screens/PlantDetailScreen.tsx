import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ImageBackground,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { PlantArchetype } from '../services/plantSpeciesService';
import { findCuratedSpecies } from '../data/houseplantLibrary';
import { useWeatherSync, WeatherMood } from '../hooks/useWeatherSync';
import { AppLanguage, PALETTES, TRANSLATIONS } from '../theme/theme';
import {
  formatRelativeDate,
  getNextWateringLabel,
  getWateringIntervalDays,
} from '../utils/wateringSchedule';
import { ThemedModal } from '../components/ThemedModal';

interface PlantDetailScreenProps {
  plantId: string;
  onBack: () => void;
  onSelectPlant: (id: string) => void;
}

const DELETE_COPY: Record<
  AppLanguage,
  {
    btnLabel: string;
    title: string;
    message: (name: string) => string;
    confirm: string;
  }
> = {
  pt: {
    btnLabel: 'Remover planta da estufa',
    title: 'Remover esta planta?',
    message: (name) =>
      `"${name}" será retirada da sua estufa. Essa ação não pode ser desfeita.`,
    confirm: 'Remover',
  },
  en: {
    btnLabel: 'Remove plant from greenhouse',
    title: 'Remove this plant?',
    message: (name) =>
      `"${name}" will be removed from your greenhouse. This action cannot be undone.`,
    confirm: 'Remove',
  },
  es: {
    btnLabel: 'Eliminar planta del invernadero',
    title: '¿Eliminar esta planta?',
    message: (name) =>
      `"${name}" se eliminará de tu invernadero. Esta acción no se puede deshacer.`,
    confirm: 'Eliminar',
  },
};

function getLightLabel(
  speciesName: string,
  category: PlantArchetype,
  lang: AppLanguage
): string {
  const curated = findCuratedSpecies(speciesName);
  if (curated) {
    if (lang === 'en') return curated.lightEn;
    if (lang === 'es') return curated.lightEs;
    return curated.lightPt;
  }
  const map: Record<PlantArchetype, Record<AppLanguage, string>> = {
    cacto: { pt: 'Sol pleno', en: 'Full sun', es: 'Sol directo' },
    suculenta: { pt: 'Sol suave', en: 'Bright sun', es: 'Sol suave' },
    pendente: { pt: 'Meia-sombra', en: 'Half shade', es: 'Semisombra' },
    bonsai: { pt: 'Luz direta', en: 'Direct light', es: 'Luz directa' },
    flor: { pt: 'Claridade', en: 'Bright light', es: 'Mucha luz' },
    folhagem: { pt: 'Indireta', en: 'Indirect', es: 'Indirecta' },
  };
  return map[category]?.[lang] ?? map.folhagem[lang];
}

export const PlantDetailScreen: React.FC<PlantDetailScreenProps> = ({
  plantId,
  onBack,
  onSelectPlant,
}) => {
  const plants = usePlantStore((s) => s.plants);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const removePlant = usePlantStore((s) => s.removePlant);
  const profile = usePlantStore((s) => s.profile);

  const { liveMood, temperature } = useWeatherSync();
  const [moodOverride, setMoodOverride] = useState<WeatherMood | null>(null);
  const activeMood: WeatherMood = moodOverride ?? liveMood;

  const [isHoldingWater, setIsHoldingWater] = useState(false);
  const [liveWaterPct, setLiveWaterPct] = useState(0);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const xpFloatAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];
  const deleteCopy = DELETE_COPY[profile.language];

  const currentIndex = plants.findIndex((p) => p.id === plantId);
  const plant = plants[currentIndex];

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  if (!plant) return null;

  const curatedInfo = findCuratedSpecies(plant.species || plant.name);
  const displayedHp = isHoldingWater
    ? Math.min(100, Math.round(plant.hp + ((100 - plant.hp) * liveWaterPct) / 100))
    : plant.hp;

  const isLowHp = displayedHp <= 45;
  const isHydrated = plant.hp >= plant.maxHp;
  const intervalDays =
    curatedInfo?.wateringDays ?? getWateringIntervalDays(plant.category);

  const prevPlant =
    plants.length > 1
      ? plants[(currentIndex - 1 + plants.length) % plants.length]
      : null;
  const nextPlant =
    plants.length > 1 ? plants[(currentIndex + 1) % plants.length] : null;

  const showPlantSpeech = (text: string) => {
    setSpeechBubble(text);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => setSpeechBubble(null), 2600);
  };

  const handlePetPlant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.06,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(wobbleAnim, {
        toValue: -1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(wobbleAnim, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const moodMsg = isLowHp
      ? curatedInfo?.cozyMoodThirsty || 'Estou com um pouquinho de sede...'
      : curatedInfo?.cozyMoodHealthy || 'Folhinhas felizes com seu carinho!';
    showPlantSpeech(moodMsg);
  };

  const startHoldWater = () => {
    if (isHydrated) return;
    setIsHoldingWater(true);
    setLiveWaterPct(8);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let pct = 8;
    holdTimerRef.current = setInterval(() => {
      pct += 12;
      if (pct >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setLiveWaterPct(100);
        finishWatering();
      } else {
        setLiveWaterPct(pct);
        Haptics.selectionAsync();
      }
    }, 110);
  };

  const cancelHoldWater = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
      setIsHoldingWater(false);
      setLiveWaterPct(0);
    }
  };

  const finishWatering = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    xpFloatAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(xpFloatAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start(() => {
      waterPlant(plant.id);
      setIsHoldingWater(false);
      setLiveWaterPct(0);
      setCareModalVisible(true);
    });
  };

  const handleConfirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleteModalVisible(false);
    removePlant(plant.id);
    onBack();
  };

  const cycleWeatherMood = () => {
    Haptics.selectionAsync();
    const order: WeatherMood[] = ['sunny', 'rain', 'night'];
    const nextIdx = (order.indexOf(activeMood) + 1) % order.length;
    setMoodOverride(order[nextIdx]);
  };

  const wobbleRotate = wobbleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3.5deg', '3.5deg'],
  });

  const moodMeta = {
    sunny: {
      icon: 'sunny-outline' as const,
      label: temperature !== null ? `${temperature}°C` : 'Sol',
      veil: 'rgba(255, 241, 204, 0.14)',
    },
    rain: {
      icon: 'rainy-outline' as const,
      label: temperature !== null ? `${temperature}°C` : 'Chuva',
      veil: 'rgba(28, 48, 60, 0.34)',
    },
    night: {
      icon: 'moon-outline' as const,
      label: temperature !== null ? `${temperature}°C` : 'Noite',
      veil: 'rgba(13, 24, 38, 0.56)',
    },
  }[activeMood];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t.myPlant}
        </Text>

        {/* Ações no topo direito: Pet Safe + Excluir */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            onPress={() =>
              showPlantSpeech(
                curatedInfo?.petSafe
                  ? 'Espécie segura para cães e gatos!'
                  : 'Atenção: mantenha fora do alcance de pets.'
              )
            }
            style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons
              name="paw-outline"
              size={18}
              color={
                curatedInfo?.petSafe ? colors.mossPrimary : colors.terracotta
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDeleteModalVisible(true)}
            style={[
              styles.circleBtn,
              { backgroundColor: colors.terracottaSoft },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.terracotta}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Palco Interativo */}
        <Pressable
          onPress={handlePetPlant}
          style={[
            styles.artworkCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <ImageBackground
            source={require('../../assets/ghibli/greenhouse_bg.png')}
            style={styles.artworkBackdrop}
            blurRadius={4}
            resizeMode="cover"
          >
            <View
              style={[
                styles.artworkVeil,
                { backgroundColor: moodMeta.veil },
              ]}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }, { rotate: wobbleRotate }],
                }}
              >
                <PlantIllustration
                  category={plant.category}
                  species={plant.species}
                  isLowHp={isLowHp}
                  size="large"
                />
              </Animated.View>
            </View>
          </ImageBackground>

          {speechBubble && (
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>{speechBubble}</Text>
            </View>
          )}

          {liveWaterPct === 100 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floatingXpBadge,
                {
                  opacity: xpFloatAnim.interpolate({
                    inputRange: [0, 0.2, 0.85, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: xpFloatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [15, -45],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.floatingXpText}>+20 XP</Text>
            </Animated.View>
          )}

          <View style={styles.healthPill}>
            <Ionicons
              name="leaf-outline"
              size={13}
              color={isLowHp ? '#A95138' : '#1F3A2E'}
            />
            <Text
              style={[
                styles.healthPillText,
                { color: isLowHp ? '#A95138' : '#1F3A2E' },
              ]}
            >
              {displayedHp}%{' '}
              {isLowHp ? t.drySoil.toLowerCase() : t.healthy.toLowerCase()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={cycleWeatherMood}
            activeOpacity={0.85}
            style={styles.weatherPill}
          >
            <Ionicons name={moodMeta.icon} size={14} color="#1F3A2E" />
            <Text style={styles.weatherPillText}>{moodMeta.label}</Text>
          </TouchableOpacity>

          {!speechBubble && (
            <View style={styles.petHintPill}>
              <Text style={styles.petHintText}>
                Toque na planta para interagir
              </Text>
            </View>
          )}

          {prevPlant && (
            <TouchableOpacity
              onPress={() => onSelectPlant(prevPlant.id)}
              style={[styles.sideArrow, styles.sideLeft]}
            >
              <Ionicons name="chevron-back" size={18} color="#1F3A2E" />
            </TouchableOpacity>
          )}
          {nextPlant && (
            <TouchableOpacity
              onPress={() => onSelectPlant(nextPlant.id)}
              style={[styles.sideArrow, styles.sideRight]}
            >
              <Ionicons name="chevron-forward" size={18} color="#1F3A2E" />
            </TouchableOpacity>
          )}
        </Pressable>

        <Text style={[styles.plantTitle, { color: colors.textPrimary }]}>
          {plant.name}
        </Text>
        <Text style={[styles.plantSub, { color: colors.textSecondary }]}>
          {plant.species} · {plant.location}
        </Text>

        {/* 3 Cards de Métricas */}
        <View style={styles.metricsRow}>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.metricTop}>
              <Ionicons
                name="water-outline"
                size={15}
                color={colors.mossPrimary}
              />
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                {t.metricWater}
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {intervalDays} {t.daysUnit}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.metricTop}>
              <Ionicons
                name="sunny-outline"
                size={15}
                color={colors.mossPrimary}
              />
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                {t.metricLight}
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {getLightLabel(plant.species, plant.category, profile.language)}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.metricTop}>
              <Ionicons
                name="leaf-outline"
                size={15}
                color={isLowHp ? colors.terracotta : colors.mossPrimary}
              />
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                {t.metricHealth}
              </Text>
            </View>
            <Text
              style={[
                styles.metricValue,
                { color: isLowHp ? colors.terracotta : colors.textPrimary },
              ]}
            >
              {displayedHp}% HP
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          {t.nextCareTitle}
        </Text>

        <View
          style={[
            styles.nextCareCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.nextCareMain, { color: colors.textPrimary }]}>
            {t.nextWatering}:{' '}
            {getNextWateringLabel(
              plant.category,
              plant.lastWateredAt,
              profile.language
            )}
          </Text>
          <Text style={[styles.nextCareSub, { color: colors.textSecondary }]}>
            {t.lastWatered}:{' '}
            {formatRelativeDate(plant.lastWateredAt, profile.language)}
          </Text>
        </View>

        {/* Botão Segurar para Regar */}
        <Pressable
          onPressIn={startHoldWater}
          onPressOut={cancelHoldWater}
          disabled={isHydrated}
          style={[
            styles.holdCtaBtn,
            {
              backgroundColor: isHydrated
                ? colors.surfaceAlt
                : profile.darkMode
                ? '#24352D'
                : '#1F3A2E',
            },
          ]}
        >
          {isHoldingWater && (
            <View
              style={[
                styles.holdProgressFill,
                { width: `${liveWaterPct}%` },
              ]}
            />
          )}
          <Ionicons
            name="water"
            size={18}
            color={isHydrated ? colors.textSecondary : '#FFFFFF'}
            style={{ zIndex: 2 }}
          />
          <Text
            style={[
              styles.ctaText,
              {
                color: isHydrated ? colors.textSecondary : '#FFFFFF',
                zIndex: 2,
              },
            ]}
          >
            {isHydrated
              ? t.hydrated
              : isHoldingWater
              ? `${t.watering} ${liveWaterPct}%`
              : `Segure para regar · +20 XP`}
          </Text>
        </Pressable>

        {/* Botão explícito de Excluir no rodapé */}
        <TouchableOpacity
          onPress={() => setDeleteModalVisible(true)}
          activeOpacity={0.8}
          style={[
            styles.deleteFooterBtn,
            {
              backgroundColor: colors.terracottaSoft,
              borderColor: colors.terracotta,
            },
          ]}
        >
          <Ionicons name="trash-outline" size={17} color={colors.terracotta} />
          <Text style={[styles.deleteFooterText, { color: colors.terracotta }]}>
            {deleteCopy.btnLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={careModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.careModalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
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

      <ThemedModal
        visible={deleteModalVisible}
        title={deleteCopy.title}
        message={deleteCopy.message(plant.name)}
        icon="trash-outline"
        tone="danger"
        isDark={profile.darkMode}
        cancelLabel={t.cancel}
        confirmLabel={deleteCopy.confirm}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  artworkCard: {
    height: 318,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 18,
    position: 'relative',
  },
  artworkBackdrop: { flex: 1, width: '100%', height: '100%' },
  artworkVeil: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1F3A2E',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  speechText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F3A2E',
    textAlign: 'center',
  },
  petHintPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(31, 58, 46, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  petHintText: {
    color: '#FAF7F0',
    fontSize: 11,
    fontWeight: '600',
  },
  floatingXpBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '36%',
    backgroundColor: '#1F3A2E',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  floatingXpText: {
    color: '#F5E6B8',
    fontSize: 15,
    fontWeight: '800',
  },
  healthPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthPillText: { fontSize: 12, fontWeight: '700' },
  weatherPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },
  weatherPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F3A2E',
  },
  sideArrow: {
    position: 'absolute',
    top: '46%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLeft: { left: 12 },
  sideRight: { right: 12 },
  plantTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  plantSub: { fontSize: 13.5, marginTop: 4, marginBottom: 18 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  metricLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6 },
  metricValue: { fontSize: 15, fontWeight: '800' },
  sectionHeading: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  nextCareCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  nextCareMain: { fontSize: 15, fontWeight: '700' },
  nextCareSub: { fontSize: 12.5, marginTop: 4 },
  holdCtaBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  holdProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3D6249',
  },
  ctaText: { fontSize: 15.5, fontWeight: '700' },
  deleteFooterBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteFooterText: {
    fontSize: 14,
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
  modalCtaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
