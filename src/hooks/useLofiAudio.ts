import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

// Stream livre de batidas Lo-Fi instrumentais suaves (ou substitua por require('../../assets/lofi.mp3'))
const LOFI_STREAM_URI =
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';

export function useLofiAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const toggleLofi = async () => {
    try {
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: LOFI_STREAM_URI },
          { shouldPlay: true, isLooping: true, volume: 0.35 }
        );
        soundRef.current = sound;
        setIsPlaying(true);
        return;
      }

      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  return { isPlaying, toggleLofi };
}
