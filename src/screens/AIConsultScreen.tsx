import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore, ChatMessage } from '../store/usePlantStore';
import { analyzePlantWithGemini } from '../services/geminiService';
import { PlantIllustration } from '../components/PlantIllustration';
import { PALETTES, TRANSLATIONS } from '../theme/theme';
import { ThemedModal } from '../components/ThemedModal';

export const AIConsultScreen: React.FC = () => {
  const plants = usePlantStore((s) => s.plants);
  const messages = usePlantStore((s) => s.chatHistory);
  const appendChatMessage = usePlantStore((s) => s.appendChatMessage);
  const clearChatHistory = usePlantStore((s) => s.clearChatHistory);
  const profile = usePlantStore((s) => s.profile);

  const [activePlantIdx, setActivePlantIdx] = useState(0);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    base64: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  const activePlant =
    plants.length > 0 ? plants[activePlantIdx % plants.length] : null;

  const displayMessages: ChatMessage[] = [
    {
      id: 'localized-welcome',
      role: 'ai',
      text: t.aiWelcome,
      timestamp: t.now,
    },
    ...messages.filter((m) => m.id !== 'welcome-1'),
  ];

  const pickImage = async (fromCamera: boolean) => {
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await fn({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.65,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setSelectedImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      });
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const trimmed = (overrideText ?? inputText).trim();
    if (!trimmed && !selectedImage) return;
    if (loading) return;

    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed || t.aiPhotoAttached,
      imageUri: selectedImage?.uri,
      timestamp: `${t.youLabel} · ${nowLabel}`,
    };

    const imgBase64 = selectedImage?.base64;
    appendChatMessage(userMsg);
    if (!overrideText) setInputText('');
    setSelectedImage(null);
    setLoading(true);

    // Injeta o contexto da planta ativa na pergunta enviada ao Gemini
    const contextualQuestion = activePlant
      ? `[Contexto da estufa: planta "${activePlant.name}", espécie "${activePlant.species}", local "${activePlant.location}", saúde ${activePlant.hp}% HP]. Pergunta: ${trimmed}`
      : trimmed;

    const replyText = await analyzePlantWithGemini(
      contextualQuestion,
      imgBase64,
      profile.language
    );

    appendChatMessage({
      id: `ai-${Date.now()}`,
      role: 'ai',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    setLoading(false);
  };

  const quickChips = [t.aiChipWater, t.aiChipLight, t.aiChipLeaves];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Header Editorial Fiel ao Vídeo */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mossMuted }]}>
            {t.aiEyebrow}
          </Text>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
            {t.aiTitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setConfirmClear(true)}
          style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 12}
      >
        <FlatList
          ref={listRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 14 }}>
              {/* Card de Identidade BotanIA */}
              <View
                style={[
                  styles.botIntroCard,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <View
                  style={[
                    styles.botAvatar,
                    {
                      backgroundColor: profile.darkMode
                        ? colors.mossPrimary
                        : colors.mossDeep,
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={18} color="#FAF7F0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.botName, { color: colors.textPrimary }]}
                  >
                    BotanIA
                  </Text>
                  <Text
                    style={[styles.botTagline, { color: colors.textSecondary }]}
                  >
                    {t.aiTagline}
                  </Text>
                </View>
              </View>

              {/* Card Contextual da Planta Ativa */}
              {activePlant && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setActivePlantIdx((prev) => (prev + 1) % plants.length)
                  }
                  style={[
                    styles.contextCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.contextThumb,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <PlantIllustration
                      category={activePlant.category}
                      species={activePlant.species}
                      generatedArtUri={activePlant.generatedArtUri}
                      isLowHp={activePlant.hp <= 45}
                      size="small"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.contextTitle,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {t.aiTalkingAbout} {activePlant.name}
                    </Text>
                    <Text
                      style={[
                        styles.contextSub,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {activePlant.species} · {activePlant.hp}% HP
                    </Text>
                  </View>
                  {plants.length > 1 && (
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={18}
                      color={colors.mossMuted}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.bubbleWrapper,
                  { alignItems: isUser ? 'flex-end' : 'flex-start' },
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? {
                          backgroundColor: profile.darkMode
                            ? colors.mossPrimary
                            : colors.mossDeep,
                          borderBottomRightRadius: 6,
                        }
                      : {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderWidth: 1,
                          borderBottomLeftRadius: 6,
                        },
                  ]}
                >
                  {!isUser && (
                    <View style={styles.aiBubbleHeader}>
                      <Ionicons
                        name="sparkles-outline"
                        size={14}
                        color={colors.mossPrimary}
                      />
                      <Text
                        style={[
                          styles.aiBubbleAuthor,
                          { color: colors.textPrimary },
                        ]}
                      >
                        BotanIA
                      </Text>
                    </View>
                  )}

                  {item.imageUri && (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.msgImage}
                    />
                  )}

                  <Text
                    style={[
                      styles.msgText,
                      { color: isUser ? '#FAF7F0' : colors.textPrimary },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>

                {isUser && (
                  <Text
                    style={[styles.timestamp, { color: colors.textSecondary }]}
                  >
                    {item.timestamp}
                  </Text>
                )}
              </View>
            );
          }}
        />

        {loading && (
          <View style={styles.typingBar}>
            <ActivityIndicator size="small" color={colors.mossPrimary} />
            <Text style={[styles.typingText, { color: colors.textSecondary }]}>
              {t.aiTyping}
            </Text>
          </View>
        )}

        {/* Chips de Perguntas Rápidas Fiel ao Protótipo */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {quickChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => sendMessage(chip)}
                activeOpacity={0.8}
                style={[
                  styles.quickChip,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.quickChipText, { color: colors.textPrimary }]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            {t.aiDisclaimer}
          </Text>
        </View>

        {selectedImage && (
          <View
            style={[
              styles.previewStrip,
              { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewThumb}
            />
            <Text style={[styles.previewLabel, { color: colors.textPrimary }]}>
              {t.aiPhotoAttached}
            </Text>
            <TouchableOpacity onPress={() => setSelectedImage(null)}>
              <Ionicons
                name="close-circle"
                size={22}
                color={colors.terracotta}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Input Clean */}
        <View style={styles.inputBarWrapper}>
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={styles.inlineIconBtn}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={colors.mossMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage(false)}
              style={styles.inlineIconBtn}
            >
              <Ionicons
                name="image-outline"
                size={20}
                color={colors.mossMuted}
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={t.aiPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage()}
            />

            <TouchableOpacity
              onPress={() => sendMessage()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: profile.darkMode
                    ? colors.mossPrimary
                    : colors.mossDeep,
                },
              ]}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ThemedModal
        visible={confirmClear}
        title={t.aiClearTitle}
        message={t.aiClearMsg}
        icon="chatbubble-ellipses-outline"
        tone="danger"
        isDark={profile.darkMode}
        cancelLabel={t.cancel}
        confirmLabel={t.confirm}
        onConfirm={() => {
          clearChatHistory();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  botIntroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botName: {
    fontSize: 16,
    fontWeight: '800',
  },
  botTagline: {
    fontSize: 12.5,
    marginTop: 2,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  contextThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  contextSub: {
    fontSize: 12,
    marginTop: 2,
  },
  bubbleWrapper: {
    marginBottom: 14,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 20,
    padding: 16,
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiBubbleAuthor: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  msgImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
  },
  msgText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
    marginHorizontal: 4,
  },
  typingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  typingText: { fontSize: 12 },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 6,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  previewThumb: { width: 36, height: 36, borderRadius: 8 },
  previewLabel: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  inputBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
  },
  inlineIconBtn: {
    padding: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});