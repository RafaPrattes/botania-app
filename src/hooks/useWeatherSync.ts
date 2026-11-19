import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain';

export function useWeatherSync() {
  const [weather, setWeather] = useState<WeatherCondition>('clear');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherLabel, setWeatherLabel] = useState<string>('Ensolarado');

  useEffect(() => {
    let mounted = true;

    async function fetchLocalWeather() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = pos.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) return;

        const data = await res.json();
        const code: number = data?.current_weather?.weathercode ?? 0;
        const temp: number | undefined = data?.current_weather?.temperature;

        if (!mounted) return;
        if (typeof temp === 'number') setTemperature(Math.round(temp));

        // Códigos WMO: 51-67 (chuvisco/chuva), 80-82 (pancadas), 95-99 (trovoada)
        if (
          (code >= 51 && code <= 67) ||
          (code >= 80 && code <= 82) ||
          code >= 95
        ) {
          setWeather('rain');
          setWeatherLabel('Chuvoso');
        } else if (code >= 1 && code <= 48) {
          setWeather('cloudy');
          setWeatherLabel('Nublado');
        } else {
          setWeather('clear');
          setWeatherLabel('Céu Limpo');
        }
      } catch {
        // Mantém céu limpo caso offline
      }
    }

    fetchLocalWeather();
    return () => {
      mounted = false;
    };
  }, []);

  return { weather, temperature, weatherLabel };
}
