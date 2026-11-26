import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PlantArchetype } from '../services/plantSpeciesService';

export const WATERING_INTERVAL_DAYS: Record<PlantArchetype, number> = {
  cacto: 14,
  suculenta: 10,
  pendente: 6,
  folhagem: 5,
  flor: 4,
  bonsai: 3,
};

export function getWateringIntervalDays(category: PlantArchetype): number {
  return WATERING_INTERVAL_DAYS[category] ?? 5;
}

export function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return 'Ainda não regada';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Agora mesmo';
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'Ontem' : `Há ${diffDays} dias`;
}

export function getNextWateringLabel(
  category: PlantArchetype,
  lastWateredAt?: string
): string {
  const intervalDays = getWateringIntervalDays(category);
  const base = lastWateredAt ? new Date(lastWateredAt).getTime() : Date.now();
  const nextDate = new Date(base + intervalDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil(
    (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return 'Hoje';
  if (daysLeft === 1) return 'Amanhã';
  return `Em ${daysLeft} dias (ciclo de ${intervalDays}d)`;
}

export async function scheduleSpeciesWaterReminder(
  plantName: string,
  category: PlantArchetype
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const days = getWateringIntervalDays(category);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de cuidar da sua estufa',
        body: `Sua planta ${plantName} completou o ciclo de ${days} dias e pode precisar de água.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: days * 24 * 60 * 60,
        repeats: false,
      },
    });
  } catch {
    // Falha silenciosa no Expo Go caso notificações não estejam disponíveis
  }
}