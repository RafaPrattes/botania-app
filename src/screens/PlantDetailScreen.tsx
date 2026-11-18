import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';

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

  const [isWatering, setIsWatering] = useState(false);
  const dropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWatering) {
      dropAnim.setValue(0);
      Animated.loop(
        Animated.timing(dropAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        { iterations: 2 }
      ).start();
    }
  }, [isWatering, dropAnim]);

  if (!plant) return null;

  const isLowHp = plant.hp <= 50;
  const isDangerHp = plant.hp <= 30;
  const isFullHp = plant.hp >= plant.maxHp;
  const hpColor = isDangerHp ? '#C86B5E' : '#5C7C68';

  const handleWaterAction = () => {
    if (isFullHp || isWatering) return;
    setIsWatering(true);
    setTimeout(() => {
      waterPlant(plant.id);
      setIsWatering(false);
    }, 1500);
  };

  const translateY = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 110],
  });

  const opacity = dropAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header Detalhe */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color="#44403C" />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={styles.plantSpecies}>{plant.species}</Text>
        </View>
      </View>

      {/* Área Visual da Prateleira Ghibli */}
      <View style={styles.shelfArea}>
        {/* Janela Ensolarada ao Fundo */}
        <View style={styles.windowFrame}>
          <View style={styles.sunGlow} />
          <View style={styles.windowCrossHorizontal} />
          <View style={styles.windowCrossVertical} />
        </View>

        {/* Ilustração da Planta Grande + Animação de Chuvinha */}
        <View style={styles.plantWrapper}>
          {isWatering && (
            <Animated.View
              style={[
                styles.rainContainer,
                {
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={styles.waterDrop} />
              <View style={[styles.waterDrop, styles.waterDropOffset]} />
              <View style={styles.waterDrop} />
              <View style={[styles.waterDrop, styles.waterDropOffset]} />
              <View style={styles.waterDrop} />
            </Animated.View>
          )}

          <PlantIllustration
            plantId={plant.id}
            isLowHp={isLowHp}
            size="large"
          />
        </View>

        {/* Prateleira de Madeira Rústica */}
        <View style={styles.woodShelf}>
          <View style={styles.shelfBracketLeft} />
          <View style={styles.shelfBracketRight} />
        </View>
      </View>

      {/* Painel Inferior de Controle */}
      <View style={styles.bottomSheet}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>Status da Planta</Text>
            <Text
              style={[
                styles.statusTitle,
                { color: isLowHp ? '#C86B5E' : '#5C7C68' },
              ]}
            >
              {isLowHp ? 'Precisando de água...' : 'Cheia de vida!'}
            </Text>
          </View>
          <Text
            style={[
              styles.hpPercentage,
              { color: isLowHp ? '#C86B5E' : '#2C4A3B' },
            ]}
          >
            {plant.hp}%
          </Text>
        </View>

        <View style={styles.hpBarBackground}>
          <View
            style={[
              styles.hpBarFill,
              {
                width: `${(plant.hp / plant.maxHp) * 100}%`,
                backgroundColor: hpColor,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.waterActionButton,
            (isFullHp || isWatering) && styles.waterActionButtonDisabled,
          ]}
          disabled={isFullHp || isWatering}
          onPress={handleWaterAction}
          activeOpacity={0.85}
        >
          <Ionicons
            name="water"
            size={22}
            color={isFullHp ? '#A8A29E' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.waterActionText,
              isFullHp && styles.waterActionTextDisabled,
            ]}
          >
            {isFullHp
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
    backgroundColor: '#F4EBD8',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    alignItems: 'flex-end',
  },
  plantName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C4A3B',
  },
  plantSpecies: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#78716C',
  },
  shelfArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 46,
    position: 'relative',
  },
  windowFrame: {
    position: 'absolute',
    top: 10,
    width: 260,
    height: 290,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(224, 242, 254, 0.35)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: 'rgba(254, 243, 199, 0.85)',
  },
  windowCrossHorizontal: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  windowCrossVertical: {
    position: 'absolute',
    width: 10,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  plantWrapper: {
    zIndex: 10,
    alignItems: 'center',
    marginBottom: -28,
  },
  rainContainer: {
    position: 'absolute',
    top: -10,
    width: 160,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 30,
  },
  waterDrop: {
    width: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  waterDropOffset: {
    marginTop: 18,
    backgroundColor: '#7DD3FC',
  },
  woodShelf: {
    width: '86%',
    height: 22,
    backgroundColor: '#9C7051',
    borderRadius: 6,
    borderTopWidth: 3,
    borderTopColor: '#B38666',
    zIndex: 1,
    position: 'relative',
  },
  shelfBracketLeft: {
    position: 'absolute',
    top: 19,
    left: 36,
    width: 14,
    height: 48,
    backgroundColor: '#7A553B',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  shelfBracketRight: {
    position: 'absolute',
    top: 19,
    right: 36,
    width: 14,
    height: 48,
    backgroundColor: '#7A553B',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 13,
    color: '#A8A29E',
    fontWeight: '500',
    marginBottom: 2,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  hpPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  hpBarBackground: {
    height: 14,
    width: '100%',
    backgroundColor: '#F5F5F4',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 24,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  waterActionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#5C7C68',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  waterActionButtonDisabled: {
    backgroundColor: '#F5F5F4',
  },
  waterActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waterActionTextDisabled: {
    color: '#A8A29E',
  },
});

export default PlantDetailScreen;
