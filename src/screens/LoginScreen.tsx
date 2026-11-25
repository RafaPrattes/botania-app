import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';

export const LoginScreen: React.FC = () => {
  const loginUser = usePlantStore((s) => s.loginUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleEnter = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Informe seu nome e e-mail para carregar sua estufa individual.'
      );
      return;
    }
    await loginUser(name, email);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={38} color="#FFFFFF" />
        </View>

        <Text style={styles.brand}>BotanIA</Text>
        <Text style={styles.tagline}>
          Sua estufa ilustrada com inteligência botânica
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>          Entrar no meu Jardim</Text>
          <Text style={styles.label}>Seu Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Rafaela"
            placeholderTextColor="#9A948C"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Seu E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: rafaela@email.com"
            placeholderTextColor="#9A948C"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={styles.enterBtn}
            onPress={handleEnter}
            activeOpacity={0.85}
          >
            <Text style={styles.enterBtnText}>Acessar Minha Estufa</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F3EC' },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#34493d',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: '#34493d',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13.5,
    color: '#6E6A63',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 26,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#E2EBE3',
    shadowColor: '#34493d',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 19, fontWeight: '800', color: '#34493d', marginBottom: 4 },
  cardDesc: { fontSize: 12.5, color: '#6E6A63', lineHeight: 18, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#34493d', marginBottom: 6 },
  input: {
    backgroundColor: '#F6F3EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#34493d',
    marginBottom: 14,
  },
  enterBtn: {
    backgroundColor: '#34493d',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  enterBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
