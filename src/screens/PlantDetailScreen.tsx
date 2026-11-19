import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { useDayNightCycle } from '../hooks/useDayNightCycle';

interface PlantDetailScreenProps {
  plantId: string;
  onBack: () => void;
}

export const PlantDetailScreen: React.FC<PlantDetailScreenProps> = ({
  plantId,
  onBack,
}) => {
  const plant = usePlantStore((state) =>
    state.plants.find((p) => p.id === plantId)
  );
  const waterPlant = usePlantStore((state) => state.waterPlant);

  const { isNight, toggleDayNight } = useDayNightCycle();
  const [isWatering, setIsWatering] = useState(false);

  // Animações
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const rainAnim = useRef(new Animated.Value(0)).current;
  const starTwinkleAnim = useRef(new Animated.Value(0.35)).current;

  // Cintilação contínua das estrelas quando estiver de noite
  useEffect(() => {
    if (!isNight) return;
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(starTwinkleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(starTwinkleAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    twinkle.start();
    return () => twinkle.stop();
  }, [isNight, starTwinkleAnim]);

  if (!plant) {
    return (
      <View style={styles.emptyFallback}>
        <Text style={styles.emptyText}>Planta não encontrada.</Text>
        <TouchableOpacity onPress={onBack} style={styles.fallbackBtn}>
          <Text style={styles.fallbackBtnText}>Voltar para a Estufa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLowHp = plant.hp <= 50;
  const isCriticalHp = plant.hp <= 30;
  const hpPercentage = Math.round((plant.hp / plant.maxHp) * 100);
  const hpBarColor = isCriticalHp ? '#C86B5E' : '#5C7C68';

  const handleWaterAction = () => {
    if (plant.hp >= plant.maxHp || isWatering) return;

    setIsWatering(true);
    rainAnim.setValue(0);

    Animated.timing(rainAnim, {
      toValue: 1,
      duration: 1300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      waterPlant(plant.id);
      setIsWatering(false);

      // Pulo alegre (spring bounce) ao absorver água
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.09,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1250);
  };

  // Posição das gotas de água caindo
  const dropTranslateY = rainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 155],
  });

  const dropOpacity = rainAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isNight ? '#1A2234' : '#F4EBD8' },
      ]}
    >
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.iconCircleBtn,
            isNight && styles.iconCircleBtnNight,
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isNight ? '#F8FAFC' : '#2C4A3B'}
          />
        </TouchableOpacity>

        {/* Botão de alternância rápida Dia / Noite */}
        <TouchableOpacity
          onPress={toggleDayNight}
          style={[
            styles.dayNightPill,
            isNight ? styles.dayNightPillNight : styles.dayNightPillDay,
          ]}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isNight ? 'moon' : 'sunny'}
            size={15}
            color={isNight ? '#FDE68A' : '#D97706'}
          />
          <Text
            style={[
              styles.dayNightText,
              { color: isNight ? '#FDE68A' : '#78350F' },
            ]}
          >
            {isNight ? 'Noite' : 'Dia'}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text
            style={[
              styles.plantTitle,
              { color: isNight ? '#F8FAFC' : '#2C4A3B' },
            ]}
          >
            {plant.name}
          </Text>
          <Text
            style={[
              styles.plantSpecies,
              { color: isNight ? '#94A3B8' : '#78716C' },
            ]}
          >
            {plant.species}
          </Text>
        </View>
      </View>

      {/* Palco Central: Janela Ghibli + Planta + Prateleira */}
      <View style={styles.stageContainer}>
        {/* JANELA EM ARCO (Dinâmica Dia / Noite) */}
        <View
          style={[
            styles.windowArch,
            isNight ? styles.windowArchNight : styles.windowArchDay,
          ]}
        >
          {isNight ? (
            <>
              {/* Lua Crescente Dourada */}
              <View style={styles.moonGlow} />
              <View style={styles.moonContainer}>
                <Ionicons name="moon" size={44} color="#FDE68A" />
              </View>

              {/* Estrelas Cintilantes */}
              <Animated.View
                style={[
                  styles.starDot,
                  { top: 44, left: 54, opacity: starTwinkleAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.starDotLarge,
                  { top: 82, left: 42, opacity: starTwinkleAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.starDot,
                  { top: 112, right: 56, opacity: starTwinkleAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.starDot,
                  { top: 38, right: 98, opacity: starTwinkleAnim },
                ]}
              />
            </>
          ) : (
            <>
              {/* Brilho Solar + Nuvens Suaves de Dia */}
              <View style={styles.sunGlow} />
              <View style={[styles.cloudShape, { top: 56, right: 34 }]} />
              <View
                style={[
                  styles.cloudShape,
                  { top: 96, left: 28, width: 62, height: 20 },
                ]}
              />
            </>
          )}

          {/* Travessas da Janela (Cruz estilo Ghibli) */}
          <View
            style={[
              styles.windowHorizontalBar,
              isNight && styles.windowBarNight,
            ]}
          />
          <View
            style={[
              styles.windowVerticalBar,
              isNight && styles.windowBarNight,
            ]}
          />
        </View>

        {/* Planta Ilustrada sobre a Prateleira */}
        <Animated.View
          style={[
            styles.plantWrapper,
            { transform: [{ scale: bounceAnim }] },
          ]}
        >
          {/* Chuva de gotículas ao regar */}
          {isWatering && (
            <View style={styles.rainContainer} pointerEvents="none">
              {[0, 1, 2, 3, 4].map((idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.waterDrop,
                    {
                      marginTop: (idx % 2) * 14,
                      opacity: dropOpacity,
                      transform: [{ translateY: dropTranslateY }],
                    },
                  ]}
                />
              ))}
            </View>
          )}

          <PlantIllustration
            plantID={plant.id}
            species={plant.species}
            isLowHp={isLowHp}
            size="large"
          />
        </Animated.View>

        {/* Prateleira de Madeira Rústica */}
        <View
          style={[
            styles.woodenShelf,
            isNight && styles.woodenShelfNight,
          ]}
        >
          <View
            style={[
              styles.shelfBracket,
              { left: 36 },
              isNight && styles.shelfBracketNight,
            ]}
          />
          <View
            style={[
              styles.shelfBracket,
              { right: 36 },
              isNight && styles.shelfBracketNight,
            ]}
          />
        </View>
      </View>

      {/* Painel Inferior de Status e Rega */}
      <View style={styles.bottomSheet}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusOverline}>Estado da Planta</Text>
            <Text
              style={[
                styles.statusTitle,
                { color: isLowHp ? '#C86B5E' : '#5C7C68' },
              ]}
            >
              {isLowHp ? 'Precisando de água...' : 'Radiante e hidratada!'}
            </Text>
          </View>
          <Text
            style={[
              styles.hpPercentText,
              { color: isLowHp ? '#C86B5E' : '#2C4A3B' },
            ]}
          >
            {hpPercentage}%
          </Text>
        </View>

        {/* Barra de Progresso de HP */}
        <View style={styles.hpTrack}>
          <View
            style={[
              styles.hpFill,
              { width: `${hpPercentage}%`, backgroundColor: hpBarColor },
            ]}
          />
        </View>

        {/* Botão Principal de Regar */}
        <TouchableOpacity
          onPress={handleWaterAction}
          disabled={plant.hp >= plant.maxHp || isWatering}
          activeOpacity={0.85}
          style={[
            styles.waterBtn,
            plant.hp >= plant.maxHp && styles.waterBtnDisabled,
          ]}
        >
          <Ionicons
            name="water"
            size={22}
            color={plant.hp >= plant.maxHp ? '#A8A29E' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.waterBtnText,
              plant.hp >= plant.maxHp && styles.waterBtnTextDisabled,
            ]}
          >
            {plant.hp >= plant.maxHp
              ? 'Planta Hidratada'
              : isWatering
              ? 'Regando...'
              : 'Regar Planta (+10 XP)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircleBtnNight: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
  dayNightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  dayNightPillDay: {
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
  },
  dayNightPillNight: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.25)',
  },
  dayNightText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitleBox: {
    alignItems: 'flex-end',
  },
  plantTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  plantSpecies: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  stageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 38,
    position: 'relative',
  },
  windowArch: {
    position: 'absolute',
    top: 12,
    width: 268,
    height: 300,
    borderTopLeftRadius: 134,
    borderTopRightRadius: 134,
    borderWidth: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowArchDay: {
    backgroundColor: '#DCEEFB',
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  windowArchNight: {
    backgroundColor: '#0B1120',
    borderColor: '#334155',
  },
  sunGlow: {
    position: 'absolute',
    top: 24,
    left: 28,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(254, 240, 138, 0.85)',
  },
  cloudShape: {
    position: 'absolute',
    width: 76,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  moonContainer: {
    position: 'absolute',
    top: 32,
    right: 36,
  },
  moonGlow: {
    position: 'absolute',
    top: 18,
    right: 22,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(253, 230, 138, 0.16)',
  },
  starDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  starDotLarge: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FEF08A',
  },
  windowHorizontalBar: {
    position: 'absolute',
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    top: '52%',
  },
  windowVerticalBar: {
    position: 'absolute',
    height: '100%',
    width: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    left: '48%',
  },
  windowBarNight: {
    backgroundColor: '#334155',
  },
  plantWrapper: {
    zIndex: 10,
    marginBottom: -34,
    alignItems: 'center',
  },
  rainContainer: {
    position: 'absolute',
    top: -12,
    width: 160,
    height: 170,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 30,
  },
  waterDrop: {
    width: 7,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  woodenShelf: {
    width: '86%',
    height: 22,
    backgroundColor: '#9C7051',
    borderRadius: 6,
    borderTopWidth: 3,
    borderTopColor: '#B88968',
    shadowColor: '#3E2412',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  woodenShelfNight: {
    backgroundColor: '#5C402E',
    borderTopColor: '#75533D',
  },
  shelfBracket: {
    position: 'absolute',
    top: 22,
    width: 14,
    height: 44,
    backgroundColor: '#7A553B',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  shelfBracketNight: {
    backgroundColor: '#422D20',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  statusOverline: {
    fontSize: 13,
    color: '#A8A29E',
    fontWeight: '600',
    marginBottom: 2,
  },
  statusTitle: {
    fontSize: 21,
    fontWeight: '700',
  },
  hpPercentText: {
    fontSize: 20,
    fontWeight: '700',
  },
  hpTrack: {
    height: 12,
    width: '100%',
    backgroundColor: '#F5F5F4',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 22,
  },
  hpFill: {
    height: '100%',
    borderRadius: 999,
  },
  waterBtn: {
    backgroundColor: '#5C7C68',
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#5C7C68',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  waterBtnDisabled: {
    backgroundColor: '#F5F5F4',
    shadowOpacity: 0,
    elevation: 0,
  },
  waterBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  waterBtnTextDisabled: {
    color: '#A8A29E',
  },
  emptyFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF9',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#57534E',
    marginBottom: 16,
  },
  fallbackBtn: {
    backgroundColor: '#5C7C68',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PlantDetailScreen;