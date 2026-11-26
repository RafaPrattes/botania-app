import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlantDetailScreen } from './src/screens/PlantDetailScreen';
import { AIConsultScreen } from './src/screens/AIConsultScreen';
import { GardenMapScreen } from './src/screens/GardenMapScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileDrawerModal } from './src/components/ProfileDrawerModal';
import { usePlantStore } from './src/store/usePlantStore';
import { useLofiAudio } from './src/hooks/useLofiAudio';
import { PALETTES, TRANSLATIONS } from './src/theme/theme';

type AppView = 'home' | 'detail' | 'ai' | 'maps' | 'onboarding';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const profile = usePlantStore((s) => s.profile);
  const { isPlaying, toggleMusic } = useLofiAudio();

  const colors = profile.darkMode ? PALETTES.dark : PALETTES.light;
  const t = TRANSLATIONS[profile.language];

  const handleSelectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setCurrentView('detail');
  };

  const showBottomTabs =
    currentView === 'home' ||
    currentView === 'ai' ||
    currentView === 'maps';

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={profile.darkMode ? 'light-content' : 'dark-content'}
        />

        <View style={styles.content}>
          {currentView === 'home' && (
            <HomeScreen
              onSelectPlant={handleSelectPlant}
              onAddPlant={() => setCurrentView('onboarding')}
              onOpenDrawer={() => setDrawerVisible(true)}
              isMusicPlaying={isPlaying}
              onToggleMusic={toggleMusic}
            />
          )}

          {currentView === 'onboarding' && (
            <OnboardingScreen onFinish={() => setCurrentView('home')} />
          )}

          {currentView === 'detail' && selectedPlantId && (
            <PlantDetailScreen
              plantId={selectedPlantId}
              onBack={() => setCurrentView('home')}
              onSelectPlant={handleSelectPlant}
            />
          )}

          {currentView === 'ai' && <AIConsultScreen />}

          {currentView === 'maps' && <GardenMapScreen />}
        </View>

        {showBottomTabs && (
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentView('home')}
            >
              <Ionicons
                name={currentView === 'home' ? 'leaf' : 'leaf-outline'}
                size={22}
                color={
                  currentView === 'home'
                    ? colors.mossPrimary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentView === 'home'
                        ? colors.mossPrimary
                        : colors.textSecondary,
                  },
                ]}
              >
                {t.greenhouse}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentView('ai')}
            >
              <Ionicons
                name={currentView === 'ai' ? 'sparkles' : 'sparkles-outline'}
                size={22}
                color={
                  currentView === 'ai'
                    ? colors.mossPrimary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentView === 'ai'
                        ? colors.mossPrimary
                        : colors.textSecondary,
                  },
                ]}
              >
                {t.aiConsult}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentView('maps')}
            >
              <Ionicons
                name={currentView === 'maps' ? 'map' : 'map-outline'}
                size={22}
                color={
                  currentView === 'maps'
                    ? colors.mossPrimary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentView === 'maps'
                        ? colors.mossPrimary
                        : colors.textSecondary,
                  },
                ]}
              >
                {t.nearbyShops}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ProfileDrawerModal
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
