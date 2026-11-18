import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantArchetype, inferPlantArchetype } from '../data/plantCatalog';

export interface Plant {
  id: string;
  name: string;
  species: string;
  category: PlantArchetype;
  location: string;
  hp: number;
  maxHp: number;
}

interface PlantStoreState {
  plants: Plant[];
  xp: number;
  hasCompletedOnboarding: boolean;
  addPlant: (plant: Omit<Plant, 'id' | 'hp' | 'maxHp'>) => void;
  removePlant: (id: string) => void;
  waterPlant: (id: string) => void;
  simulateDay: () => void;
  completeOnboarding: () => void;
  openHomeMenu: () => void;
}

const INITIAL_PLANTS: Plant[] = [
  {
    id: '1',
    name: 'Jiboia da Sala',
    species: 'Epipremnum aureum',
    category: 'pendente',
    location: 'Sala de Estar',
    hp: 30,
    maxHp: 100,
  },
  {
    id: '2',
    name: 'Suculenta Echeveria',
    species: 'Echeveria elegans',
    category: 'suculenta',
    location: 'Janela da Cozinha',
    hp: 100,
    maxHp: 100,
  },
  {
    id: '3',
    name: 'Kalanchoe',
    species: 'Kalanchoe blossfeldiana',
    category: 'flor',
    location: 'Varanda',
    hp: 60,
    maxHp: 100,
  },
];

export const usePlantStore = create<PlantStoreState>()(
  persist(
    (set) => ({
      plants: INITIAL_PLANTS,
      xp: 120,
      hasCompletedOnboarding: false,

      addPlant: (newPlant) =>
        set((state) => ({
          plants: [
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
          ],
          xp: state.xp + 25,
        })),

      removePlant: (id) =>
        set((state) => ({
          plants: state.plants.filter((p) => p.id !== id),
        })),

      waterPlant: (id) =>
        set((state) => ({
          plants: state.plants.map((plant) =>
            plant.id === id ? { ...plant, hp: plant.maxHp } : plant
          ),
          xp: state.xp + 10,
        })),

      simulateDay: () =>
        set((state) => ({
          plants: state.plants.map((plant) => ({
            ...plant,
            hp: Math.max(0, plant.hp - 20),
          })),
        })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      openHomeMenu: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'botania-plant-storage-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const selectCurrentLevel = (state: PlantStoreState) =>
  Math.floor(state.xp / 100) + 1;

export const selectXpProgress = (state: PlantStoreState) => state.xp % 100;

