import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import {
  generateGhibliPlantArt,
  normalizeSpeciesKey,
} from '../services/geminiService';
import { PlantArchetype } from '../services/plantSpeciesService';
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

  const [generatingArt, setGeneratingArt] = useState(false);
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [artFeedback, setArtFeedback] = useState<{
    visible: boolean;
    title: string;
    message: string;
    tone: 'default' | 'danger' | 'success';
  }>({ visible: false, title: '', message: '', tone: 'default' });

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

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

  const handleWater = () => {
    if (isHydrated) return;
    waterPlant(plant.id);
    setCareModalVisible(true);
  };

  const handleGenerateArt = async () => {
    if (generatingArt) return;
    setGeneratingArt(true);
    const uri = await generateGhibliPlantArt(plant.species || plant.name);
    setGeneratingArt(false);

    if (uri) {
      setSpeciesArt(plant.species || plant.name, uri);
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
        message: t.artErrorMsg,
        tone: 'danger',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Bar Fiel ao Figma */}
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
        {/* Palco Editorial Arredondado da Planta */}
        <View
          style={[
            styles.artworkCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
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
              blurRadius={6}
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

          {/* Badge Flutuante "% saudável" */}
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
              {plant.hp}% {isLowHp ? t.drySoil.toLowerCase() : t.healthy.toLowerCase()}
            </Text>
          </View>

          {/* Setas Laterais para Navegar entre Plantas */}
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

        {/* Título e Espécie */}
        <Text style={[styles.plantTitle, { color: colors.textPrimary }]}>
          {plant.name}
        </Text>
        <Text style={[styles.plantSub, { color: colors.textSecondary }]}>
          {plant.species} · {plant.location}
        </Text>

        {/* 3 Cards de Métricas Fiel ao Figma (ÁGUA / LUZ / SAÚDE) */}
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

        {/* Bloco "Seu próximo cuidado" */}
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

        {/* Botão Principal Escuro */}
        <TouchableOpacity
          onPress={handleWater}
          disabled={isHydrated}
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
            {isHydrated ? t.hydrated : `${t.waterNow} · +20 XP`}
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  artworkCard: {
    height: 296,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 18,
    position: 'relative',
  },
  artworkBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  artworkVeil: {
    flex: 1,
    backgroundColor: 'rgba(246, 243, 236, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
  healthPillText: {
    fontSize: 12,
    fontWeight: '700',
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
  plantTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  plantSub: {
    fontSize: 13.5,
    marginTop: 4,
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
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
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  nextCareCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  nextCareMain: {
    fontSize: 15,
    fontWeight: '700',
  },
  nextCareSub: {
    fontSize: 12.5,
    marginTop: 4,
  },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15.5,
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
