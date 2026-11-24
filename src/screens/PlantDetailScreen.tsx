import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { useDayNightCycle } from '../hooks/useDayNightCycle';
import { useWeatherSync } from '../hooks/useWeatherSync';

interface PlantDetailScreenProps {
  plantId: string;
  onSelectPlant: (id: string) => void;
  onBack: () => void;
}

export const PlantDetailScreen: React.FC<PlantDetailScreenProps> = ({
  plantId,
  onSelectPlant,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const plants = usePlantStore((s) => s.plants);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const seenTutorials = usePlantStore((s) => s.seenTutorials);
  const dismissTutorial = usePlantStore((s) => s.dismissTutorial);

  const currentIndex = plants.findIndex((p) => p.id === plantId);
  const plant = currentIndex >= 0 ? plants[currentIndex] : plants[0];

  const [isWatering, setIsWatering] = useState(false);
  const { isNight } = useDayNightCycle();
  const { weather, weatherLabel } = useWeatherSync();

  const dropAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (!isWatering) return;

    const animations = dropAnims.map((anim, index) => {
      anim.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(anim, {
            toValue: 1,
            duration: 750,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isWatering, dropAnims]);

  if (!plant) return null;

  const isLowHp = plant.hp <= 40;
  const isFull = plant.hp === plant.maxHp;
  const hasMultiplePlants = plants.length > 1;

  const goToPrevPlant = () => {
    const prevIdx = (currentIndex - 1 + plants.length) % plants.length;
    onSelectPlant(plants[prevIdx].id);
  };

  const goToNextPlant = () => {
    const nextIdx = (currentIndex + 1) % plants.length;
    onSelectPlant(plants[nextIdx].id);
  };

  const handleWater = () => {
    if (isFull || isWatering) return;
    setIsWatering(true);
    setTimeout(() => {
      waterPlant(plant.id);
      setIsWatering(false);
    }, 1500);
  };

  // Paleta dinâmica por período do dia e clima
  const isRainy = weather === 'rain';
  const roomBg = isNight ? '#192231' : isRainy ? '#E3E9EC' : '#F3E8D6';
  const windowSky = isNight ? '#0D1422' : isRainy ? '#9DB4C4' : '#CBE8F6';
  const windowFrame = isNight ? '#2D3A4F' : '#8C6244';
  const headerText = isNight ? '#F2EDE4' : '#244233';
  const subText = isNight ? '#A4B3C8' : '#6A655D';

  const windowSize = Math.min(245, Math.round(width * 0.6));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: roomBg }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: isNight
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(255,255,255,0.85)',
            },
          ]}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color={headerText} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.plantName, { color: headerText }]} numberOfLines={1}>
            {plant.name}
          </Text>
          <Text style={[styles.plantSpecies, { color: subText }]} numberOfLines={1}>
            {plant.species} • {isNight ? 'Noite' : 'Dia'} • {weatherLabel}
          </Text>
        </View>
      </View>

      {/* Tutorial Único de Primeiro Acesso (Não-obrigatório) */}
      {!seenTutorials.detail && (
        <View style={styles.coachmarkCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachmarkTitle}>Prateleira Interativa</Text>
            <Text style={styles.coachmarkBody}>
              A janela sincroniza com o horário e o clima real da sua cidade. Use as setas laterais para alternar entre suas plantas!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.coachmarkBtn}
            onPress={() => dismissTutorial('detail')}
          >
            <Text style={styles.coachmarkBtnText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Palco da Prateleira Cozy */}
      <View style={styles.shelfStage}>
        {/* Janela com Ciclo Dia/Noite e Chuva Real */}
        <View
          style={[
            styles.windowArch,
            {
              width: windowSize,
              height: windowSize * 1.12,
              backgroundColor: windowSky,
              borderColor: windowFrame,
            },
          ]}
        >
          {/* Cruz da janela */}
          <View style={[styles.windowCrossH, { backgroundColor: windowFrame }]} />
          <View style={[styles.windowCrossV, { backgroundColor: windowFrame }]} />

          {/* Sol (Dia Limpo) ou Lua + Estrelas (Noite) */}
          {isNight ? (
            <>
              <View style={styles.moon}>
                <View style={styles.moonShadow} />
              </View>
              <View style={[styles.star, { top: 34, right: 44 }]} />
              <View style={[styles.star, { top: 68, right: 66, width: 3, height: 3 }]} />
              <View style={[styles.star, { top: 48, left: 105 }]} />
            </>
          ) : (
            !isRainy && <View style={styles.sunGlow} />
          )}

          {/* Gotas de Chuva na Janela quando weather === 'rain' */}
          {isRainy && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {[
                { top: 28, left: 42 },
                { top: 55, left: 108 },
                { top: 40, left: 168 },
                { top: 95, left: 68 },
                { top: 110, left: 142 },
                { top: 150, left: 52 },
                { top: 165, left: 128 },
                { top: 145, left: 185 },
              ].map((drop, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: drop.top,
                    left: drop.left,
                    width: 2.5,
                    height: 14,
                    borderRadius: 2,
                    backgroundColor: 'rgba(130, 195, 245, 0.85)',
                    transform: [{ rotate: '14deg' }],
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Setas Laterais para Navegar entre Plantas */}
        {hasMultiplePlants && (
          <>
            <TouchableOpacity
              style={[styles.sideNavBtn, { left: 14 }]}
              onPress={goToPrevPlant}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={22} color="#244233" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideNavBtn, { right: 14 }]}
              onPress={goToNextPlant}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-forward" size={22} color="#244233" />
            </TouchableOpacity>
          </>
        )}

        {/* Planta Central + Gotas de Rega */}
        <View style={styles.plantWrapper}>
          {isWatering && (
            <View style={styles.dropsContainer} pointerEvents="none">
              {dropAnims.map((anim, i) => {
                const translateY = anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-15, 130],
                });
                const opacity = anim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waterDrop,
                      { transform: [{ translateY }], opacity },
                    ]}
                  />
                );
              })}
            </View>
          )}

          <PlantIllustration
            category={plant.category}
            species={plant.species}
            imageUrl={plant.imageUrl}
            isLowHp={isLowHp}
            size="large"
          />
        </View>

        {/* Elementos Cozy na Prateleira (Livros, Saquinho de Terra e Pazinha) */}
        <View style={styles.cozyPropsRow} pointerEvents="none">
          {/* Pilha de 2 livros antigos à esquerda */}
          <View style={styles.booksProp}>
            <View style={[styles.bookSpine, { backgroundColor: '#5B7B6A', width: 44 }]} />
            <View style={[styles.bookSpine, { backgroundColor: '#C46D53', width: 50 }]} />
          </View>

          {/* Saquinho de terra e pazinha à direita */}
          <View style={styles.gardenToolsProp}>
            <View style={styles.soilBag}>
              <View style={styles.soilTop} />
            </View>
            <View style={styles.trowelHandle} />
          </View>
        </View>

        {/* Prateleira de Madeira */}
        <View style={styles.shelfPlank}>
          <View style={[styles.shelfBracket, { left: 36 }]} />
          <View style={[styles.shelfBracket, { right: 36 }]} />
        </View>
      </View>

      {/* Painel Inferior */}
      <View style={styles.bottomCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusLabel}>
              Local: {plant.location} • Planta {currentIndex + 1} de {plants.length}
            </Text>
            <Text
              style={[
                styles.statusTitle,
                { color: isLowHp ? '#C85A43' : '#2E7D47' },
              ]}
            >
              {isLowHp ? 'Precisando de água...' : 'Cheia de vida!'}
            </Text>
          </View>
          <Text
            style={[
              styles.hpPercent,
              { color: isLowHp ? '#C85A43' : '#244233' },
            ]}
          >
            {plant.hp}%
          </Text>
        </View>

        <View style={styles.hpTrack}>
          <View
            style={[
              styles.hpFill,
              {
                width: `${(plant.hp / plant.maxHp) * 100}%`,
                backgroundColor: isLowHp ? '#D96B52' : '#4E9463',
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.waterButton,
            (isFull || isWatering) && styles.waterButtonDisabled,
          ]}
          onPress={handleWater}
          disabled={isFull || isWatering}
          activeOpacity={0.85}
        >
          <Ionicons
            name="water"
            size={22}
            color={isFull ? '#9A948C' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.waterButtonText,
              isFull && styles.waterButtonTextDisabled,
            ]}
          >
            {isFull
              ? 'Planta Hidratada'
              : isWatering
              ? 'Regando...'
              : 'Regar Planta (+10 XP)'}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, alignItems: 'flex-end', marginLeft: 12 },
  plantName: { fontSize: 20, fontWeight: '800' },
  plantSpecies: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  coachmarkCard: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D8E3D9',
    zIndex: 25,
  },
  coachmarkTitle: { fontSize: 13, fontWeight: '800', color: '#244233' },
  coachmarkBody: { fontSize: 11.5, color: '#5A554E', marginTop: 2, lineHeight: 16 },
  coachmarkBtn: {
    backgroundColor: '#244233',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  coachmarkBtnText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
  shelfStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  windowArch: {
    position: 'absolute',
    top: 10,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    borderWidth: 10,
    overflow: 'hidden',
  },
  windowCrossH: {
    position: 'absolute',
    top: '52%',
    width: '100%',
    height: 8,
  },
  windowCrossV: {
    position: 'absolute',
    left: '49%',
    width: 8,
    height: '100%',
  },
  sunGlow: {
    position: 'absolute',
    top: 24,
    left: 26,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 240, 175, 0.85)',
  },
  moon: {
    position: 'absolute',
    top: 28,
    left: 34,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF4C2',
    overflow: 'hidden',
  },
  moonShadow: {
    position: 'absolute',
    top: -6,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D1422',
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFBE6',
  },
  sideNavBtn: {
    position: 'absolute',
    top: '46%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 25,
  },
  plantWrapper: {
    zIndex: 12,
    marginBottom: -28,
    alignItems: 'center',
  },
  dropsContainer: {
    position: 'absolute',
    top: -10,
    width: 150,
    height: 150,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 20,
  },
  waterDrop: {
    width: 7,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#4FC3F7',
  },
  cozyPropsRow: {
    width: '84%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    marginBottom: -2,
    zIndex: 8,
  },
  booksProp: {
    alignItems: 'flex-start',
    gap: 2,
  },
  bookSpine: {
    height: 10,
    borderRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#EFE6D5',
  },
  gardenToolsProp: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  soilBag: {
    width: 30,
    height: 26,
    backgroundColor: '#A68263',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  soilTop: {
    width: '100%',
    height: 7,
    backgroundColor: '#4E3423',
  },
  trowelHandle: {
    width: 7,
    height: 22,
    backgroundColor: '#C98A5B',
    borderRadius: 3,
    transform: [{ rotate: '18deg' }],
  },
  shelfPlank: {
    width: '88%',
    height: 22,
    backgroundColor: '#8E6244',
    borderRadius: 6,
    borderTopWidth: 2,
    borderTopColor: '#B58360',
    shadowColor: '#2A180C',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  shelfBracket: {
    position: 'absolute',
    top: 20,
    width: 12,
    height: 42,
    backgroundColor: '#69462F',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  statusLabel: { fontSize: 12.5, color: '#8A847C', fontWeight: '600' },
  statusTitle: { fontSize: 21, fontWeight: '800', marginTop: 2 },
  hpPercent: { fontSize: 20, fontWeight: '800' },
  hpTrack: {
    height: 12,
    backgroundColor: '#EFECE6',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 18,
  },
  hpFill: { height: '100%', borderRadius: 99 },
  waterButton: {
    backgroundColor: '#3B7A52',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  waterButtonDisabled: { backgroundColor: '#EFECE6' },
  waterButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  waterButtonTextDisabled: { color: '#9A948C' },
});