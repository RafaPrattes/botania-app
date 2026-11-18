import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Plant {
  id: string;
  name: string;
  species: string;
  location: string; // Ex: 'Sala', 'Quarto', 'Varanda', 'Cozinha'
  hp: number;
  maxHp: number;
}

interface PlantStoreState {
  plants: Plant[];
  xp: number;
  hasCompletedOnboarding: boolean;
  addPlant: (plant: Omit<Plant, 'id' | 'hp' | 'maxHp'>) => void;
  waterPlant: (id: string) => void;
  simulateDay: () => void;
  completeOnboarding: (selectedPlants: Omit<Plant, 'id' | 'hp' | 'maxHp'>[]) => void;
  resetOnboarding: () => void;
}

const INITIAL_PLANTS: Plant[] = [
  { id: '1', name: 'Jiboia da Sala', species: 'Epipremnum aureum', location: 'Sala', hp: 30, maxHp: 100 },
  { id: '2', name: 'Suculenta', species: 'Echeveria elegans', location: 'Varanda', hp: 100, maxHp: 100 },
  { id: '3', name: 'Kalanchoe', species: 'Kalanchoe blossfeldiana', location: 'Quarto', hp: 60, maxHp: 100 },
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
              id: String(Date.now() + Math.random()),
              hp: 80,
              maxHp: 100,
            },
          ],
          xp: state.xp + 25,
        })),

      waterPlant: (id: string) =>
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

      completeOnboarding: (selectedPlants) =>
        set((state) => ({
          plants:
            selectedPlants.length > 0
              ? selectedPlants.map((p, idx) => ({
                  ...p,
                  id: String(Date.now() + idx),
                  hp: 85,
                  maxHp: 100,
                }))
              : state.plants,
          xp: state.xp + 50,
          hasCompletedOnboarding: true,
        })),

      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'botania-plant-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const selectCurrentLevel = (state: PlantStoreState) =>
  Math.floor(state.xp / 100) + 1;

export const selectXpProgress = (state: PlantStoreState) => state.xp % 100;
