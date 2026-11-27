import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PlantArchetype } from '../services/plantSpeciesService';
import { AppLanguage } from '../theme/theme';

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

export function formatRelativeDate(
  isoDate?: string,
  lang: AppLanguage = 'pt'
): string {
  if (!isoDate) {
    if (lang === 'en') return 'Not watered yet';
    if (lang === 'es') return 'Aún sin regar';
    return 'Ainda não regada';
  }

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    if (lang === 'en') return 'Just now';
    if (lang === 'es') return 'Ahora mismo';
    return 'Agora mesmo';
  }
  if (diffHours < 24) {
    if (lang === 'en') return `${diffHours}h ago`;
    if (lang === 'es') return `Hace ${diffHours}h`;
    return `Há ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    if (lang === 'en') return 'Yesterday';
    if (lang === 'es') return 'Ayer';
    return 'Ontem';
  }
  if (lang === 'en') return `${diffDays} days ago`;
  if (lang === 'es') return `Hace ${diffDays} días`;
  return `Há ${diffDays} dias`;
}

export function getNextWateringLabel(
  category: PlantArchetype,
  lastWateredAt?: string,
  lang: AppLanguage = 'pt'
): string {
  const intervalDays = getWateringIntervalDays(category);
  const base = lastWateredAt ? new Date(lastWateredAt).getTime() : Date.now();
  const nextDate = new Date(base + intervalDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil(
    (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) {
    if (lang === 'en') return 'Today';
    if (lang === 'es') return 'Hoy';
    return 'Hoje';
  }
  if (daysLeft === 1) {
    if (lang === 'en') return 'Tomorrow';
    if (lang === 'es') return 'Mañana';
    return 'Amanhã';
  }

  if (lang === 'en') return `In ${daysLeft} days (${intervalDays}d cycle)`;
  if (lang === 'es') return `En ${daysLeft} días (ciclo de ${intervalDays}d)`;
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
        title: 'BotanIA',
        body: `${plantName} (${days}d)`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: days * 24 * 60 * 60,
        repeats: false,
      },
    });
  } catch {
    // Falha silenciosa no Expo Go
  }
}
