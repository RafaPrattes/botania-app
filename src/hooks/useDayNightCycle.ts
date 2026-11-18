import { useState, useEffect } from 'react';

export function useDayNightCycle() {
  const checkIsNight = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  };

  const [isNight, setIsNight] = useState<boolean>(checkIsNight);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNight(checkIsNight());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const toggleDayNight = () => setIsNight((prev) => !prev);

  return { isNight, toggleDayNight };
}
