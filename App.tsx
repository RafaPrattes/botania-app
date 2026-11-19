import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlantStore } from './src/store/usePlantStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlantDetailScreen } from './src/screens/PlantDetailScreen';
import { AIConsultScreen } from './src/screens/AIConsultScreen';
import { useLofiAudio } from './src/hooks/useLofiAudio';

export default function App() {
  const hasCompletedOnboarding = usePlantStore(
    (s) => s.hasCompletedOnboarding
  );
  const [currentView, setCurrentView] = useState<'home' | 'ai' | 'detail'>(
    'home'
  );
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const { isPlaying, toggleLofi } = useLofiAudio();

  const handleSelectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setCurrentView('detail');
  };

  if (!hasCompletedOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <OnboardingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <StatusBar barStyle="light-content" />

        <View style={styles.content}>
          {currentView === 'home' && (
            <HomeScreen
              onSelectPlant={handleSelectPlant}
              isLofiPlaying={isPlaying}
              onToggleLofi={toggleLofi}
            />
          )}
          {currentView === 'ai' && <AIConsultScreen />}
          {currentView === 'detail' && selectedPlantId && (
            <PlantDetailScreen
              plantId={selectedPlantId}
              onBack={() => setCurrentView('home')}
            />
          )}
        </View>

        {currentView !== 'detail' && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentView('home')}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  currentView === 'home' && styles.tabIconActive,
                ]}
              >
                <Ionicons
                  name={currentView === 'home' ? 'leaf' : 'leaf-outline'}
                  size={22}
                  color={currentView === 'home' ? '#244233' : '#8E8980'}
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
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  currentView === 'ai' && styles.tabIconActive,
                ]}
              >
                <Ionicons
                  name={
                    currentView === 'ai' ? 'sparkles' : 'sparkles-outline'
                  }
                  size={22}
                  color={currentView === 'ai' ? '#244233' : '#8E8980'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  currentView === 'ai' && styles.tabLabelActive,
                ]}
              >
                IA Botânica
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F3EC' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4ECE5',
    paddingVertical: 8,
    justifyContent: 'space-around',
  },
  tabItem: { alignItems: 'center', gap: 3, width: 110 },
  tabIconWrapper: { paddingHorizontal: 18, paddingVertical: 5, borderRadius: 14 },
  tabIconActive: { backgroundColor: '#BCE3C8' },
  tabLabel: { fontSize: 11.5, fontWeight: '600', color: '#8E8980' },
  tabLabelActive: { color: '#244233', fontWeight: '800' },
});