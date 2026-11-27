import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantArchetype } from '../services/plantSpeciesService';
import { normalizeSpeciesKey } from '../services/geminiService';
import { AppLanguage } from '../theme/theme';
import { scheduleSpeciesWaterReminder } from '../utils/wateringSchedule';

export interface Plant {
  id: string;
  name: string;
  species: string;
  category: PlantArchetype;
  location: string;
  imageUrl?: string;
  generatedArtUri?: string;
  hp: number;
  maxHp: number;
  lastWateredAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  imageUri?: string;
  timestamp: string;
}

export interface GardenerProfile {
  name: string;
  avatarUri?: string;
  darkMode: boolean;
  language: AppLanguage;
}

interface PlantStoreState {
  profile: GardenerProfile;
  plants: Plant[];
  xp: number;
  chatHistory: ChatMessage[];
  speciesArtCache: Record<string, string>;
  seenTutorials: { home?: boolean; detail?: boolean; ai?: boolean };
  updateProfile: (patch: Partial<GardenerProfile>) => void;
  addPlantsBatch: (newPlants: Omit<Plant, 'id' | 'hp' | 'maxHp'>[]) => Plant[];
  setSpeciesArt: (speciesName: string, fileUri: string) => void;
  waterPlant: (id: string) => void;
  simulateDay: () => void;
  dismissTutorial: (screen: 'home' | 'detail' | 'ai') => void;
  appendChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => boolean;
  resetGarden: () => void;
}

export const usePlantStore = create<PlantStoreState>()(
  persist(
    (set, get) => ({
      profile: {
        name: 'Jardineiro',
        darkMode: false,
        language: 'pt',
      },
      plants: [],
      xp: 0,
      chatHistory: [],
      speciesArtCache: {},
      seenTutorials: {},

      updateProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch },
        })),

      addPlantsBatch: (newPlants) => {
        const nowIso = new Date().toISOString();
        const cache = get().speciesArtCache;

        const created: Plant[] = newPlants.map((p, idx) => {
          scheduleSpeciesWaterReminder(p.name, p.category);
          const key = normalizeSpeciesKey(p.species || p.name);
          const cachedArt = p.generatedArtUri || cache[key];
          return {
            ...p,
            id: `${Date.now()}-${idx}`,
            generatedArtUri: cachedArt,
            hp: 85,
            maxHp: 100,
            lastWateredAt: nowIso,
          };
        });

        set((state) => ({
          plants: [...state.plants, ...created],
          xp: state.xp + created.length * 15,
        }));

        return created;
      },

      setSpeciesArt: (speciesName, fileUri) => {
        const key = normalizeSpeciesKey(speciesName);
        set((state) => ({
          speciesArtCache: { ...state.speciesArtCache, [key]: fileUri },
          plants: state.plants.map((p) =>
            normalizeSpeciesKey(p.species || p.name) === key ||
            normalizeSpeciesKey(p.name) === key
              ? { ...p, generatedArtUri: fileUri }
              : p
          ),
        }));
      },

      waterPlant: (id) => {
        const nowIso = new Date().toISOString();
        const target = get().plants.find((p) => p.id === id);
        if (target) {
          scheduleSpeciesWaterReminder(target.name, target.category);
        }

        set((state) => ({
          plants: state.plants.map((p) =>
            p.id === id ? { ...p, hp: p.maxHp, lastWateredAt: nowIso } : p
          ),
          xp: state.xp + 10,
        }));
      },

      simulateDay: () =>
        set((state) => ({
          plants: state.plants.map((p) => ({
            ...p,
            hp: Math.max(0, p.hp - 20),
          })),
        })),

      dismissTutorial: (screen) =>
        set((state) => ({
          seenTutorials: { ...state.seenTutorials, [screen]: true },
        })),

      appendChatMessage: (msg) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, msg],
        })),

      clearChatHistory: () => set({ chatHistory: [] }),

      exportBackupJson: () => {
        const { profile, plants, xp, chatHistory, speciesArtCache } = get();
        return JSON.stringify(
          {
            app: 'BotanIA',
            version: '10.0',
            exportedAt: new Date().toISOString(),
            profile,
            plants,
            xp,
            chatHistory,
            speciesArtCache,
          },
          null,
          2
        );
      },

      importBackupJson: (rawJson) => {
        try {
          const parsed = JSON.parse(rawJson);
          if (!parsed || !Array.isArray(parsed.plants)) return false;
          set({
            profile: parsed.profile || get().profile,
            plants: parsed.plants,
            xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
            chatHistory: Array.isArray(parsed.chatHistory)
              ? parsed.chatHistory
              : [],
            speciesArtCache: parsed.speciesArtCache || {},
          });
          return true;
        } catch {
          return false;
        }
      },

      resetGarden: () =>
        set({
          plants: [],
          xp: 0,
          chatHistory: [],
        }),
    }),
    {
      name: 'botania-local-first-v7',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const selectCurrentLevel = (state: PlantStoreState) =>
  Math.floor(state.xp / 100) + 1;

export const selectXpProgress = (state: PlantStoreState) => state.xp % 100;

