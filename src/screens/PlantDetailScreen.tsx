import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { PALETTES, TRANSLATIONS } from '../theme/theme';
import {
  formatRelativeDate,
  getNextWateringLabel,
} from '../utils/wateringSchedule';

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
  const [isWatering, setIsWatering] = useState(false);

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  const currentIndex = plants.findIndex((p) => p.id === plantId);
  const plant = plants[currentIndex];
  if (!plant) return null;

  const isLowHp = plant.hp <= 40;
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
    }, 900);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
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

      {/* Palco da Prateleira com greenhouse_bg.png */}
      <ImageBackground
        source={require('../../assets/ghibli/greenhouse_bg.png')}
        style={styles.shelfStage}
        imageStyle={{ opacity: profile.darkMode ? 0.45 : 0.92 }}
        resizeMode="cover"
      >
        <View style={styles.stageRow}>
          {prevPlant ? (
            <TouchableOpacity
              onPress={() => onSelectPlant(prevPlant.id)}
              style={styles.navArrow}
            >
              <Ionicons name="chevron-back" size={22} color="#1E352B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}

          <View style={styles.plantCenter}>
            <PlantIllustration
              category={plant.category}
              species={plant.species}
              imageUrl={plant.imageUrl}
              isLowHp={isLowHp}
              size="large"
            />
          </View>

          {nextPlant ? (
            <TouchableOpacity
              onPress={() => onSelectPlant(nextPlant.id)}
              style={styles.navArrow}
            >
              <Ionicons name="chevron-forward" size={22} color="#1E352B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        <View style={styles.woodenShelf} />
      </ImageBackground>

      {/* Painel Inferior de Hidratação e Lembretes */}
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
              {t.lastWatered}: {formatRelativeDate(plant.lastWateredAt)}
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
              {getNextWateringLabel(plant.category, plant.lastWateredAt)}
            </Text>
          </View>
        </View>

        <View style={styles.hpHeader}>
          <Text style={[styles.hpStatus, { color: colors.textPrimary }]}>
            {isLowHp ? 'Solo seco' : 'Umidade equilibrada'}
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
              ? 'Regando...'
              : `${t.waterNow} (+10 XP)`}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
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
  shelfStage: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  stageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  navArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantCenter: { alignItems: 'center', marginBottom: -8, zIndex: 2 },
  woodenShelf: {
    width: '86%',
    height: 16,
    borderRadius: 6,
    backgroundColor: '#7C5438',
    borderTopWidth: 2,
    borderTopColor: '#9A6B4A',
  },
  bottomPanel: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    padding: 22,
  },
  reminderRow: { gap: 8, marginBottom: 16 },
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
    marginBottom: 18,
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
