import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlantDetailScreen } from './src/screens/PlantDetailScreen';
import { AIConsultScreen } from './src/screens/AIConsultScreen';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'ai' | 'detail'>(
    'home'
  );
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const handleSelectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setCurrentView('detail');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Área Principal de Conteúdo */}
      <View style={styles.content}>
        {currentView === 'home' && (
          <HomeScreen onSelectPlant={handleSelectPlant} />
        )}

        {currentView === 'detail' && selectedPlantId && (
          <PlantDetailScreen
            plantId={selectedPlantId}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'ai' && (
          <AIConsultScreen onBack={() => setCurrentView('home')} />
        )}
      </View>

      {/* Tab Bar (Bottom Navigation) - Oculta na tela de detalhes */}
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    paddingVertical: 10,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    gap: 2,
  },
  tabIconWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabIconActive: {
    backgroundColor: 'rgba(92, 124, 104, 0.12)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A8A29E',
  },
  tabLabelActive: {
    color: '#5C7C68',
  },
});
