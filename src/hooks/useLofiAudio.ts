import { useEffect, useState, useCallback } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// 1) Rádio Lo-Fi / Chillhop 24h suave 
//const CHILL_LOFI_STREAM = 'https://streams.ilovemusic.de/iloveradio17.mp3';

const AUDIO_SOURCE = require('../../assets/audio/lofi_cozy.mp3');
//const AUDIO_SOURCE = { uri: CHILL_LOFI_STREAM };

export function useLofiAudio() {
  const player = useAudioPlayer(AUDIO_SOURCE);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
      } catch {
      }
    };
    setupAudio();
  }, []);

  useEffect(() => {
    if (!player) return;
    try {
      player.loop = true;
      player.volume = 0.22; // Volume ambiente fofo e delicado
    } catch {
      // Alguns streams ao vivo ignoram a flag loop
    }
  }, [player]);

  const toggleMusic = useCallback(() => {
    if (!player) return;
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.volume = 0.22;
        player.play();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying, player]);

  return { isPlaying, toggleMusic };
}
