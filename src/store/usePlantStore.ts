import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantArchetype } from '../services/plantSpeciesService';

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  imageUri?: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface UserGardenData {
  plants: Plant[];
  xp: number;
  seenTutorials: {
    home?: boolean;
    detail?: boolean;
    ai?: boolean;
  };
  chatHistory: ChatMessage[];
}

interface PlantStoreState {
  currentUser: UserAccount | null;
  plants: Plant[];
  xp: number;
  seenTutorials: {
    home?: boolean;
    detail?: boolean;
    ai?: boolean;
  };
  chatHistory: ChatMessage[];
  loginOrRegister: (
    mode: 'login' | 'register',
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logoutUser: () => void;
  addPlantsBatch: (newPlants: Omit<Plant, 'id' | 'hp' | 'maxHp'>[]) => void;
  waterPlant: (id: string) => void;
  simulateDay: () => void;
  dismissTutorial: (screen: 'home' | 'detail' | 'ai') => void;
  appendChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
}

const ACCOUNTS_INDEX_KEY = 'botania-accounts-index-v1';
const getStorageKey = (userId: string) => `botania-garden-v6-${userId}`;

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: 'welcome-1',
  role: 'ai',
  text: 'Olá! Sou o BotanIA, seu assistente botânico. Envie uma foto da sua planta ou conte o que está acontecendo com as folhas para receber um diagnóstico completo!',
  timestamp: 'Agora',
};

const persistCurrentUserData = async (
  user: UserAccount | null,
  data: UserGardenData
) => {
  if (!user) return;
  try {
    await AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(data));
  } catch (err) {
    console.warn('Erro ao salvar dados do jardim:', err);
  }
};

export const usePlantStore = create<PlantStoreState>((set, get) => ({
  currentUser: null,
  plants: [],
  xp: 0,
  seenTutorials: {},
  chatHistory: [DEFAULT_WELCOME_MSG],

  loginOrRegister: async (mode, rawName, rawEmail, rawPassword) => {
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();
    const name = rawName.trim();

    // Validação estrita
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        ok: false,
        error: 'Digite um e-mail válido (ex: jardineiro@botania.com).',
      };
    }

    if (password.length < 6) {
      return {
        ok: false,
        error: 'A senha precisa ter pelo menos 6 caracteres.',
      };
    }

    if (mode === 'register' && name.length < 2) {
      return {
        ok: false,
        error: 'Informe seu nome ou apelido de jardineiro (mín. 2 letras).',
      };
    }

    try {
      const rawAccounts = await AsyncStorage.getItem(ACCOUNTS_INDEX_KEY);
      const accounts: Record<string, UserAccount> = rawAccounts
        ? JSON.parse(rawAccounts)
        : {};

      const existing = accounts[email];

      if (mode === 'login') {
        if (!existing) {
          return {
            ok: false,
            error:
              'Conta não encontrada. Toque em "Criar conta" para cadastrar seu jardim.',
          };
        }
        if (existing.passwordHash !== password) {
          return {
            ok: false,
            error: 'Senha incorreta. Verifique e tente novamente.',
          };
        }

        const savedRaw = await AsyncStorage.getItem(getStorageKey(existing.id));
        const parsed: UserGardenData = savedRaw
          ? JSON.parse(savedRaw)
          : {
              plants: [],
              xp: 0,
              seenTutorials: {},
              chatHistory: [DEFAULT_WELCOME_MSG],
            };

        set({
          currentUser: existing,
          plants: parsed.plants || [],
          xp: parsed.xp || 0,
          seenTutorials: parsed.seenTutorials || {},
          chatHistory:
            parsed.chatHistory && parsed.chatHistory.length > 0
              ? parsed.chatHistory
              : [DEFAULT_WELCOME_MSG],
        });

        return { ok: true };
      } else {
        if (existing) {
          return {
            ok: false,
            error: 'Este e-mail já está cadastrado. Use a aba "Entrar".',
          };
        }

        const newAccount: UserAccount = {
          id: email.replace(/[^a-z0-9]/g, '_'),
          name,
          email,
          passwordHash: password,
        };

        accounts[email] = newAccount;
        await AsyncStorage.setItem(
          ACCOUNTS_INDEX_KEY,
          JSON.stringify(accounts)
        );

        const initialData: UserGardenData = {
          plants: [],
          xp: 0,
          seenTutorials: {},
          chatHistory: [DEFAULT_WELCOME_MSG],
        };

        await persistCurrentUserData(newAccount, initialData);

        set({
          currentUser: newAccount,
          ...initialData,
        });

        return { ok: true };
      }
    } catch {
      return {
        ok: false,
        error: 'Não foi possível acessar o armazenamento local do aparelho.',
      };
    }
  },

  logoutUser: () => {
    set({
      currentUser: null,
      plants: [],
      xp: 0,
      seenTutorials: {},
      chatHistory: [DEFAULT_WELCOME_MSG],
    });
  },

  addPlantsBatch: (newPlants) => {
    const state = get();
    const created: Plant[] = newPlants.map((p, idx) => ({
      ...p,
      id: `${Date.now()}-${idx}`,
      hp: 80,
      maxHp: 100,
    }));
    const updatedPlants = [...state.plants, ...created];
    const updatedXp = state.xp + created.length * 15;

    set({ plants: updatedPlants, xp: updatedXp });
    persistCurrentUserData(state.currentUser, {
      plants: updatedPlants,
      xp: updatedXp,
      seenTutorials: state.seenTutorials,
      chatHistory: state.chatHistory,
    });
  },

  waterPlant: (id) => {
    const state = get();
    const updatedPlants = state.plants.map((p) =>
      p.id === id ? { ...p, hp: p.maxHp } : p
    );
    const updatedXp = state.xp + 10;

    set({ plants: updatedPlants, xp: updatedXp });
    persistCurrentUserData(state.currentUser, {
      plants: updatedPlants,
      xp: updatedXp,
      seenTutorials: state.seenTutorials,
      chatHistory: state.chatHistory,
    });
  },

  simulateDay: () => {
    const state = get();
    const updatedPlants = state.plants.map((p) => ({
      ...p,
      hp: Math.max(0, p.hp - 20),
    }));

    set({ plants: updatedPlants });
    persistCurrentUserData(state.currentUser, {
      plants: updatedPlants,
      xp: state.xp,
      seenTutorials: state.seenTutorials,
      chatHistory: state.chatHistory,
    });
  },

  dismissTutorial: (screen) => {
    const state = get();
    const updatedTutorials = { ...state.seenTutorials, [screen]: true };

    set({ seenTutorials: updatedTutorials });
    persistCurrentUserData(state.currentUser, {
      plants: state.plants,
      xp: state.xp,
      seenTutorials: updatedTutorials,
      chatHistory: state.chatHistory,
    });
  },

  appendChatMessage: (msg) => {
    const state = get();
    const updatedChat = [...state.chatHistory, msg];
    set({ chatHistory: updatedChat });
    persistCurrentUserData(state.currentUser, {
      plants: state.plants,
      xp: state.xp,
      seenTutorials: state.seenTutorials,
      chatHistory: updatedChat,
    });
  },

  clearChatHistory: () => {
    const state = get();
    const resetChat = [DEFAULT_WELCOME_MSG];
    set({ chatHistory: resetChat });
    persistCurrentUserData(state.currentUser, {
      plants: state.plants,
      xp: state.xp,
      seenTutorials: state.seenTutorials,
      chatHistory: resetChat,
    });
  },
}));

export const selectCurrentLevel = (state: PlantStoreState) =>
  Math.floor(state.xp / 100) + 1;

export const selectXpProgress = (state: PlantStoreState) => state.xp % 100;
