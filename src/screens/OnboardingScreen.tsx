import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';
import {
  PLANT_CATALOG,
  PlantCatalogItem,
  PlantArchetype,
  inferPlantArchetype,
} from '../data/plantCatalog';
import { identifyPlantFromPhoto } from '../services/geminiService';

const ROOM_OPTIONS = [
  'Sala de Estar',
  'Quarto',
  'Varanda',
  'Cozinha',
  'Escritório',
];

export const OnboardingScreen: React.FC = () => {
  const { plants, addPlant, completeOnboarding } = usePlantStore();

  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<PlantCatalogItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [customName, setCustomName] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [customCategory, setCustomCategory] =
    useState<PlantArchetype>('folhagem');
  const [selectedRoom, setSelectedRoom] = useState('Sala de Estar');

  const [isIdentifying, setIsIdentifying] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const filteredPlants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PLANT_CATALOG;
    return PLANT_CATALOG.filter(
      (item) =>
        item.popularName.toLowerCase().includes(q) ||
        item.scientificName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectFromDropdown = (item: PlantCatalogItem) => {
    setSelectedCatalogItem(item);
    setCustomName(item.popularName);
    setCustomSpecies(item.scientificName);
    setCustomCategory(item.category);
    setAiTip(item.lightTip);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0].base64) return;
    setIsIdentifying(true);
    setAiTip(null);
    try {
      const identified = await identifyPlantFromPhoto(result.assets[0].base64);
      setSelectedCatalogItem(null);
      setCustomName(identified.popularName);
      setCustomSpecies(identified.scientificName);
      setCustomCategory(identified.category);
      setAiTip(identified.careTip);
      Alert.alert(
        'Planta Identificada! 🌿',
        `Espécie: ${identified.popularName} (${identified.scientificName})\n\nDica: ${identified.careTip}`
      );
    } catch (err: any) {
      Alert.alert('Atenção', err.message || 'Não foi possível identificar.');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleOpenCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à câmera para fotografar sua planta.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.65,
    });
    await processImageResult(result);
  };

  const handleOpenGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à galeria para escolher a foto.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.65,
    });
    await processImageResult(result);
  };

  const handleAddPlant = () => {
    const finalName = customName.trim();
    if (!finalName) {
      Alert.alert(
        'Escolha uma planta',
        'Selecione uma espécie na lista ou tire uma foto com a IA.'
      );
      return;
    }

    const finalSpecies = customSpecies.trim() || 'Espécie doméstica';
    addPlant({
      name: `${finalName} (${selectedRoom})`,
      species: finalSpecies,
      category:
        customCategory || inferPlantArchetype(`${finalName} ${finalSpecies}`),
      location: selectedRoom,
    });

    setSelectedCatalogItem(null);
    setCustomName('');
    setCustomSpecies('');
    setAiTip(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Boas-Vindas */}
        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Ionicons name="leaf" size={14} color="#244233" />
            <Text style={styles.badgeText}>BOTANIA • JARDIM INTERATIVO</Text>
          </View>
          <Text style={styles.title}>Bem-vinda ao seu Refúgio Botânico</Text>
          <Text style={styles.subtitle}>
            Monte sua estufa virtual, acompanhe a hidratação com ilustrações
            vivas e receba diagnósticos da nossa IA.
          </Text>
        </View>

        {/* Passo 1: Dropdown Pesquisável */}
        <Text style={styles.sectionTitle}>1. Escolha a espécie da planta</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setDropdownOpen(true)}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.dropdownText,
                !customName && { color: '#8C857B' },
              ]}
            >
              {customName
                ? `${customName} • ${customSpecies}`
                : 'Pesquisar entre +55 espécies (ex: Bonsai, Cacto, Jiboia)...'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#4A7C59" />
        </TouchableOpacity>

        {/* Passo 2: Câmera ao Vivo ou Galeria com IA */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={18} color="#3B6E52" />
            <Text style={styles.aiTitle}>
              Não sabe o nome? Identifique por foto!
            </Text>
          </View>

          {isIdentifying ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#3B6E52" />
              <Text style={styles.loadingText}>
                Analisando folhas e estrutura com Gemini Vision...
              </Text>
            </View>
          ) : (
            <View style={styles.photoButtonsRow}>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={handleOpenCamera}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.cameraBtnText}>Tirar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryBtn}
                onPress={handleOpenGallery}
                activeOpacity={0.85}
              >
                <Ionicons name="images" size={18} color="#244233" />
                <Text style={styles.galleryBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}

          {aiTip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {aiTip}</Text>
            </View>
          )}
        </View>

        {/* Passo 3: Onde ela fica na casa */}
        <Text style={styles.sectionTitle}>2. Onde ela fica na sua casa?</Text>
        <View style={styles.roomsWrap}>
          {ROOM_OPTIONS.map((room) => {
            const active = selectedRoom === room;
            return (
              <TouchableOpacity
                key={room}
                onPress={() => setSelectedRoom(room)}
                style={[styles.roomChip, active && styles.roomChipActive]}
              >
                <Text
                  style={[
                    styles.roomChipText,
                    active && styles.roomChipTextActive,
                  ]}
                >
                  {room}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botão Adicionar */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddPlant}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>
            Adicionar à Estufa (+25 XP)
          </Text>
        </TouchableOpacity>

        {/* Resumo das plantas na estufa */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>
            Sua Estufa Atual ({plants.length} plantas)
          </Text>
          <Text style={styles.summaryList}>
            {plants.map((p) => p.name).join('  •  ')}
          </Text>
        </View>

        {/* Botão Entrar na Estufa */}
        <TouchableOpacity
          style={styles.enterBtn}
          onPress={completeOnboarding}
          activeOpacity={0.9}
        >
          <Text style={styles.enterBtnText}>Entrar na Estufa 🌿</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Dropdown Pesquisável */}
      <Modal
        visible={dropdownOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDropdownOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catálogo Botânico</Text>
              <TouchableOpacity onPress={() => setDropdownOpen(false)}>
                <Ionicons name="close-circle" size={26} color="#6E6A63" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#7A746C" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nome popular (ex: Bonsai, Cacto)..."
                placeholderTextColor="#9A948C"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={18} color="#7A746C" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredPlants}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.catalogRow}
                  onPress={() => handleSelectFromDropdown(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catalogPopular}>
                      {item.popularName}
                    </Text>
                    <Text style={styles.catalogScientific}>
                      {item.scientificName}
                    </Text>
                  </View>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    Não achou na lista? Use o nome digitado acima ou tire uma
                    foto com a IA!
                  </Text>
                  {searchQuery.trim().length > 0 && (
                    <TouchableOpacity
                      style={styles.useCustomBtn}
                      onPress={() => {
                        setCustomName(searchQuery.trim());
                        setCustomSpecies('Espécie personalizada');
                        setCustomCategory(inferPlantArchetype(searchQuery));
                        setDropdownOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <Text style={styles.useCustomBtnText}>
                        Usar "{searchQuery.trim()}"
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F3EC' },
  scroll: { padding: 22, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#244233',
    borderRadius: 28,
    padding: 22,
    marginBottom: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BCE3C8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    marginBottom: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#244233' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', lineHeight: 30 },
  subtitle: { fontSize: 13.5, color: '#D4E6DA', marginTop: 8, lineHeight: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#244233',
    marginBottom: 10,
  },
  dropdownTrigger: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#DCE5DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownText: { fontSize: 14.5, fontWeight: '600', color: '#244233' },
  aiCard: {
    backgroundColor: '#E7F2EA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C5DEC9',
    marginBottom: 20,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: '#244233', flex: 1 },
  photoButtonsRow: { flexDirection: 'row', gap: 10 },
  cameraBtn: {
    flex: 1,
    backgroundColor: '#3B6E52',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  galleryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C5DEC9',
  },
  galleryBtnText: { color: '#244233', fontWeight: '700', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: '#244233', fontWeight: '600', flex: 1 },
  tipBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
  },
  tipText: { fontSize: 12.5, color: '#244233', fontWeight: '600' },
  roomsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  roomChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2DDD2',
  },
  roomChipActive: { backgroundColor: '#D97B59', borderColor: '#D97B59' },
  roomChipText: { fontSize: 13, fontWeight: '600', color: '#5A554E' },
  roomChipTextActive: { color: '#FFFFFF' },
  addBtn: {
    backgroundColor: '#4A7C59',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  summaryBox: {
    backgroundColor: '#EFECE4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#244233', marginBottom: 4 },
  summaryList: { fontSize: 12.5, color: '#5E5951', lineHeight: 18 },
  enterBtn: {
    backgroundColor: '#244233',
    borderRadius: 20,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#244233',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  enterBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 24, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F6F3EC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '82%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#244233' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE5DD',
  },
  searchInput: { flex: 1, fontSize: 14.5, color: '#244233' },
  catalogRow: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catalogPopular: { fontSize: 15, fontWeight: '700', color: '#244233' },
  catalogScientific: { fontSize: 12, fontStyle: 'italic', color: '#7A746C', marginTop: 2 },
  categoryTag: {
    backgroundColor: '#E7F2EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: '#3B6E52', textTransform: 'capitalize' },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6E6A63', fontSize: 13.5, marginBottom: 14 },
  useCustomBtn: {
    backgroundColor: '#3B6E52',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  useCustomBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
