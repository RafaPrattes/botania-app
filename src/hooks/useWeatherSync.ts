import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type WeatherMood = 'sunny' | 'rain' | 'night';

export function useWeatherSync() {
  const [liveMood, setLiveMood] = useState<WeatherMood>(() => {
    const h = new Date().getHours();
    return h >= 18 || h < 6 ? 'night' : 'sunny';
  });
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const { latitude, longitude } = loc.coords;

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code`
        );
        const data = await res.json();
        if (!active || !data?.current) return;

        const temp = Math.round(data.current.temperature_2m);
        const isDay = data.current.is_day === 1;
        const code = Number(data.current.weather_code ?? 0);

        setTemperature(temp);

        // Códigos WMO de chuva / garoa / tempestade: 51–67 e 80–99
        const isRaining = (code >= 51 && code <= 67) || code >= 80;
        if (isRaining) {
          setLiveMood('rain');
        } else if (!isDay) {
          setLiveMood('night');
        } else {
          setLiveMood('sunny');
        }
      } catch {
        // Mantém fallback baseado no relógio do aparelho
      }
    };

    loadWeather();
    return () => {
      active = false;
    };
  }, []);

  return { liveMood, temperature };
}


