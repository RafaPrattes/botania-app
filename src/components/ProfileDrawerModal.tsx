import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  StyleSheet,
  ScrollView,
  Share, // Corrected import statement
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const getDocumentPicker = () => {
  try {
    return require('expo-document-picker') as {
      getDocumentAsync: (options: { type: string }) => Promise<{
        canceled: boolean;
        assets?: { uri: string }[];
      }>;
    };
  } catch {
    return null;
  }
};
import { usePlantStore } from '../store/usePlantStore';
import { AppLanguage, PALETTES, TRANSLATIONS } from '../theme/theme';
import { ThemedModal } from './ThemedModal';

interface ProfileDrawerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileDrawerModal: React.FC<ProfileDrawerModalProps> = ({
  visible,
  onClose,
}) => {
  const profile = usePlantStore((s) => s.profile);
  const updateProfile = usePlantStore((s) => s.updateProfile);
  const exportBackupJson = usePlantStore((s) => s.exportBackupJson);
  const importBackupJson = usePlantStore((s) => s.importBackupJson);
  const resetGarden = usePlantStore((s) => s.resetGarden);

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    tone: 'default' | 'danger' | 'success';
    onConfirm: () => void;
    cancelLabel?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    tone: 'default',
    onConfirm: () => {},
  });

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  const handlePickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      updateProfile({ avatarUri: res.assets[0].uri });
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = exportBackupJson();
      await Share.share({ message: json, title: 'Backup do BotanIA' });
    } catch {
      setFeedbackModal({
        visible: true,
        title: 'Erro ao exportar',
        message: 'Não foi possível gerar o arquivo de backup no momento.',
        tone: 'danger',
        onConfirm: () =>
          setFeedbackModal((prev) => ({ ...prev, visible: false })),
      });
    }
  };

  const handleImportBackup = async () => {
    try {
      const documentPicker = getDocumentPicker();
      if (!documentPicker) throw new Error('Document picker unavailable');
      const doc = await documentPicker.getDocumentAsync({
        type: 'application/json',
      });
      if (doc.canceled || !doc.assets?.[0]?.uri) return;
      const content = await (await fetch(doc.assets[0].uri)).text();
      const ok = importBackupJson(content);
      setFeedbackModal({
        visible: true,
        title: ok ? 'Backup restaurado' : 'Arquivo inválido',
        message: ok
          ? 'Suas plantas, níveis e histórico foram restaurados com sucesso.'
          : 'O arquivo selecionado não é um backup válido do BotanIA.',
        tone: ok ? 'success' : 'danger',
        onConfirm: () =>
          setFeedbackModal((prev) => ({ ...prev, visible: false })),
      });
    } catch {
      // Cancelado pelo usuário
    }
  };

  const confirmReset = () => {
    setFeedbackModal({
      visible: true,
      title: 'Limpar toda a estufa?',
      message:
        'Todas as plantas cadastradas e o histórico de conversa serão removidos deste aparelho.',
      tone: 'danger',
      cancelLabel: 'Cancelar',
      onConfirm: () => {
        resetGarden();
        setFeedbackModal((prev) => ({ ...prev, visible: false }));
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.drawer,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
              {t.settings}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar e Nome */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.mossPrimary,
                  },
                ]}
              >
                {profile.avatarUri ? (
                  <Image
                    source={{ uri: profile.avatarUri }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={34}
                    color={colors.mossPrimary}
                  />
                )}
                <View
                  style={[
                    styles.cameraBadge,
                    { backgroundColor: colors.mossPrimary },
                  ]}
                >
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={profile.name}
                onChangeText={(name) => updateProfile({ name })}
                placeholder="Seu nome"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Preferência de Tema */}
            <View
              style={[
                styles.settingRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.settingLabelRow}>
                <Ionicons
                  name={profile.darkMode ? 'moon-outline' : 'sunny-outline'}
                  size={20}
                  color={colors.mossPrimary}
                />
                <Text
                  style={[styles.settingText, { color: colors.textPrimary }]}
                >
                  {t.darkMode}
                </Text>
              </View>
              <Switch
                value={profile.darkMode}
                onValueChange={(darkMode) => updateProfile({ darkMode })}
                trackColor={{ true: colors.mossPrimary, false: '#CCC' }}
              />
            </View>

            {/* Seletor de Idioma */}
            <View
              style={[
                styles.langBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                {t.language}
              </Text>
              <View style={styles.langRow}>
                {(
                  [
                    { code: 'pt', label: 'Português' },
                    { code: 'en', label: 'English' },
                    { code: 'es', label: 'Español' },
                  ] as { code: AppLanguage; label: string }[]
                ).map((item) => {
                  const active = profile.language === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: active
                            ? colors.mossPrimary
                            : colors.surfaceAlt,
                        },
                      ]}
                      onPress={() => updateProfile({ language: item.code })}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: active ? '#FFFFFF' : colors.textPrimary,
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Backup Local-First */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={handleExportBackup}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={colors.mossPrimary}
              />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>
                {t.exportBackup}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={handleImportBackup}
            >
              <Ionicons
                name="folder-open-outline"
                size={20}
                color={colors.mossPrimary}
              />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>
                {t.importBackup}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.terracottaSoft,
                  borderColor: colors.terracotta,
                  marginTop: 12,
                },
              ]}
              onPress={confirmReset}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.terracotta}
              />
              <Text
                style={[styles.settingText, { color: colors.terracotta }]}
              >
                {t.resetGarden}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
      </View>

      <ThemedModal
        visible={feedbackModal.visible}
        title={feedbackModal.title}
        message={feedbackModal.message}
        tone={feedbackModal.tone}
        isDark={profile.darkMode}
        cancelLabel={feedbackModal.cancelLabel}
        onConfirm={feedbackModal.onConfirm}
        onCancel={() =>
          setFeedbackModal((prev) => ({ ...prev, visible: false }))
        }
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(12, 20, 16, 0.5)',
  },
  drawer: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderRightWidth: 1,
  },
  dismissArea: { flex: 1 },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  drawerTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarImg: { width: 78, height: 78, borderRadius: 39 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingText: { fontSize: 14, fontWeight: '600' },
  langBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 8 },
  langChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
});
