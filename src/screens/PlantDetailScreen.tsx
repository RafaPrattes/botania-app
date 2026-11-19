import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Ellipse, Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { useDayNightCycle } from '../hooks/useDayNightCycle';
import { ScreenTutorialPopup } from '../components/ScreenTutorialPopup';

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
  const plants = usePlantStore((s) => s.plants);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const seenTutorials = usePlantStore((s) => s.seenTutorials);
  const dismissTutorial = usePlantStore((s) => s.dismissTutorial);

  const currentIndex = plants.findIndex((p) => p.id === plantId);
  const plant = plants[currentIndex] || plants[0];

  const [isWatering, setIsWatering] = useState(false);
  const { isNight } = useDayNightCycle();

  const goPrevPlant = () => {
    if (plants.length <= 1) return;
    const prevIdx = (currentIndex - 1 + plants.length) % plants.length;
    onSelectPlant(plants[prevIdx].id);
  };

  const goNextPlant = () => {
    if (plants.length <= 1) return;
    const nextIdx = (currentIndex + 1) % plants.length;
    onSelectPlant(plants[nextIdx].id);
  };

  // Gesto de deslizar horizontalmente para passar para a próxima planta
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 25 && Math.abs(gesture.dy) < 25,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -45) {
          goNextPlant();
        } else if (gesture.dx > 45) {
          goPrevPlant();
        }
      },
    })
  ).current;

  if (!plant) return null;

  const isLowHp = plant.hp <= 45;
  const isFull = plant.hp === plant.maxHp;

  const handleWater = () => {
    if (isFull || isWatering) return;
    setIsWatering(true);
    setTimeout(() => {
      waterPlant(plant.id);
      setIsWatering(false);
    }, 1100);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isNight ? '#1E2D38' : '#EFE7D6' },
      ]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#244233" />
        </TouchableOpacity>

        <View style={styles.titleCenter}>
          <Text
            style={[
              styles.plantTitle,
              { color: isNight ? '#F4EFE6' : '#244233' },
            ]}
            numberOfLines={1}
          >
            {plant.name}
          </Text>
          <Text
            style={[
              styles.plantSubtitle,
              { color: isNight ? '#B8CBD9' : '#6A655C' },
            ]}
          >
            {plant.species} • {isNight ? 'Noite' : 'Dia'}
          </Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {currentIndex + 1}/{plants.length}
          </Text>
        </View>
      </View>

      {/* Cena Cozy Ghibli com Suporte a Deslizar */}
      <View style={styles.sceneArea} {...panResponder.panHandlers}>
        {/* Janela Ghibli com Sombra de Folhas e Sol/Lua */}
        <View
          style={[
            styles.windowArch,
            {
              backgroundColor: isNight ? '#15222E' : '#DCEEF2',
              borderColor: isNight ? '#354A5C' : '#FAF6EE',
            },
          ]}
        >
          {isNight ? (
            <>
              <View style={styles.moon} />
              <View style={[styles.star, { top: 45, left: 60 }]} />
              <View style={[styles.star, { top: 80, right: 55 }]} />
              <View style={[styles.star, { top: 115, left: 95 }]} />
            </>
          ) : (
            <>
              <View style={styles.sunGlow} />
              {/* Sombra suave de folhagem na parede (inspirado na referência) */}
              <View style={styles.leafShadow1} />
              <View style={styles.leafShadow2} />
            </>
          )}
          <View style={styles.windowCrossH} />
          <View style={styles.windowCrossV} />
        </View>

        {/* Setas laterais discretas para navegar entre plantas */}
        {plants.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.sideArrow, { left: 12 }]}
              onPress={goPrevPlant}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={22} color="#244233" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sideArrow, { right: 12 }]}
              onPress={goNextPlant}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-forward" size={22} color="#244233" />
            </TouchableOpacity>
          </>
        )}

        {/* Elementos Cozy na Prateleira + Planta */}
        <View style={styles.shelfObjectsRow}>
          {/* Livros antigos empilhados na esquerda (como na imagem 1) */}
          <Svg width={56} height={95} viewBox="0 0 60 100" style={{ marginBottom: -4 }}>
            <Rect x="4" y="18" width="14" height="82" rx="2" fill="#4D7868" />
            <Rect x="6" y="28" width="10" height="3" fill="#E8D2A6" />
            <Rect x="19" y="10" width="15" height="90" rx="2" fill="#C96A4B" />
            <Rect x="21" y="22" width="11" height="3" fill="#F5E6C8" />
            <Rect x="35" y="24" width="14" height="76" rx="2" fill="#D99B52" />
            <Rect x="37" y="34" width="10" height="3" fill="#FFF5E0" />
          </Svg>

          {/* Planta Principal */}
          <View style={{ marginBottom: -14, zIndex: 5 }}>
            {isWatering && (
              <View style={styles.wateringBanner}>
                <Ionicons name="water" size={18} color="#3B9AE1" />
                <Text style={styles.wateringLabel}>Regando com carinho...</Text>
              </View>
            )}
            <PlantIllustration
              category={plant.category}
              species={plant.species}
              isLowHp={isLowHp}
              size="large"
            />
          </View>

          {/* Saquinho de Terra + Pazinha de Jardinagem na direita (como na imagem 4) */}
          <Svg width={68} height={85} viewBox="0 0 80 95" style={{ marginBottom: -4 }}>
            {/* Saquinho de estopa com terra */}
            <Path
              d="M12 45 C10 65, 10 88, 18 92 L52 92 C60 88, 60 65, 58 45 Q35 52, 12 45 Z"
              fill="#C7A67B"
              stroke="#8C6D46"
              strokeWidth="2"
            />
            <Ellipse cx="35" cy="45" rx="22" ry="7" fill="#4E3524" />
            {/* Pazinha de jardinagem apoiada */}
            <G transform="translate(56, 38) rotate(22)">
              <Rect x="-3" y="0" width="6" height="22" rx="3" fill="#B87344" />
              <Path d="M-8 22 L8 22 L6 44 C5 49, -5 49, -6 44 Z" fill="#9AA5AD" stroke="#646E75" strokeWidth="1.5" />
            </G>
          </Svg>
        </View>

        {/* Prateleira de Madeira Rústica */}
        <View style={styles.woodShelf}>
          <View style={styles.shelfGrain} />
          <View style={[styles.shelfBracket, { left: 36 }]} />
          <View style={[styles.shelfBracket, { right: 36 }]} />
        </View>
      </View>

      {/* Painel Inferior de Cuidados */}
      <View style={styles.bottomCard}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusCaption}>Saúde da Planta</Text>
            <Text
              style={[
                styles.statusTitle,
                { color: isLowHp ? '#C85A43' : '#2E7D47' },
              ]}
            >
              {isLowHp ? 'Precisando de água...' : 'Viçosa e feliz!'}
            </Text>
          </View>
          <Text style={styles.hpBig}>{plant.hp}%</Text>
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
          style={[styles.waterBtn, isFull && styles.waterBtnDone]}
          onPress={handleWater}
          disabled={isFull || isWatering}
          activeOpacity={0.85}
        >
          <Ionicons
            name="water"
            size={21}
            color={isFull ? '#9A948C' : '#FFFFFF'}
          />
          <Text
            style={[styles.waterBtnText, isFull && styles.waterBtnTextDone]}
          >
            {isFull
              ? 'Planta Hidratada'
              : isWatering
              ? 'Regando...'
              : 'Regar Planta (+10 XP)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tutorial Único de Primeiro Acesso na Prateleira */}
      <ScreenTutorialPopup
        visible={!seenTutorials.detail}
        heading="Sua Prateleira Botânica 🪴"
        onDismiss={() => dismissTutorial('detail')}
        steps={[
          {
            icon: 'swap-horizontal',
            title: 'Deslize para o lado',
            description:
              'Arraste a tela para a esquerda ou direita (ou use as setas) para alternar entre suas plantas.',
          },
          {
            icon: 'water',
            title: 'Regue e ganhe XP',
            description:
              'Quando as folhas começarem a murchar, toque em Regar para restaurar 100% da saúde.',
          },
          {
            icon: 'moon',
            title: 'Janela viva',
            description:
              'A iluminação da janela acompanha o horário real do seu dia (Sol de dia, Lua à noite).',
          },
        ]}
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
    zIndex: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  plantTitle: { fontSize: 19, fontWeight: '800' },
  plantSubtitle: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterText: { fontSize: 12, fontWeight: '800', color: '#244233' },
  sceneArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  windowArch: {
    position: 'absolute',
    top: 10,
    width: 255,
    height: 290,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    borderWidth: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    top: 26,
    left: 28,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 241, 184, 0.85)',
  },
  leafShadow1: {
    position: 'absolute',
    top: 14,
    right: -10,
    width: 90,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(92, 134, 118, 0.16)',
    transform: [{ rotate: '-25deg' }],
  },
  leafShadow2: {
    position: 'absolute',
    top: 52,
    right: 10,
    width: 75,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(92, 134, 118, 0.12)',
    transform: [{ rotate: '-15deg' }],
  },
  moon: {
    position: 'absolute',
    top: 32,
    right: 36,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3C4',
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  windowCrossH: {
    position: 'absolute',
    width: '100%',
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.45)',
    top: '48%',
  },
  windowCrossV: {
    position: 'absolute',
    height: '100%',
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  sideArrow: {
    position: 'absolute',
    top: '46%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shelfObjectsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 10,
  },
  wateringBanner: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    zIndex: 20,
  },
  wateringLabel: { fontSize: 12, fontWeight: '700', color: '#1E6B9E' },
  woodShelf: {
    width: '88%',
    height: 22,
    backgroundColor: '#9C6B43',
    borderRadius: 6,
    borderTopWidth: 3,
    borderTopColor: '#BA8559',
    shadowColor: '#3B2310',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  shelfGrain: {
    marginTop: 7,
    marginHorizontal: 24,
    height: 2,
    backgroundColor: 'rgba(72, 43, 20, 0.25)',
    borderRadius: 2,
  },
  shelfBracket: {
    position: 'absolute',
    top: 22,
    width: 14,
    height: 24,
    backgroundColor: '#754C2B',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 24,
    paddingBottom: 30,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  statusCaption: { fontSize: 12.5, color: '#7D786F', fontWeight: '600' },
  statusTitle: { fontSize: 21, fontWeight: '800', marginTop: 2 },
  hpBig: { fontSize: 20, fontWeight: '800', color: '#244233' },
  hpTrack: {
    height: 11,
    backgroundColor: '#EFECE6',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 18,
  },
  hpFill: { height: '100%', borderRadius: 99 },
  waterBtn: {
    backgroundColor: '#4E9463',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waterBtnDone: { backgroundColor: '#EFECE6' },
  waterBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  waterBtnTextDone: { color: '#9A948C' },
});