import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantArchetype, inferPlantArchetype } from '../services/plantSpeciesService';

export interface Plant {
  id: string;
  name: string;
  species: string;
  category: PlantArchetype;
  location: string;
  imageUrl?: string;
  hp: number;
  maxHp: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
}

export type TutorialScreenKey = 'home' | 'detail' | 'ai' | 'onboarding';

interface UserGardenData {
  plants: Plant[];
  xp: number;
  seenTutorials: Record<TutorialScreenKey, boolean>;
}

interface PlantStoreState {
  currentUser: UserAccount | null;
  activeView: 'login' | 'onboarding' | 'app';
  plants: Plant[];
  xp: number;
  seenTutorials: Record<TutorialScreenKey, boolean>;

  loginUser: (name: string, email: string) => Promise<void>;
  logoutUser: () => void;
  setActiveView: (view: 'login' | 'onboarding' | 'app') => void;

  addPlant: (plant: Omit<Plant, 'id' | 'hp' | 'maxHp'>) => void;
  waterPlant: (id: string) => void;
  simulateDay: () => void;
  dismissTutorial: (screen: TutorialScreenKey) => void;
}

const DEFAULT_TUTORIALS: Record<TutorialScreenKey, boolean> = {
  home: false,
  detail: false,
  ai: false,
  onboarding: false,
};

async function persistUserGarden(user: UserAccount | null, data: UserGardenData) {
  if (!user) return;
  try {
    await AsyncStorage.setItem(`botania-garden-${user.id}`, JSON.stringify(data));
  } catch {
    // Falha silenciosa
  }
}

export const usePlantStore = create<PlantStoreState>((set, get) => ({
  currentUser: null,
  activeView: 'login',
  plants: [], // Zero plantas chumbadas: 100% alimentado pelo questionário!
  xp: 0,
  seenTutorials: { ...DEFAULT_TUTORIALS },

  loginUser: async (name: string, email: string) => {
    const normalizedId = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const user: UserAccount = {
      id: normalizedId,
      name: name.trim() || 'Jardineira',
      email: email.trim().toLowerCase(),
    };

    try {
      const savedRaw = await AsyncStorage.getItem(`botania-garden-${user.id}`);
      if (savedRaw) {
        const saved: UserGardenData = JSON.parse(savedRaw);
        const savedPlants = saved.plants || [];
        set({
          currentUser: user,
          plants: savedPlants,
          xp: saved.xp ?? 0,
          seenTutorials: { ...DEFAULT_TUTORIALS, ...(saved.seenTutorials || {}) },
          activeView: savedPlants.length > 0 ? 'app' : 'onboarding',
        });
        return;
      }
    } catch {
      // Novo usuário
    }

    const freshData: UserGardenData = {
      plants: [],
      xp: 0,
      seenTutorials: { ...DEFAULT_TUTORIALS },
    };
    await persistUserGarden(user, freshData);

    set({
      currentUser: user,
      plants: [],
      xp: 0,
      seenTutorials: freshData.seenTutorials,
      activeView: 'onboarding',
    });
  },

  logoutUser: () => {
    set({
      currentUser: null,
      plants: [],
      xp: 0,
      activeView: 'login',
    });
  },

  setActiveView: (view) => set({ activeView: view }),

  addPlant: (newPlant) => {
    const state = get();
    const updatedPlants: Plant[] = [
      ...state.plants,
      {
        ...newPlant,
        category:
          newPlant.category ||
          inferPlantArchetype(`${newPlant.name} ${newPlant.species}`),
        id: Date.now().toString(),
        hp: 80,
        maxHp: 100,
      },
    ];
    const updatedXp = state.xp + 25;
    set({ plants: updatedPlants, xp: updatedXp });
    persistUserGarden(state.currentUser, {
      plants: updatedPlants,
      xp: updatedXp,
      seenTutorials: state.seenTutorials,
    });
  },

  waterPlant: (id) => {
    const state = get();
    const updatedPlants = state.plants.map((p) =>
      p.id === id ? { ...p, hp: p.maxHp } : p
    );
    const updatedXp = state.xp + 10;
    set({ plants: updatedPlants, xp: updatedXp });
    persistUserGarden(state.currentUser, {
      plants: updatedPlants,
      xp: updatedXp,
      seenTutorials: state.seenTutorials,
    });
  },

  simulateDay: () => {
    const state = get();
    const updatedPlants = state.plants.map((p) => ({
      ...p,
      hp: Math.max(0, p.hp - 20),
    }));
    set({ plants: updatedPlants });
    persistUserGarden(state.currentUser, {
      plants: updatedPlants,
      xp: state.xp,
      seenTutorials: state.seenTutorials,
    });
  },

  dismissTutorial: (screen) => {
    const state = get();
    const updatedTutorials = { ...state.seenTutorials, [screen]: true };
    set({ seenTutorials: updatedTutorials });
    persistUserGarden(state.currentUser, {
      plants: state.plants,
      xp: state.xp,
      seenTutorials: updatedTutorials,
    });
  },
}));

export const selectCurrentLevel = (state: PlantStoreState) =>
  Math.floor(state.xp / 100) + 1;

export const selectXpProgress = (state: PlantStoreState) => state.xp % 100;

