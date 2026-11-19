import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { consultBotanistAI } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUri?: string;
}

export const AIConsultScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá! Sou o BotanIA 🌿\nTire uma foto agora ou envie da galeria para eu identificar sua planta ou ajudar com folhas secas, manchas e rega.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o uso da câmera.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.65,
    });
    if (!res.canceled && res.assets[0]) {
      setSelectedImageUri(res.assets[0].uri);
      setSelectedImageBase64(res.assets[0].base64 || null);
    }
  };

  const handlePickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.65,
    });
    if (!res.canceled && res.assets[0]) {
      setSelectedImageUri(res.assets[0].uri);
      setSelectedImageBase64(res.assets[0].base64 || null);
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed && !selectedImageBase64) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed || 'Pode analisar esta planta para mim?',
      imageUri: selectedImageUri || undefined,
    };

    const base64ToSend = selectedImageBase64;
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setIsSending(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const reply = await consultBotanistAI(base64ToSend, userMsg.text);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: reply,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsSending(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Consultoria Botânica</Text>
          <Text style={styles.headerSubtitle}>
            Visão Multimodal • Gemini 2.5 Flash
          </Text>
        </View>
      </View>

      {/* KeyboardAvoidingView garante que a caixa de texto suba acima do teclado */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleWrapper,
                  isUser ? styles.alignRight : styles.alignLeft,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  {msg.imageUri && (
                    <Image
                      source={{ uri: msg.imageUri }}
                      style={styles.chatImage}
                    />
                  )}
                  <Text
                    style={[
                      styles.bubbleText,
                      isUser ? styles.userText : styles.aiText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {isSending && (
            <View style={[styles.bubbleWrapper, styles.alignLeft]}>
              <View style={[styles.bubble, styles.aiBubble, styles.typingRow]}>
                <ActivityIndicator size="small" color="#3B6E52" />
                <Text style={styles.typingText}>Analisando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Preview da imagem anexada */}
        {selectedImageUri && (
          <View style={styles.previewBar}>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.previewThumb}
            />
            <Text style={styles.previewLabel}>Foto pronta para envio</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedImageUri(null);
                setSelectedImageBase64(null);
              }}
            >
              <Ionicons name="close-circle" size={22} color="#C85A43" />
            </TouchableOpacity>
          </View>
        )}

        {/* Caixa de Entrada */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={20} color="#244233" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={handlePickGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="image" size={20} color="#244233" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Pergunte sobre sua planta..."
            placeholderTextColor="#8E8980"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={isSending}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F3EC' },
  header: {
    backgroundColor: '#244233',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#4E9463',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#BCE3C8' },
  chatContent: { padding: 16, paddingBottom: 20, gap: 12 },
  bubbleWrapper: { width: '100%' },
  alignRight: { alignItems: 'flex-end' },
  alignLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', borderRadius: 20, padding: 14 },
  userBubble: { backgroundColor: '#3B6E52', borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E4ECE5',
  },
  chatImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 8 },
  bubbleText: { fontSize: 14.5, lineHeight: 21 },
  userText: { color: '#FFFFFF' },
  aiText: { color: '#244233' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: '#3B6E52', fontWeight: '600' },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F2EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  previewThumb: { width: 40, height: 40, borderRadius: 8 },
  previewLabel: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#244233' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E4ECE5',
    gap: 8,
  },
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#F6F3EC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: '#244233',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#4E9463',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
