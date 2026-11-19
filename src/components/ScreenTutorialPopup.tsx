import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TutorialStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

interface ScreenTutorialPopupProps {
  visible: boolean;
  heading: string;
  steps: TutorialStep[];
  onDismiss: () => void;
}

export const ScreenTutorialPopup: React.FC<ScreenTutorialPopupProps> = ({
  visible,
  heading,
  steps,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="compass" size={16} color="#244233" />
            <Text style={styles.badgeText}>DICA DE PRIMEIRO ACESSO</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={10}>
            <Ionicons name="close" size={22} color="#6E6A63" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>{heading}</Text>

        <View style={styles.stepsList}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.iconCircle}>
                <Ionicons name={step.icon} size={18} color="#3B6E52" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onDismiss}
          activeOpacity={0.85}
        >
          <Text style={styles.dismissText}>Entendi, explorar! 🌿</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(22, 34, 27, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
    zIndex: 999,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FAF7F0',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#D6E2D8',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#CDE8D5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: { fontSize: 10.5, fontWeight: '800', color: '#244233' },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#244233',
    marginBottom: 14,
  },
  stepsList: { gap: 12, marginBottom: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E5F2E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#244233' },
  stepDesc: { fontSize: 12.5, color: '#5E5A52', lineHeight: 18, marginTop: 1 },
  dismissBtn: {
    backgroundColor: '#3B6E52',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dismissText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 },
});