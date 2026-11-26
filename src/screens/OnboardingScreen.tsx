import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { identifyPlantFromPhoto } from '../services/geminiService';
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

const CATEGORY_LABELS: Record<PlantArchetype, string> = {
  pendente: 'Pendente',
  suculenta: 'Suculenta',
  cacto: 'Cacto',
  bonsai: 'Bonsai',
  flor: 'Flor',
  folhagem: 'Folhagem',
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
}) => {
  const addPlantsBatch = usePlantStore((s) => s.addPlantsBatch);
  const profile = usePlantStore((s) => s.profile);
  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlantCatalogOption[]>([]);
  const [searching, setSearching] = useState(false);

  const [plantName, setPlantName] = useState('');
  const [species, setSpecies] = useState('');
  const [category, setCategory] = useState<PlantArchetype>('folhagem');
  const [location, setLocation] = useState('Sala de Estar');

  // Preview temporário apenas para identificação pela IA (não substitui a arte Ghibli do jogo)
  const [scanPreviewUri, setScanPreviewUri] = useState<string | undefined>(
    undefined
  );
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

  // Debounce de 350ms na busca de espécies
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === plantName) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const list = await searchPlantSpecies(trimmed);
      setResults(list);
      setSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, plantName]);

  const selectSpeciesOption = (item: PlantCatalogOption) => {
    setPlantName(item.popularName);
    setSpecies(item.popularName);
    setCategory(item.category);
    setQuery(item.popularName);
    setResults([]);
  };

  const handlePhotoIdentify = async (fromCamera: boolean) => {
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const picked = await fn({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.55,
    });

    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setScanPreviewUri(asset.uri);

    if (!asset.base64) {
      setModalInfo({
        visible: true,
        title: 'Não foi possível ler a imagem',
        message:
          'Tente escolher outra foto ou digite o nome da espécie abaixo.',
        tone: 'danger',
      });
      return;
    }

    setIdentifying(true);
    const result = await identifyPlantFromPhoto(asset.base64);
    setIdentifying(false);

    if (result.ok) {
      setPlantName(result.data.popularName);
      setSpecies(result.data.scientificName);
      setCategory(result.data.category);
      setQuery(result.data.popularName);
      setResults([]);
      setModalInfo({
        visible: true,
        title: `Espécie identificada: ${result.data.popularName}`,
        message: `Classificamos sua planta como "${CATEGORY_LABELS[result.data.category]}" para usar a ilustração Ghibli correspondente na sua estufa.`,
        tone: 'success',
      });
    } else if (result.reason === 'missing_key') {
      setModalInfo({
        visible: true,
        title: 'Chave da IA não carregada',
        message:
          'Confirme se EXPO_PUBLIC_GEMINI_API_KEY está no .env e reinicie o Expo com "npx expo start -c". Enquanto isso, digite a espécie abaixo.',
        tone: 'default',
      });
    } else {
      setModalInfo({
        visible: true,
        title: 'Não identificamos com precisão',
        message:
          'Tente uma foto mais iluminada da planta ou digite o nome dela no campo de busca abaixo.',
        tone: 'danger',
      });
    }
  };

  const handleSavePlant = () => {
    const finalName = plantName.trim() || query.trim();
    if (!finalName) {
      setModalInfo({
        visible: true,
        title: 'Falta o nome da planta',
        message: scanPreviewUri
          ? 'Digite o nome ou escolha uma espécie na busca abaixo para adicionar sua planta à estufa.'
          : 'Pesquise uma espécie, use a identificação por foto ou digite um apelido para continuar.',
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
        // Não salvamos a foto real no card para preservar 100% a imersão ilustrada Ghibli
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Identificação por Foto */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Identificar espécie com IA
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Envie uma foto real apenas para o BotanIA reconhecer a espécie e
              escolher a ilustração certa para a sua prateleira.
            </Text>

            {scanPreviewUri && (
              <Image
                source={{ uri: scanPreviewUri }}
                style={styles.photoPreview}
              />
            )}

            <View style={styles.photoBtnRow}>
              <TouchableOpacity
                onPress={() => handlePhotoIdentify(true)}
                style={[styles.photoBtn, { backgroundColor: colors.surfaceAlt }]}
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
                style={[styles.photoBtn, { backgroundColor: colors.surfaceAlt }]}
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
                  Analisando foto com Gemini...
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
                placeholder="Ex: Cacto, Jiboia, Bonsai, Orquídea..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                onFocus={() =>
                  setTimeout(
                    () => scrollRef.current?.scrollTo({ y: 240, animated: true }),
                    180
                  )
                }
              />
              {searching && (
                <ActivityIndicator size="small" color={colors.mossPrimary} />
              )}
            </View>

            {results.length > 0 && (
              <View
                style={[
                  styles.resultsList,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
              >
                {results.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => selectSpeciesOption(item)}
                    style={[
                      styles.resultItem,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.resultTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {item.popularName}
                      </Text>
                      <Text
                        style={[
                          styles.resultSub,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.scientificName}
                      </Text>
                    </View>
                    <Text
                      style={[styles.catBadge, { color: colors.mossPrimary }]}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Estilo da ilustração na prateleira
            </Text>
            <View style={styles.roomChips}>
              {(Object.keys(CATEGORY_LABELS) as PlantArchetype[]).map((cat) => {
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
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
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
              placeholder="Ex: Cacto da Varanda"
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
      </KeyboardAvoidingView>

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
  content: { padding: 16, paddingBottom: 140, gap: 14 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: { fontSize: 15.5, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 12.5, lineHeight: 18, marginBottom: 14 },
  photoPreview: {
    width: '100%',
    height: 150,
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
  resultsList: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 8,
  },
  resultTitle: { fontSize: 14, fontWeight: '700' },
  resultSub: { fontSize: 11.5, marginTop: 2 },
  catBadge: { fontSize: 11, fontWeight: '800' },
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
