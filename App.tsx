import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlantDetailScreen } from './src/screens/PlantDetailScreen';

type ScreenView = 'home' | 'detail' | 'ai';

export default function App() {
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const handleSelectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setCurrentView('detail');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Área Principal */}
      <View style={styles.content}>
        {currentView === 'home' && (
          <HomeScreen onSelectPlant={handleSelectPlant} />
        )}

        {/* Placeholder temporário para a Etapa 4 (Prateleira Ghibli) */}
        {currentView === 'detail' && selectedPlantId && (
      <PlantDetailScreen
      plantId={selectedPlantId}
      onBack={() => setCurrentView('home')}
      />
        )}


        {/* Placeholder temporário para a Etapa 5 (Consultoria IA) */}
        {currentView === 'ai' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>Consultoria Botânica IA</Text>
            <Text style={styles.placeholderSubtitle}>
              Vamos conectar o Gemini Multimodal na Etapa 5!
            </Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentView('home')}
            >
              <Text style={styles.backBtnText}>Voltar para A Estufa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Barra de Navegação Inferior (Tab Bar) */}
      {currentView !== 'detail' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentView('home')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.tabIconWrapper,
                currentView === 'home' && styles.tabIconActive,
              ]}
            >
              <Ionicons
                name={currentView === 'home' ? 'home' : 'home-outline'}
                size={22}
                color={currentView === 'home' ? '#5C7C68' : '#A8A29E'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                currentView === 'home' && styles.tabLabelActive,
              ]}
            >
              Estufa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentView('ai')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.tabIconWrapper,
                currentView === 'ai' && styles.tabIconActive,
              ]}
            >
              <Ionicons
                name={currentView === 'ai' ? 'sparkles' : 'sparkles-outline'}
                size={22}
                color={currentView === 'ai' ? '#5C7C68' : '#A8A29E'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                currentView === 'ai' && styles.tabLabelActive,
              ]}
            >
              IA
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  tabIconWrapper: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  tabIconActive: {
    backgroundColor: 'rgba(92, 124, 104, 0.12)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8A29E',
  },
  tabLabelActive: {
    color: '#5C7C68',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F4EBD8',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C4A3B',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#5C7C68',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});