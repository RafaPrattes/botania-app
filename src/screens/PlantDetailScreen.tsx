import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ImageBackground,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import {
  generateGhibliPlantArtDetailed,
  normalizeSpeciesKey,
} from '../services/geminiService';
import { PlantArchetype } from '../services/plantSpeciesService';
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

const RAIN_STREAKS = [
  { left: '12%', delay: 0 },
  { left: '26%', delay: 180 },
  { left: '41%', delay: 90 },
  { left: '56%', delay: 260 },
  { left: '70%', delay: 140 },
  { left: '84%', delay: 310 },
];

const WATER_DROPS = [
  { left: '34%', delay: 0 },
  { left: '44%', delay: 120 },
  { left: '50%', delay: 60 },
  { left: '58%', delay: 180 },
  { left: '66%', delay: 90 },
];

const FIREFLIES = [
  { left: '22%', top: '28%' },
  { left: '74%', top: '22%' },
  { left: '62%', top: '54%' },
  { left: '30%', top: '62%' },
];

function getLightLabel(category: PlantArchetype, lang: AppLanguage): string {
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
  const profile = usePlantStore((s) => s.profile);
  const speciesArtCache = usePlantStore((s) => s.speciesArtCache);
  const setSpeciesArt = usePlantStore((s) => s.setSpeciesArt);

  const { liveMood, temperature } = useWeatherSync();
  const [moodOverride, setMoodOverride] = useState<WeatherMood | null>(null);
  const activeMood: WeatherMood = moodOverride ?? liveMood;

  const [isWatering, setIsWatering] = useState(false);
  const [generatingArt, setGeneratingArt] = useState(false);
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [artFeedback, setArtFeedback] = useState<{
    visible: boolean;
    title: string;
    message: string;
    tone: 'default' | 'danger' | 'success';
  }>({ visible: false, title: '', message: '', tone: 'default' });

  // Animações nativas na GPU (60fps, ZERO SVG)
  const rainAnim = useRef(new Animated.Value(0)).current;
  const fireflyAnim = useRef(new Animated.Value(0)).current;
  const waterDropAnim = useRef(new Animated.Value(0)).current;
  const plantBounce = useRef(new Animated.Value(1)).current;
  const xpFloatAnim = useRef(new Animated.Value(0)).current;

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  // Loop suave de chuva na janela
  useEffect(() => {
    if (activeMood !== 'rain') return;
    rainAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rainAnim, {
        toValue: 1,
        duration: 950,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [activeMood, rainAnim]);

  // Loop suave de vagalumes / estrelas à noite
  useEffect(() => {
    if (activeMood !== 'night') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fireflyAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(fireflyAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeMood, fireflyAnim]);

  const currentIndex = plants.findIndex((p) => p.id === plantId);
  const plant = plants[currentIndex];
  if (!plant) return null;

  const isLowHp = plant.hp <= 45;
  const isHydrated = plant.hp >= plant.maxHp;
  const intervalDays = getWateringIntervalDays(plant.category);
  const speciesKey = normalizeSpeciesKey(plant.species || plant.name);
  const resolvedArt = plant.generatedArtUri || speciesArtCache[speciesKey];

  const prevPlant =
    plants.length > 1
      ? plants[(currentIndex - 1 + plants.length) % plants.length]
      : null;
  const nextPlant =
    plants.length > 1 ? plants[(currentIndex + 1) % plants.length] : null;

  // Alterna o clima da janela ao tocar (útil para testar e demonstrar ao vivo!)
  const cycleWeatherMood = () => {
    const order: WeatherMood[] = ['sunny', 'rain', 'night'];
    const nextIdx = (order.indexOf(activeMood) + 1) % order.length;
    setMoodOverride(order[nextIdx]);
  };

  const handleWater = () => {
    if (isHydrated || isWatering) return;
    setIsWatering(true);
    waterDropAnim.setValue(0);
    xpFloatAnim.setValue(0);

    // 1. Gotinhas d'água caindo sobre a planta
    Animated.timing(waterDropAnim, {
      toValue: 1,
      duration: 1050,
      useNativeDriver: true,
    }).start();

    // 2. Pulinho elástico alegre da planta + "+20 XP" subindo
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.sequence([
          Animated.spring(plantBounce, {
            toValue: 1.09,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(plantBounce, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(xpFloatAnim, {
          toValue: 1,
          duration: 950,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      waterPlant(plant.id);
      setIsWatering(false);
      setCareModalVisible(true);
    });
  };

  const handleGenerateArt = async () => {
    if (generatingArt) return;
    setGeneratingArt(true);
    const res = await generateGhibliPlantArtDetailed(
      plant.species || plant.name
    );
    setGeneratingArt(false);

    if (res.ok) {
      setSpeciesArt(plant.species || plant.name, res.uri);
      setArtFeedback({
        visible: true,
        title: t.artGeneratedTitle,
        message: t.artGeneratedMsg,
        tone: 'success',
      });
    } else {
      setArtFeedback({
        visible: true,
        title: t.artErrorTitle,
        message: res.error,
        tone: 'danger',
      });
    }
  };

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

        <TouchableOpacity
          onPress={handleGenerateArt}
          disabled={generatingArt}
          style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          {generatingArt ? (
            <ActivityIndicator size="small" color={colors.mossPrimary} />
          ) : (
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.mossPrimary}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Palco Interativo de Jogo Ghibli (Clima ao vivo + Animação de Rega, ZERO SVG) */}
        <View
          style={[
            styles.artworkCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Animated.View
            style={[
              styles.sceneFull,
              { transform: [{ scale: plantBounce }] },
            ]}
          >
            {resolvedArt ? (
              <PlantIllustration
                category={plant.category}
                species={plant.species}
                generatedArtUri={resolvedArt}
                isLowHp={isLowHp}
                size="large"
              />
            ) : (
              <ImageBackground
                source={require('../../assets/ghibli/greenhouse_bg.png')}
                style={styles.artworkBackdrop}
                blurRadius={4}
                resizeMode="cover"
              >
                <View style={styles.artworkVeil}>
                  <PlantIllustration
                    category={plant.category}
                    species={plant.species}
                    isLowHp={isLowHp}
                    size="large"
                  />
                </View>
              </ImageBackground>
            )}
          </Animated.View>

          {/* Camada Atmosférica de Iluminação (Sol / Chuva / Noite) */}
          <View
            pointerEvents="none"
            style={[styles.moodOverlay, { backgroundColor: moodMeta.veil }]}
          />

          {/* Partículas de Chuva Real na Janela (Zero SVG) */}
          {activeMood === 'rain' && (
            <View pointerEvents="none" style={styles.particlesLayer}>
              {RAIN_STREAKS.map((drop, i) => {
                const translateY = rainAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40 - i * 15, 320],
                });
                return (
                  <Animated.View
                    key={`rain-${i}`}
                    style={[
                      styles.rainDrop,
                      {
                        left: drop.left as any,
                        transform: [{ translateY }, { rotate: '12deg' }],
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Vagalumes / Brilho Noturno Ghibli (Zero SVG) */}
          {activeMood === 'night' && (
            <View pointerEvents="none" style={styles.particlesLayer}>
              {FIREFLIES.map((fly, i) => {
                const opacity = fireflyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: i % 2 === 0 ? [0.2, 0.95] : [0.9, 0.25],
                });
                const translateY = fireflyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, i % 2 === 0 ? -10 : 10],
                });
                return (
                  <Animated.View
                    key={`fly-${i}`}
                    style={[
                      styles.firefly,
                      {
                        left: fly.left as any,
                        top: fly.top as any,
                        opacity,
                        transform: [{ translateY }],
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Animação Interativa de Rega: Gotas + "+20 XP" Flutuante */}
          {isWatering && (
            <View pointerEvents="none" style={styles.particlesLayer}>
              {WATER_DROPS.map((drop, idx) => {
                const translateY = waterDropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24 + idx * 8, 220],
                });
                const opacity = waterDropAnim.interpolate({
                  inputRange: [0, 0.2, 0.85, 1],
                  outputRange: [0, 1, 1, 0],
                });
                return (
                  <Animated.View
                    key={`wdrop-${idx}`}
                    style={[
                      styles.waterDroplet,
                      {
                        left: drop.left as any,
                        opacity,
                        transform: [{ translateY }],
                      },
                    ]}
                  />
                );
              })}

              <Animated.View
                style={[
                  styles.floatingXpBadge,
                  {
                    opacity: xpFloatAnim.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: xpFloatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -45],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.floatingXpText}>+20 XP</Text>
              </Animated.View>
            </View>
          )}

          {/* Badge Esquerdo: "% saudável" */}
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
              {plant.hp}%{' '}
              {isLowHp ? t.drySoil.toLowerCase() : t.healthy.toLowerCase()}
            </Text>
          </View>

          {/* Badge Direito Interativo: Clima da Janela (toque para alternar Sol / Chuva / Noite) */}
          <TouchableOpacity
            onPress={cycleWeatherMood}
            activeOpacity={0.85}
            style={styles.weatherPill}
          >
            <Ionicons name={moodMeta.icon} size={14} color="#1F3A2E" />
            <Text style={styles.weatherPillText}>{moodMeta.label}</Text>
          </TouchableOpacity>

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
        </View>

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
              {getLightLabel(plant.category, profile.language)}
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
              {plant.hp}% HP
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

        <TouchableOpacity
          onPress={handleWater}
          disabled={isHydrated || isWatering}
          activeOpacity={0.85}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: isHydrated
                ? colors.surfaceAlt
                : profile.darkMode
                ? colors.mossPrimary
                : colors.mossDeep,
            },
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              { color: isHydrated ? colors.textSecondary : '#FFFFFF' },
            ]}
          >
            {isHydrated
              ? t.hydrated
              : isWatering
              ? t.watering
              : `${t.waterNow} · +20 XP`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal "Cuidado registrado." */}
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
        visible={artFeedback.visible}
        title={artFeedback.title}
        message={artFeedback.message}
        tone={artFeedback.tone}
        isDark={profile.darkMode}
        confirmLabel="OK"
        onConfirm={() => setArtFeedback((p) => ({ ...p, visible: false }))}
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
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  artworkCard: {
    height: 310,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 18,
    position: 'relative',
  },
  sceneFull: { flex: 1, width: '100%', height: '100%' },
  artworkBackdrop: { flex: 1, width: '100%', height: '100%' },
  artworkVeil: {
    flex: 1,
    backgroundColor: 'rgba(246, 243, 236, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodOverlay: {
    ...StyleSheet.absoluteFill,
  },
  particlesLayer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  rainDrop: {
    position: 'absolute',
    width: 2.5,
    height: 26,
    borderRadius: 2,
    backgroundColor: 'rgba(218, 238, 250, 0.72)',
  },
  firefly: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFF3B0',
    shadowColor: '#FFE57F',
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 4,
  },
  waterDroplet: {
    position: 'absolute',
    width: 9,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(125, 206, 240, 0.92)',
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
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 15.5, fontWeight: '700' },
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
