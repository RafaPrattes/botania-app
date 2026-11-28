import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from '../store/usePlantStore';

export const LoginScreen: React.FC = () => {
  const loginOrRegister = usePlantStore((s) =>
    (s as unknown as {
      loginOrRegister: (
        mode: 'login' | 'register',
        name: string,
        email: string,
        password: string,
      ) => Promise<{ ok: boolean; error?: string }>;
    }).loginOrRegister,
  );

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);
    const result = await loginOrRegister(mode, name, email, password);
    setLoading(false);

    if (!result.ok && result.error) {
      setErrorMsg(result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.emblem}>
          <Ionicons name="leaf" size={40} color="#F7F4EC" />
        </View>

        <Text style={styles.title}>BotanIA</Text>
        <Text style={styles.subtitle}>
          Sua estufa aconchegante com diagnóstico botânico inteligente
        </Text>

        {/* Seletor Entrar / Criar Conta */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            onPress={() => {
              setMode('login');
              setErrorMsg(null);
            }}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'login' && styles.modeTabTextActive,
              ]}
            >
              Entrar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'register' && styles.modeTabActive,
            ]}
            onPress={() => {
              setMode('register');
              setErrorMsg(null);
            }}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'register' && styles.modeTabTextActive,
              ]}
            >
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Nome do Jardineiro</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Rafaela"
                placeholderTextColor="#9A948C"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setErrorMsg(null);
                }}
              />
            </>
          )}

          <Text style={[styles.label, mode === 'register' && { marginTop: 12 }]}>
            E-mail
          </Text>
          <TextInput
            style={styles.input}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor="#9A948C"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrorMsg(null);
            }}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#9A948C"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrorMsg(null);
              }}
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#5B7865"
              />
            </TouchableOpacity>
          </View>

          {/* Aviso Temático da Estufa (substitui Alert genérico) */}
          {errorMsg && (
            <View style={styles.themedAlert}>
              <Ionicons name="alert-circle" size={18} color="#B84A39" />
              <Text style={styles.themedAlertText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.enterBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.enterBtnText}>
                  {mode === 'login' ? 'Abrir Minha Estufa' : 'Cadastrar Estufa'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3EFE6' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  emblem: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: '#2F5D46',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#244233',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#5B7865',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 19,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#E5DFD2',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6A655D',
  },
  modeTabTextActive: {
    color: '#244233',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E6E0D5',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#244233',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F7F4EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#244233',
    borderWidth: 1,
    borderColor: '#E2DDD2',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4EC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2DDD2',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#244233',
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  themedAlert: {
    marginTop: 14,
    backgroundColor: '#FDF1EE',
    borderWidth: 1,
    borderColor: '#ECC4BC',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themedAlertText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#9C3B2D',
    lineHeight: 17,
  },
  enterBtn: {
    marginTop: 18,
    backgroundColor: '#2F5D46',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  enterBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
});
