import { useEffect } from 'react';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';

// Stream livre de batidas Lo-Fi instrumentais suaves
const LOFI_STREAM_URI =
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';

export function useLofiAudio() {
  const player = useAudioPlayer({ uri: LOFI_STREAM_URI });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.35;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, [player]);

  const toggleLofi = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return {
    isPlaying: status.playing,
    toggleLofi,
  };
}