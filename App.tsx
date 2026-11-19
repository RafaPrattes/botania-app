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
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlantDetailScreen } from './src/screens/PlantDetailScreen';
import { AIConsultScreen } from './src/screens/AIConsultScreen';
import { useLofiAudio } from './src/hooks/useLofiAudio';
import { ScreenTutorialPopup } from './src/components/ScreenTutorialPopup';

export default function App() {
  const activeView = usePlantStore((s) => s.activeView);
  const seenTutorials = usePlantStore((s) => s.seenTutorials);
  const dismissTutorial = usePlantStore((s) => s.dismissTutorial);

  const [currentTab, setCurrentTab] = useState<'home' | 'ai' | 'detail'>(
    'home'
  );
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const { isPlaying, toggleLofi } = useLofiAudio();

  const handleSelectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setCurrentTab('detail');
  };

  if (activeView === 'login') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  if (activeView === 'onboarding') {
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
          {currentTab === 'home' && (
            <>
              <HomeScreen
                onSelectPlant={handleSelectPlant}
                isLofiPlaying={isPlaying}
                onToggleLofi={toggleLofi}
              />
              <ScreenTutorialPopup
                visible={!seenTutorials.home}
                heading="Bem-vinda à sua Estufa 🏡"
                onDismiss={() => dismissTutorial('home')}
                steps={[
                  {
                    icon: 'leaf',
                    title: 'Toque em uma planta',
                    description:
                      'Abre a prateleira ilustrada com janela dia/noite e ferramentas.',
                  },
                  {
                    icon: 'musical-notes',
                    title: 'Música Lo-Fi & Nova Planta',
                    description:
                      'Use a barra superior para ligar a trilha sonora ou adicionar mais plantas.',
                  },
                ]}
              />
            </>
          )}

          {currentTab === 'ai' && (
            <>
              <AIConsultScreen />
              <ScreenTutorialPopup
                visible={!seenTutorials.ai}
                heading="Especialista Botânico IA 🤖"
                onDismiss={() => dismissTutorial('ai')}
                steps={[
                  {
                    icon: 'camera',
                    title: 'Envie uma foto ou dúvida',
                    description:
                      'Use a câmera ou galeria para diagnosticar folhas amareladas, pragas e rega.',
                  },
                ]}
              />
            </>
          )}

          {currentTab === 'detail' && selectedPlantId && (
            <PlantDetailScreen
              plantId={selectedPlantId}
              onSelectPlant={(id) => setSelectedPlantId(id)}
              onBack={() => setCurrentTab('home')}
            />
          )}
        </View>

        {currentTab !== 'detail' && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('home')}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  currentTab === 'home' && styles.tabIconActive,
                ]}
              >
                <Ionicons
                  name={currentTab === 'home' ? 'leaf' : 'leaf-outline'}
                  size={22}
                  color={currentTab === 'home' ? '#244233' : '#8E8980'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  currentTab === 'home' && styles.tabLabelActive,
                ]}
              >
                Estufa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('ai')}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  currentTab === 'ai' && styles.tabIconActive,
                ]}
              >
                <Ionicons
                  name={currentTab === 'ai' ? 'sparkles' : 'sparkles-outline'}
                  size={22}
                  color={currentTab === 'ai' ? '#244233' : '#8E8980'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  currentTab === 'ai' && styles.tabLabelActive,
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