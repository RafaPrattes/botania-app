import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import {
  searchPlantSpecies,
  inferPlantArchetype,
  PlantCatalogOption,
  PlantArchetype,
} from '../services/plantSpeciesService';
import { PALETTES } from '../theme/theme';
import { ThemedModal } from '../components/ThemedModal';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const ROOM_OPTIONS = [
  'Sala de Estar',
  'Varanda',
  'Quarto',
  'Cozinha',
  'Escrivaninha',
];

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
}) => {
  const addPlantsBatch = usePlantStore((s) => s.addPlantsBatch);
  const profile = usePlantStore((s) => s.profile);
  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlantCatalogOption[]>([]);
  const [searching, setSearching] = useState(false);

  const [plantName, setPlantName] = useState('');
  const [species, setSpecies] = useState('');
  const [category, setCategory] = useState<PlantArchetype>('folhagem');
  const [location, setLocation] = useState('Sala de Estar');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [identifying, setIdentifying] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    tone: 'default' | 'danger' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    tone: 'default',
  });

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const list = await searchPlantSpecies(text);
    setResults(list);
    setSearching(false);
  };

  const selectSpeciesOption = (item: PlantCatalogOption) => {
    setPlantName(item.popularName);
    setSpecies(item.popularName);
    setCategory(item.category);
    if (item.imageUrl) setPhotoUri(item.imageUrl);
    setResults([]);
    setQuery(item.popularName);
  };

  const handlePhotoIdentify = async (fromCamera: boolean) => {
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const picked = await fn({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });

    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setPhotoUri(asset.uri);

    if (!GEMINI_KEY || !asset.base64) {
      setModalInfo({
        visible: true,
        title: 'Foto anexada à planta',
        message:
          'Sua foto já foi salva no cartão da planta. Para identificação automática por IA, confirme a chave EXPO_PUBLIC_GEMINI_API_KEY no arquivo .env.',
        tone: 'default',
      });
      return;
    }

    setIdentifying(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Identifique esta planta e responda APENAS em JSON válido neste formato: {"popularName":"Nome popular em português","scientificName":"Nome científico","category":"pendente|suculenta|cacto|bonsai|flor|folhagem"}. Se não houver planta clara na imagem, responda {"error":"not_a_plant"}.',
                  },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: asset.base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = rawText ? JSON.parse(rawText) : null;

      if (!parsed || parsed.error) {
        setModalInfo({
          visible: true,
          title: 'Não conseguimos identificar com certeza',
          message:
            'Tente uma foto mais iluminada da planta ou digite o nome dela no campo de busca abaixo.',
          tone: 'danger',
        });
      } else {
        setPlantName(parsed.popularName || '');
        setSpecies(parsed.scientificName || parsed.popularName || '');
        setCategory(
          parsed.category || inferPlantArchetype(parsed.popularName || '')
        );
      }
    } catch {
      setModalInfo({
        visible: true,
        title: 'Sem resposta da IA',
        message:
          'Sua foto foi salva! Você pode digitar o nome da espécie manualmente abaixo.',
        tone: 'danger',
      });
    } finally {
      setIdentifying(false);
    }
  };

  const handleSavePlant = () => {
    const finalName = plantName.trim() || query.trim();
    if (!finalName) {
      setModalInfo({
        visible: true,
        title: 'Qual é o nome da planta?',
        message:
          'Busque uma espécie, tire uma foto ou dê um apelido para adicionar à sua estufa.',
        tone: 'danger',
      });
      return;
    }

    const finalSpecies = species.trim() || finalName;
    addPlantsBatch([
      {
        name: finalName,
        species: finalSpecies,
        category: inferPlantArchetype(`${finalName} ${finalSpecies} ${category}`),
        location,
        imageUrl: photoUri,
      },
    ]);

    onFinish();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onFinish}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Nova Planta na Estufa
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Identificação por Foto */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Não sabe a espécie? Envie uma foto
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            A IA identifica a espécie e usa a foto no cartão da sua estufa.
          </Text>

          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          )}

          <View style={styles.photoBtnRow}>
            <TouchableOpacity
              onPress={() => handlePhotoIdentify(true)}
              style={[
                styles.photoBtn,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.mossPrimary}
              />
              <Text
                style={[styles.photoBtnText, { color: colors.textPrimary }]}
              >
                Câmera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePhotoIdentify(false)}
              style={[
                styles.photoBtn,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={colors.mossPrimary}
              />
              <Text
                style={[styles.photoBtnText, { color: colors.textPrimary }]}
              >
                Galeria
              </Text>
            </TouchableOpacity>
          </View>

          {identifying && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.mossPrimary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Identificando espécie pela foto...
              </Text>
            </View>
          )}
        </View>

        {/* Busca de Espécie Online */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Pesquisar espécie
          </Text>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Ex: Jiboia, Cacto, Bonsai, Orquídea..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={handleSearch}
            />
            {searching && (
              <ActivityIndicator size="small" color={colors.mossPrimary} />
            )}
          </View>

          {results.length > 0 && (
            <View style={styles.resultsList}>
              {results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => selectSpeciesOption(item)}
                  style={[
                    styles.resultItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.resultTitle, { color: colors.textPrimary }]}
                  >
                    {item.popularName}
                  </Text>
                  <Text
                    style={[styles.resultSub, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.scientificName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Apelido da planta
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.bg,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ex: Jiboia da Sala"
            placeholderTextColor={colors.textSecondary}
            value={plantName}
            onChangeText={setPlantName}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Onde ela fica na casa?
          </Text>
          <View style={styles.roomChips}>
            {ROOM_OPTIONS.map((room) => {
              const active = location === room;
              return (
                <TouchableOpacity
                  key={room}
                  onPress={() => setLocation(room)}
                  style={[
                    styles.roomChip,
                    {
                      backgroundColor: active
                        ? colors.mossPrimary
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '700',
                      color: active ? '#FFFFFF' : colors.textPrimary,
                    }}
                  >
                    {room}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSavePlant}
          style={[styles.saveBtn, { backgroundColor: colors.mossDeep }]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={profile.darkMode ? '#131E19' : '#FAF7F0'}
          />
          <Text
            style={[
              styles.saveBtnText,
              { color: profile.darkMode ? '#131E19' : '#FAF7F0' },
            ]}
          >
            Salvar na Estufa
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ThemedModal
        visible={modalInfo.visible}
        title={modalInfo.title}
        message={modalInfo.message}
        tone={modalInfo.tone}
        isDark={profile.darkMode}
        confirmLabel="Entendi"
        onConfirm={() => setModalInfo((p) => ({ ...p, visible: false }))}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 36, gap: 14 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: { fontSize: 15.5, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 12.5, lineHeight: 18, marginBottom: 14 },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
  },
  photoBtnRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  photoBtnText: { fontSize: 13.5, fontWeight: '700' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  loadingText: { fontSize: 12.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  resultsList: { marginTop: 8 },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  resultTitle: { fontSize: 14, fontWeight: '700' },
  resultSub: { fontSize: 12, marginTop: 2 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  roomChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roomChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 4,
  },
  saveBtnText: { fontSize: 15.5, fontWeight: '800' },
});
