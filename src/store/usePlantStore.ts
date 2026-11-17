// src/store/usePlantStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Plant {
  id: string;
  name: string;
  species: string;
  hp: number;
  maxHp: number;
}

interface PlantStoreState {
  plants: Plant[];
  xp: number;
  waterPlant: (id: string) => void;
  simulateDay: () => void;
}

// Initial greenhouse data (mirrors the web prototype)
const INITIAL_PLANTS: Plant[] = [
  { id: '1', name: 'Jiboia da Sala', species: 'Epipremnum aureum', hp: 20, maxHp: 100 },
  { id: '2', name: 'Suculenta', species: 'Echeveria elegans', hp: 100, maxHp: 100 },
  { id: '3', name: 'Kalanchoe', species: 'Kalanchoe blossfeldiana', hp: 60, maxHp: 100 },
];

const INITIAL_XP = 120;

export const usePlantStore = create<PlantStoreState>()(
  persist(
    (set) => ({
      plants: INITIAL_PLANTS,
      xp: INITIAL_XP,

      // Water a plant: restore full HP and grant +10 XP
      waterPlant: (id: string) =>
        set((state) => ({
          plants: state.plants.map((plant) =>
            plant.id === id ? { ...plant, hp: plant.maxHp } : plant
          ),
          xp: state.xp + 10,
        })),

      // Simulate one day passing: every plant loses 20 HP (never below 0)
      simulateDay: () =>
        set((state) => ({
          plants: state.plants.map((plant) => ({
            ...plant,
            hp: Math.max(0, plant.hp - 20),
          })),
        })),
    }),
    {
      name: 'botania-plant-storage', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Derived selectors (each 100 XP = 1 level)
export const selectCurrentLevel = (state: PlantStoreState) =>
  Math.floor(state.xp / 100) + 1;

export const selectXpProgress = (state: PlantStoreState) => state.xp % 100;