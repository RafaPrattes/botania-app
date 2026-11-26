import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETTES } from '../theme/theme';

interface ThemedModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'danger' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  isDark?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ThemedModal: React.FC<ThemedModalProps> = ({
  visible,
  title,
  message,
  icon = 'leaf-outline',
  tone = 'default',
  confirmLabel = 'Confirmar',
  cancelLabel,
  isDark = false,
  onConfirm,
  onCancel,
}) => {
  const colors = isDark ? PALETTES.dark : PALETTES.light;
  const accent =
    tone === 'danger' ? colors.terracotta : colors.mossPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor:
                  tone === 'danger' ? colors.terracottaSoft : colors.surfaceAlt,
              },
            ]}
          >
            <Ionicons name={icon} size={26} color={accent} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.actions}>
            {cancelLabel && onCancel && (
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={onCancel}
              >
                <Text
                  style={[styles.btnText, { color: colors.textSecondary }]}
                >
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: accent }]}
              onPress={onConfirm}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 24, 19, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
