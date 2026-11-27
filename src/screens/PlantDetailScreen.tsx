import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import {
  PlantIllustration,
  LOCAL_GHIBLI_ASSETS,
} from '../components/PlantIllustration';
import {
  generateGhibliPlantArt,
  normalizeSpeciesKey,
} from '../services/geminiService';
import { PALETTES, TRANSLATIONS } from '../theme/theme';
import {
  formatRelativeDate,
  getNextWateringLabel,
} from '../utils/wateringSchedule';
import { ThemedModal } from '../components/ThemedModal';

interface PlantDetailScreenProps {
  plantId: string;
  onBack: () => void;
  onSelectPlant: (id: string) => void;
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

  const [isWatering, setIsWatering] = useState(false);
  const [generatingArt, setGeneratingArt] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
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

  const isLowHp = plant.hp <= 40;
  const speciesKey = normalizeSpeciesKey(plant.species || plant.name);
  const resolvedGeneratedArt =
    plant.generatedArtUri || speciesArtCache[speciesKey];
  const hasLocalPng = Boolean(LOCAL_GHIBLI_ASSETS[plant.category]);

  const prevPlant =
    plants.length > 1
      ? plants[(currentIndex - 1 + plants.length) % plants.length]
      : null;
  const nextPlant =
    plants.length > 1 ? plants[(currentIndex + 1) % plants.length] : null;

  const handleWater = () => {
    if (plant.hp >= plant.maxHp || isWatering) return;
    setIsWatering(true);
    setTimeout(() => {
      waterPlant(plant.id);
      setIsWatering(false);
    }, 850);
  };

  const handleGenerateArt = async () => {
    if (generatingArt) return;
    setGeneratingArt(true);
    const uri = await generateGhibliPlantArt(plant.species || plant.name);
    setGeneratingArt(false);

    if (uri) {
      setSpeciesArt(plant.species || plant.name, uri);
      setModalInfo({
        visible: true,
        title: t.artGeneratedTitle,
        message: t.artGeneratedMsg,
        tone: 'success',
      });
    } else {
      setModalInfo({
        visible: true,
        title: t.artErrorTitle,
        message: t.artErrorMsg,
        tone: 'danger',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.roundBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {plant.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {plant.location} • {plant.species}
          </Text>
        </View>
      </View>

      {/* PALCO VISUAL LIMPO:
          - Se tiver arte completa gerada por IA -> ocupa o palco inteiro sem sobreposição.
          - Se for PNG recortado ou placeholder -> fundo Ghibli desfocado (depth of field) + apoio limpo. */}
      <View style={styles.stageContainer}>
        {resolvedGeneratedArt ? (
          <PlantIllustration
            category={plant.category}
            species={plant.species}
            generatedArtUri={resolvedGeneratedArt}
            isLowHp={isLowHp}
            size="large"
          />
        ) : (
          <ImageBackground
            source={require('../../assets/ghibli/greenhouse_bg.png')}
            style={styles.blurredBackdrop}
            blurRadius={8}
            resizeMode="cover"
          >
            <View
              style={[
                styles.softVeil,
                {
                  backgroundColor: profile.darkMode
                    ? 'rgba(18, 30, 24, 0.45)'
                    : 'rgba(244, 241, 234, 0.32)',
                },
              ]}
            >
              <View style={styles.heroPlantBox}>
                <PlantIllustration
                  category={plant.category}
                  species={plant.species}
                  isLowHp={isLowHp}
                  size="large"
                />
                {hasLocalPng && <View style={styles.groundShadow} />}
              </View>
              <View style={styles.cleanShelf} />
            </View>
          </ImageBackground>
        )}

        {/* Setas laterais flutuantes limpas */}
        {prevPlant && (
          <TouchableOpacity
            onPress={() => onSelectPlant(prevPlant.id)}
            style={[styles.navArrow, styles.navLeft]}
          >
            <Ionicons name="chevron-back" size={20} color="#1E352B" />
          </TouchableOpacity>
        )}
        {nextPlant && (
          <TouchableOpacity
            onPress={() => onSelectPlant(nextPlant.id)}
            style={[styles.navArrow, styles.navRight]}
          >
            <Ionicons name="chevron-forward" size={20} color="#1E352B" />
          </TouchableOpacity>
        )}

        {/* Botão discreto para pintar a cena Ghibli exclusiva desta espécie com IA */}
        {!resolvedGeneratedArt && (
          <TouchableOpacity
            onPress={handleGenerateArt}
            disabled={generatingArt}
            style={styles.genArtPill}
          >
            {generatingArt ? (
              <ActivityIndicator size="small" color="#FAF7F0" />
            ) : (
              <Ionicons name="sparkles" size={14} color="#FAF7F0" />
            )}
            <Text style={styles.genArtText}>
              {generatingArt ? t.generatingArt : t.generateArt}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Painel Inferior 100% Traduzido */}
      <View
        style={[
          styles.bottomPanel,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.reminderRow}>
          <View style={[styles.infoPill, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons
              name="time-outline"
              size={15}
              color={colors.mossPrimary}
            />
            <Text style={[styles.infoPillText, { color: colors.textPrimary }]}>
              {t.lastWatered}:{' '}
              {formatRelativeDate(plant.lastWateredAt, profile.language)}
            </Text>
          </View>

          <View style={[styles.infoPill, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={colors.mossPrimary}
            />
            <Text style={[styles.infoPillText, { color: colors.textPrimary }]}>
              {t.nextWatering}:{' '}
              {getNextWateringLabel(
                plant.category,
                plant.lastWateredAt,
                profile.language
              )}
            </Text>
          </View>
        </View>

        <View style={styles.hpHeader}>
          <Text style={[styles.hpStatus, { color: colors.textPrimary }]}>
            {isLowHp ? t.drySoil : t.balancedMoisture}
          </Text>
          <Text
            style={[
              styles.hpPercent,
              { color: isLowHp ? colors.terracotta : colors.mossPrimary },
            ]}
          >
            {plant.hp}%
          </Text>
        </View>

        <View style={[styles.hpTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              styles.hpFill,
              {
                width: `${plant.hp}%`,
                backgroundColor: isLowHp
                  ? colors.terracotta
                  : colors.mossPrimary,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          onPress={handleWater}
          disabled={plant.hp >= plant.maxHp || isWatering}
          style={[
            styles.waterBtn,
            {
              backgroundColor:
                plant.hp >= plant.maxHp
                  ? colors.surfaceAlt
                  : colors.mossPrimary,
            },
          ]}
        >
          <Ionicons
            name="water-outline"
            size={20}
            color={plant.hp >= plant.maxHp ? colors.textSecondary : '#FFFFFF'}
          />
          <Text
            style={[
              styles.waterBtnText,
              {
                color:
                  plant.hp >= plant.maxHp ? colors.textSecondary : '#FFFFFF',
              },
            ]}
          >
            {plant.hp >= plant.maxHp
              ? t.hydrated
              : isWatering
              ? t.watering
              : `${t.waterNow} (+10 XP)`}
          </Text>
        </TouchableOpacity>
      </View>

      <ThemedModal
        visible={modalInfo.visible}
        title={modalInfo.title}
        message={modalInfo.message}
        tone={modalInfo.tone}
        isDark={profile.darkMode}
        confirmLabel="OK"
        onConfirm={() => setModalInfo((p) => ({ ...p, visible: false }))}
      />
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
    paddingVertical: 10,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  stageContainer: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  blurredBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  softVeil: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  heroPlantBox: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -6,
    zIndex: 2,
  },
  groundShadow: {
    width: 150,
    height: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(20, 30, 24, 0.28)',
    marginTop: -12,
  },
  cleanShelf: {
    width: '84%',
    height: 14,
    borderRadius: 8,
    backgroundColor: '#7A563B',
    borderTopWidth: 2,
    borderTopColor: '#9E7353',
  },
  navArrow: {
    position: 'absolute',
    top: '48%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250, 247, 240, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
  genArtPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 53, 43, 0.82)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    zIndex: 10,
  },
  genArtText: {
    color: '#FAF7F0',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 20,
  },
  reminderRow: { gap: 8, marginBottom: 14 },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  infoPillText: { fontSize: 12.5, fontWeight: '600' },
  hpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hpStatus: { fontSize: 15, fontWeight: '700' },
  hpPercent: { fontSize: 16, fontWeight: '800' },
  hpTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  hpFill: { height: '100%', borderRadius: 5 },
  waterBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waterBtnText: { fontSize: 15.5, fontWeight: '700' },
});