import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePlantStore } from '../store/usePlantStore';
import { identifyPlantFromPhoto } from '../services/geminiService';

const PRESET_PLANTS = [
  { name: 'Jiboia', species: 'Epipremnum aureum', icon: '🌿' },
  { name: 'Suculenta', species: 'Echeveria elegans', icon: '🪴' },
  { name: 'Kalanchoe', species: 'Kalanchoe blossfeldiana', icon: '🌸' },
  { name: 'Espada-de-São-Jorge', species: 'Dracaena trifasciata', icon: '🗡️' },
  { name: 'Zamioculca', species: 'Zamioculcas zamiifolia', icon: '🌱' },
];

const LOCATIONS = ['Sala', 'Quarto', 'Varanda', 'Cozinha', 'Home Office'];

export const OnboardingScreen: React.FC = () => {
  const completeOnboarding = usePlantStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSpecies, setSelectedSpecies] = useState<
    Array<{ name: string; species: string }>
  >([{ name: 'Jiboia', species: 'Epipremnum aureum' }]);
  const [selectedLocation, setSelectedLocation] = useState('Sala');

  // Estados para identificação via IA
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [aiPreviewUri, setAiPreviewUri] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const togglePreset = (item: { name: string; species: string }) => {
    const exists = selectedSpecies.some((p) => p.name === item.name);
    if (exists) {
      setSelectedSpecies((prev) => prev.filter((p) => p.name !== item.name));
    } else {
      setSelectedSpecies((prev) => [...prev, item]);
    }
  };

  const handleIdentifyUnknownPlant = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    setAiPreviewUri(result.assets[0].uri);
    setIsIdentifying(true);
    setAiTip(null);

    const identified = await identifyPlantFromPhoto(result.assets[0].base64);

    setSelectedSpecies((prev) => [
      ...prev,
      { name: identified.name, species: identified.species },
    ]);
    setAiTip(`${identified.name} (${identified.species}): ${identified.careTip}`);
    setIsIdentifying(false);
  };

  const handleFinish = () => {
    const payload = selectedSpecies.map((p) => ({
      name: `${p.name} (${selectedLocation})`,
      species: p.species,
      location: selectedLocation,
    }));
    completeOnboarding(payload);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Passo {step} de 2 • Bem-vindo (a) ao BotanIA</Text>
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.title}>Quais plantinhas moram com você?</Text>
            <Text style={styles.subtitle}>
              Selecione abaixo ou envie uma foto se não souber o nome da espécie.
            </Text>

            <View style={styles.grid}>
              {PRESET_PLANTS.map((item) => {
                const active = selectedSpecies.some((p) => p.name === item.name);
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.choiceCard, active && styles.choiceCardActive]}
                    onPress={() => togglePreset(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.choiceEmoji}>{item.icon}</Text>
                    <View style={styles.choiceInfo}>
                      <Text style={styles.choiceName}>{item.name}</Text>
                      <Text style={styles.choiceSpecies}>{item.species}</Text>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={active ? '#5C7C68' : '#D6D3D1'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botão mágico de IA para planta desconhecida */}
            <TouchableOpacity
              style={styles.aiIdentifyBox}
              onPress={handleIdentifyUnknownPlant}
              activeOpacity={0.85}
            >
              <View style={styles.aiIdentifyHeader}>
                <Ionicons name="sparkles" size={20} color="#5C7C68" />
                <Text style={styles.aiIdentifyTitle}>
                  Não sei qual é a planta (Identificar com IA)
                </Text>
              </View>
              <Text style={styles.aiIdentifyDesc}>
                Envie uma foto e o Gemini descobre a espécie automaticamente.
              </Text>

              {isIdentifying && (
                <View style={styles.aiStatusRow}>
                  <ActivityIndicator size="small" color="#5C7C68" />
                  <Text style={styles.aiStatusText}>Analisando folhas...</Text>
                </View>
              )}

              {aiPreviewUri && aiTip && !isIdentifying && (
                <View style={styles.aiResultCard}>
                  <Image source={{ uri: aiPreviewUri }} style={styles.aiThumb} />
                  <Text style={styles.aiResultText}>{aiTip}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setStep(2)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Onde elas ficam na casa?</Text>
            <Text style={styles.subtitle}>
              Isso ajuda o BotanIA a estimar a luminosidade e a frequência ideal de rega.
            </Text>

            <View style={styles.locationList}>
              {LOCATIONS.map((loc) => {
                const active = selectedLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.locationChip,
                      active && styles.locationChipActive,
                    ]}
                    onPress={() => setSelectedLocation(loc)}
                  >
                    <Ionicons
                      name="home-outline"
                      size={18}
                      color={active ? '#FFFFFF' : '#57534E'}
                    />
                    <Text
                      style={[
                        styles.locationText,
                        active && styles.locationTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryBtnText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                onPress={handleFinish}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Montar Minha Estufa (+50 XP)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(92, 124, 104, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#5C7C68' },
  title: { fontSize: 26, fontWeight: '700', color: '#2C4A3B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#78716C', lineHeight: 20, marginBottom: 24 },
  grid: { gap: 12, marginBottom: 20 },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#F5F5F4',
  },
  choiceCardActive: { borderColor: '#5C7C68', backgroundColor: '#F6FAF7' },
  choiceEmoji: { fontSize: 24 },
  choiceInfo: { flex: 1 },
  choiceName: { fontSize: 16, fontWeight: '700', color: '#2C4A3B' },
  choiceSpecies: { fontSize: 12, fontStyle: 'italic', color: '#A8A29E' },
  aiIdentifyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#5C7C68',
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
  },
  aiIdentifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  aiIdentifyTitle: { fontSize: 14, fontWeight: '700', color: '#2C4A3B' },
  aiIdentifyDesc: { fontSize: 12, color: '#78716C' },
  aiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  aiStatusText: { fontSize: 12, color: '#5C7C68', fontWeight: '600' },
  aiResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: '#F5F5F4',
    padding: 10,
    borderRadius: 14,
  },
  aiThumb: { width: 44, height: 44, borderRadius: 10 },
  aiResultText: { flex: 1, fontSize: 12, color: '#2C4A3B', lineHeight: 17 },
  locationList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 36 },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  locationChipActive: { backgroundColor: '#5C7C68', borderColor: '#5C7C68' },
  locationText: { fontSize: 14, fontWeight: '600', color: '#57534E' },
  locationTextActive: { color: '#FFFFFF' },
  footerRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    backgroundColor: '#5C7C68',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#E7E5E4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#44403C', fontSize: 15, fontWeight: '600' },
});

export default OnboardingScreen;
