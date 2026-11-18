import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlantStore,
  selectCurrentLevel,
  selectXpProgress,
  Plant,
} from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';

interface HomeScreenProps {
  onSelectPlant: (plantId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectPlant }) => {
  const plants = usePlantStore((state) => state.plants);
  const waterPlant = usePlantStore((state) => state.waterPlant);
  const simulateDay = usePlantStore((state) => state.simulateDay);
  const currentLevel = usePlantStore(selectCurrentLevel);
  const xpProgress = usePlantStore(selectXpProgress);

  return (
    <View style={styles.container}>
      {/* Header / Perfil do Jardineiro */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>A Estufa</Text>
            <Text style={styles.subtitle}>
              Jardineiro Iniciante • Lvl {currentLevel}
            </Text>
          </View>
          <View style={styles.leafBadge}>
            <Ionicons name="leaf-outline" size={24} color="#5C7C68" />
          </View>
        </View>

        {/* Botão para simular passagem de 1 dia (-20 HP) */}
        <TouchableOpacity
          style={styles.simulateButton}
          onPress={simulateDay}
          activeOpacity={0.7}
        >
          <Text style={styles.simulateButtonText}>
            Simular 1 Dia (-20 HP em todas)
          </Text>
        </TouchableOpacity>

        {/* Barra de Progresso de XP */}
        <View style={styles.xpRow}>
          <View style={styles.xpBarBackground}>
            <View
              style={[styles.xpBarFill, { width: `${xpProgress}%` }]}
            />
          </View>
          <Text style={styles.xpText}>{xpProgress}/100 XP</Text>
        </View>
      </View>

      {/* Lista de Plantas */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {plants.map((plant: Plant) => {
          const isDangerHp = plant.hp <= 30;
          const isLowHp = plant.hp <= 50;
          const isFullHp = plant.hp >= plant.maxHp;
          const hpColor = isDangerHp ? '#C86B5E' : '#5C7C68';

          return (
            <TouchableOpacity
              key={plant.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onSelectPlant(plant.id)}
            >
              {/* Topo do Card: Ilustração Miniatura + Nome + Badge de HP */}
              <View style={styles.cardHeader}>
                <View style={styles.cardPlantInfo}>
                  <View style={styles.avatarBox}>
                    <PlantIllustration
                      plantId={plant.id}
                      isLowHp={isLowHp}
                      size="small"
                    />
                  </View>
                  <View>
                    <Text style={styles.plantName}>{plant.name}</Text>
                    <Text style={styles.plantSpecies}>{plant.species}</Text>
                  </View>
                </View>

                <View style={styles.hpBadge}>
                  <Text style={[styles.hpBadgeText, { color: hpColor }]}>
                    {plant.hp}%
                  </Text>
                </View>
              </View>

              {/* Barra de HP da Planta */}
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

              {/* Botão de Rega Rápida */}
              <TouchableOpacity
                style={[
                  styles.waterButton,
                  isFullHp && styles.waterButtonDisabled,
                ]}
                disabled={isFullHp}
                onPress={() => waterPlant(plant.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="water-outline"
                  size={18}
                  color={isFullHp ? '#A8A29E' : '#5C7C68'}
                />
                <Text
                  style={[
                    styles.waterButtonText,
                    isFullHp && styles.waterButtonTextDisabled,
                  ]}
                >
                  {isFullHp ? 'Hidratada' : 'Regar (+10 XP)'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFaf9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C4A3B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
  },
  leafBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulateButton: {
    backgroundColor: '#F5F5F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 18,
  },
  simulateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F5F5F4',
    borderRadius: 999,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#5C7C68',
    borderRadius: 999,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C7C68',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 110,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardPlantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    backgroundColor: 'rgba(244, 235, 216, 0.65)',
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C4A3B',
  },
  plantSpecies: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#A8A29E',
    marginTop: 2,
  },
  hpBadge: {
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  hpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hpBarBackground: {
    height: 10,
    width: '100%',
    backgroundColor: '#F5F5F4',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 16,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  waterButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(92, 124, 104, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waterButtonDisabled: {
    backgroundColor: '#F5F5F4',
  },
  waterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C7C68',
  },
  waterButtonTextDisabled: {
    color: '#A8A29E',
  },
});

export default HomeScreen;