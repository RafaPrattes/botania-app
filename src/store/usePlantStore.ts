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
  streakDays: number;
  lastCareDay?: string;
  chatHistory: ChatMessage[];
  speciesArtCache: Record<string, string>;
  seenTutorials: { home?: boolean; detail?: boolean; ai?: boolean };
  updateProfile: (patch: Partial<GardenerProfile>) => void;
  addPlantsBatch: (newPlants: Omit<Plant, 'id' | 'hp' | 'maxHp'>[]) => Plant[];
  setSpeciesArt: (speciesName: string, fileUri: string) => void;
  waterPlant: (id: string) => void;
  removePlant: (id: string) => void;
  simulateDay: () => void;
  dismissTutorial: (screen: 'home' | 'detail' | 'ai') => void;
  appendChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => boolean;
  resetGarden: () => void;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const usePlantStore = create<PlantStoreState>()(
  persist(
    (set, get) => ({
      profile: {
        name: 'Rafa',
        darkMode: false,
        language: 'pt',
      },
      plants: [],
      xp: 40,
      streakDays: 1,
      lastCareDay: getTodayKey(),
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
            hp: idx === 1 ? 32 : 88,
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
        const today = getTodayKey();
        const stateBefore = get();
        const target = stateBefore.plants.find((p) => p.id === id);

        if (target) {
          scheduleSpeciesWaterReminder(target.name, target.category);
        }

        const nextStreak =
          stateBefore.lastCareDay === today
            ? Math.max(1, stateBefore.streakDays)
            : stateBefore.streakDays + 1;

        set((state) => ({
          plants: state.plants.map((p) =>
            p.id === id ? { ...p, hp: p.maxHp, lastWateredAt: nowIso } : p
          ),
          xp: state.xp + 20,
          streakDays: nextStreak,
          lastCareDay: today,
        }));
      },

      removePlant: (id) =>
        set((state) => ({
          plants: state.plants.filter((p) => p.id !== id),
        })),

      simulateDay: () =>
        set((state) => ({
          plants: state.plants.map((p) => ({
            ...p,
            hp: Math.max(12, p.hp - 28),
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
        const {
          profile,
          plants,
          xp,
          streakDays,
          chatHistory,
          speciesArtCache,
        } = get();
        return JSON.stringify(
          {
            app: 'BotanIA',
            version: '11.0',
            exportedAt: new Date().toISOString(),
            profile,
            plants,
            xp,
            streakDays,
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
            streakDays:
              typeof parsed.streakDays === 'number' ? parsed.streakDays : 1,
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
          streakDays: 1,
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