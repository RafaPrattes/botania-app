import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
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
import { PALETTES, TRANSLATIONS } from '../theme/theme';
import { ThemedModal } from '../components/ThemedModal';

export const AIConsultScreen: React.FC = () => {
  const messages = usePlantStore((s) => s.chatHistory);
  const appendChatMessage = usePlantStore((s) => s.appendChatMessage);
  const clearChatHistory = usePlantStore((s) => s.clearChatHistory);
  const profile = usePlantStore((s) => s.profile);

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

  // Mensagem inicial sempre renderizada no idioma atual do usuário
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

  const handleSend = async () => {
    const trimmed = inputText.trim();
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
      timestamp: nowLabel,
    };

    const imgBase64 = selectedImage?.base64;
    appendChatMessage(userMsg);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    const replyText = await analyzePlantWithGemini(
      trimmed,
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[styles.aiAvatar, { backgroundColor: colors.mossPrimary }]}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t.aiTitle}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {t.aiSub}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setConfirmClear(true)}
          style={[styles.clearBtn, { backgroundColor: colors.surfaceAlt }]}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <FlatList
          ref={listRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
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
                      ? { backgroundColor: colors.mossPrimary }
                      : {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                >
                  {item.imageUri && (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.msgImage}
                    />
                  )}
                  <Text
                    style={[
                      styles.msgText,
                      { color: isUser ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
                <Text
                  style={[styles.timestamp, { color: colors.textSecondary }]}
                >
                  {item.timestamp}
                </Text>
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

        <View
          style={[
            styles.inputBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => pickImage(true)}
            style={[styles.mediaBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color={colors.mossPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => pickImage(false)}
            style={[styles.mediaBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons
              name="image-outline"
              size={20}
              color={colors.mossPrimary}
            />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                color: colors.textPrimary,
              },
            ]}
            placeholder={t.aiPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: colors.mossPrimary }]}
          >
            <Ionicons name="send" size={17} color="#FFFFFF" />
          </TouchableOpacity>
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 11.5 },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, paddingBottom: 20 },
  bubbleWrapper: { marginBottom: 14 },
  bubble: { maxWidth: '84%', borderRadius: 20, padding: 14 },
  msgImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 8 },
  msgText: { fontSize: 14, lineHeight: 20 },
  timestamp: { fontSize: 10.5, marginTop: 4, marginHorizontal: 4 },
  typingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  typingText: { fontSize: 12 },
  previewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewThumb: { width: 38, height: 38, borderRadius: 8 },
  previewLabel: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  mediaBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
