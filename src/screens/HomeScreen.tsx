import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlantStore,
  selectCurrentLevel,
  selectXpProgress,
} from '../store/usePlantStore';
import { PlantIllustration } from '../components/PlantIllustration';
import { PALETTES, TRANSLATIONS } from '../theme/theme';
import { getNextWateringLabel } from '../utils/wateringSchedule';

interface HomeScreenProps {
  onSelectPlant: (id: string) => void;
  onAddPlant: () => void;
  onOpenDrawer: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPlant,
  onAddPlant,
  onOpenDrawer,
  isMusicPlaying,
  onToggleMusic,
}) => {
  const plants = usePlantStore((s) => s.plants);
  const profile = usePlantStore((s) => s.profile);
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const simulateDay = usePlantStore((s) => s.simulateDay);
  const addPlantsBatch = usePlantStore((s) => s.addPlantsBatch);
  const currentLevel = usePlantStore(selectCurrentLevel);
  const xpProgress = usePlantStore(selectXpProgress);

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  const handleLoadSampleGreenhouse = () => {
    addPlantsBatch([
      {
        name: 'Jiboia da Janela',
        species: 'Epipremnum aureum',
        category: 'pendente',
        location: 'Sala de Estar',
      },
      {
        name: 'Echeveria Roseta',
        species: 'Echeveria elegans',
        category: 'suculenta',
        location: 'Escrivaninha',
      },
      {
        name: 'Ficus Bonsai',
        species: 'Ficus retusa',
        category: 'bonsai',
        location: 'Varanda',
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Banner Ilustrado Cozy da Estufa */}
      <ImageBackground
        source={require('../../assets/ghibli/greenhouse_bg.png')}
        style={styles.heroBanner}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          {/* Top bar minimalista: Perfil à esquerda, Áudio suave à direita */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={onOpenDrawer}
              style={styles.profilePill}
              activeOpacity={0.8}
            >
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={styles.avatarThumb}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="menu" size={18} color="#FAF7F0" />
                </View>
              )}
              <View>
                <Text style={styles.greetingSmall}>Estufa de</Text>
                <Text style={styles.greetingName} numberOfLines={1}>
                  {profile.name}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Botão de Lo-Fi discreto (vidro fosco, sem cores de ligação) */}
            <TouchableOpacity
              onPress={onToggleMusic}
              activeOpacity={0.8}
              style={[
                styles.musicPill,
                isMusicPlaying && styles.musicPillActive,
              ]}
            >
              <Ionicons
                name={isMusicPlaying ? 'musical-notes' : 'volume-mute-outline'}
                size={16}
                color={isMusicPlaying ? '#1E352B' : '#FAF7F0'}
              />
              <Text
                style={[
                  styles.musicText,
                  isMusicPlaying && styles.musicTextActive,
                ]}
              >
                {isMusicPlaying ? 'Lo-Fi' : 'Som'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Título + Progresso de Nível */}
          <View style={styles.heroBottom}>
            <View style={styles.titleRow}>
              <Text style={styles.heroTitle}>{t.greenhouse}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Nível {currentLevel}</Text>
              </View>
            </View>

            <View style={styles.xpRow}>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
              </View>
              <Text style={styles.xpLabel}>{xpProgress}/100 XP</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Barra de Ações Editoriais (separada do áudio) */}
      <View style={styles.actionsStrip}>
        <TouchableOpacity
          onPress={onAddPlant}
          activeOpacity={0.85}
          style={[
            styles.addPlantBtn,
            { backgroundColor: colors.mossDeep },
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={19}
            color={profile.darkMode ? '#131E19' : '#FAF7F0'}
          />
          <Text
            style={[
              styles.addPlantText,
              { color: profile.darkMode ? '#131E19' : '#FAF7F0' },
            ]}
          >
            Nova Planta
          </Text>
        </TouchableOpacity>

        {plants.length > 0 && (
          <TouchableOpacity
            onPress={simulateDay}
            activeOpacity={0.75}
            style={[
              styles.simBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="sunny-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.simText, { color: colors.textSecondary }]}>
              +1 dia
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Plantas ou Cartão de Boas-Vindas Vivo */}
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Ionicons
                name="leaf-outline"
                size={34}
                color={colors.mossPrimary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Sua estufa está pronta para florescer
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Adicione suas plantas reais buscando por espécie ou tirando uma
              foto, ou experimente com um jardim de exemplo.
            </Text>

            <TouchableOpacity
              onPress={onAddPlant}
              style={[
                styles.emptyPrimaryBtn,
                { backgroundColor: colors.mossPrimary },
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyPrimaryText}>
                Cadastrar minha primeira planta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLoadSampleGreenhouse}
              style={[
                styles.emptySecondaryBtn,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Text
                style={[
                  styles.emptySecondaryText,
                  { color: colors.textPrimary },
                ]}
              >
                Carregar estufa de exemplo (3 plantas)
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isLowHp = item.hp <= 40;
          const isHydrated = item.hp >= item.maxHp;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSelectPlant(item.id)}
              style={[
                styles.plantCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTopRow}>
                <PlantIllustration
                  category={item.category}
                  species={item.species}
                  imageUrl={item.imageUrl}
                  isLowHp={isLowHp}
                  size="small"
                />

                <View style={styles.plantInfo}>
                  <Text
                    style={[styles.plantName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.plantMeta,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.location} • {item.species}
                  </Text>
                  <View style={styles.scheduleRow}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={colors.mossMuted}
                    />
                    <Text
                      style={[
                        styles.scheduleText,
                        { color: colors.mossMuted },
                      ]}
                    >
                      Rega: {getNextWateringLabel(item.category, item.lastWateredAt)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.hpBadge,
                    {
                      backgroundColor: isLowHp
                        ? colors.terracottaSoft
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hpBadgeText,
                      {
                        color: isLowHp
                          ? colors.terracotta
                          : colors.mossPrimary,
                      },
                    ]}
                  >
                    {item.hp}%
                  </Text>
                </View>
              </View>

              {/* Barra de Hidratação */}
              <View
                style={[
                  styles.hpTrack,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <View
                  style={[
                    styles.hpFill,
                    {
                      width: `${item.hp}%`,
                      backgroundColor: isLowHp
                        ? colors.terracotta
                        : colors.mossPrimary,
                    },
                  ]}
                />
              </View>

              {/* Rodapé do Card */}
              <View style={styles.cardFooter}>
                <Text
                  style={[
                    styles.tapHint,
                    { color: colors.textSecondary },
                  ]}
                >
                  Toque para ver na prateleira
                </Text>

                <TouchableOpacity
                  onPress={() => waterPlant(item.id)}
                  disabled={isHydrated}
                  style={[
                    styles.quickWaterBtn,
                    {
                      backgroundColor: isHydrated
                        ? colors.surfaceAlt
                        : colors.mossPrimary,
                    },
                  ]}
                >
                  <Ionicons
                    name="water-outline"
                    size={14}
                    color={isHydrated ? colors.textSecondary : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.quickWaterText,
                      {
                        color: isHydrated ? colors.textSecondary : '#FFFFFF',
                      },
                    ]}
                  >
                    {isHydrated ? t.hydrated : 'Regar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBanner: {
    height: 196,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 26,
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: 26,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 34, 26, 0.44)',
    padding: 16,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20, 34, 26, 0.55)',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 24,
    maxWidth: '64%',
  },
  avatarThumb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#FAF7F0',
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSmall: {
    color: 'rgba(250,247,240,0.78)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  greetingName: {
    color: '#FAF7F0',
    fontSize: 13.5,
    fontWeight: '800',
  },
  musicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 34, 26, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(250, 247, 240, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  musicPillActive: {
    backgroundColor: '#EFE7D6',
    borderColor: '#EFE7D6',
  },
  musicText: {
    color: '#FAF7F0',
    fontSize: 12,
    fontWeight: '700',
  },
  musicTextActive: {
    color: '#1E352B',
  },
  heroBottom: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: '#FAF7F0',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  levelBadge: {
    backgroundColor: 'rgba(239, 231, 214, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#1E352B',
    fontSize: 11.5,
    fontWeight: '800',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#E8DFC8',
  },
  xpLabel: {
    color: '#FAF7F0',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  addPlantBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  addPlantText: {
    fontSize: 14,
    fontWeight: '700',
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  simText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  emptyPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySecondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptySecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  plantCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '800',
  },
  plantMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  scheduleText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  hpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  hpBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hpTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 13,
    marginBottom: 12,
  },
  hpFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapHint: {
    fontSize: 11.5,
  },
  quickWaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickWaterText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});