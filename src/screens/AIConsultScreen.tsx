import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { analyzePlantWithGemini } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUri?: string | null;
  time: string;
}

interface AIConsultScreenProps {
  onBack: () => void;
}

export const AIConsultScreen: React.FC<AIConsultScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'user',
      text: 'Minha jiboia está com as pontas secas, o que fazer?',
      time: '10:42',
    },
    {
      id: 'welcome-2',
      sender: 'ai',
      text: 'Olá! Analisei seu relato. As pontas secas na Jiboia geralmente indicam baixa umidade no ar ou rega insuficiente.\n\nDicas rápidas:\n1. Aumente levemente a frequência da rega, mantendo o solo úmido mas nunca encharcado.\n2. Borrife água filtrada nas folhas pela manhã.',
      time: '10:42',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
      setSelectedBase64(result.assets[0].base64 || null);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImageUri) || isLoading) return;

    const userText =
      inputText.trim() || 'Analise a saúde desta planta pela foto, por favor.';
    const currentImageUri = selectedImageUri;
    const currentBase64 = selectedBase64;

    const newUserMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: userText,
      imageUri: currentImageUri,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setSelectedImageUri(null);
    setSelectedBase64(null);
    setIsLoading(true);

    const aiReply = await analyzePlantWithGemini({
      userPrompt: userText,
      base64Image: currentBase64,
    });

    const newAiMsg: Message = {
      id: String(Date.now() + 1),
      sender: 'ai',
      text: aiReply,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, newAiMsg]);
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header IA */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color="#57534E" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Consultoria Botânica</Text>
          <View style={styles.poweredRow}>
            <Ionicons name="sparkles" size={12} color="#5C7C68" />
            <Text style={styles.poweredText}>Powered by Gemini Multimodal</Text>
          </View>
        </View>
      </View>

      {/* Mensagens */}
      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                isUser ? styles.messageWrapperUser : styles.messageWrapperAi,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                {msg.imageUri && (
                  <Image
                    source={{ uri: msg.imageUri }}
                    style={styles.attachedImage}
                  />
                )}
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.messageTextUser : styles.messageTextAi,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
              <Text style={styles.timestamp}>
                {isUser ? 'Você' : 'BotanIA'} • {msg.time}
              </Text>
            </View>
          );
        })}

        {isLoading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#5C7C68" />
            <Text style={styles.loadingText}>
              BotanIA está analisando sua planta...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Preview da foto selecionada */}
      {selectedImageUri && (
        <View style={styles.previewBar}>
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.previewThumb}
          />
          <Text style={styles.previewText}>Foto anexada para diagnóstico</Text>
          <TouchableOpacity onPress={() => setSelectedImageUri(null)}>
            <Ionicons name="close-circle" size={22} color="#78716C" />
          </TouchableOpacity>
        </View>
      )}

      {/* Barra de Input */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handlePickImage}
          activeOpacity={0.75}
        >
          <Ionicons name="camera-outline" size={22} color="#57534E" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Descreva os sintomas ou envie foto..."
          placeholderTextColor="#A8A29E"
          value={inputText}
          onChangeText={setInputText}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F4',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C4A3B',
  },
  poweredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  poweredText: {
    fontSize: 12,
    color: '#78716C',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  messageWrapper: {
    width: '100%',
  },
  messageWrapperUser: {
    alignItems: 'flex-end',
  },
  messageWrapperAi: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    padding: 16,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: '#5C7C68',
    borderTopRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  attachedImage: {
    width: 210,
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAi: {
    color: '#2C4A3B',
  },
  timestamp: {
    fontSize: 10,
    color: '#A8A29E',
    marginTop: 4,
    marginHorizontal: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 13,
    color: '#5C7C68',
    fontWeight: '500',
  },
  previewBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  previewThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: '#44403C',
    fontWeight: '500',
  },
  inputBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 92,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F5F5F4',
    borderRadius: 23,
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#292524',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#5C7C68',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIConsultScreen;
