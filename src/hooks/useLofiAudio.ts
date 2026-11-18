import { useEffect } from 'react';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';

// Stream público e estável no ExoPlayer (Android) e AVPlayer (iOS)
const COZY_PIANO_STREAM =
  'https://upload.wikimedia.org/wikipedia/commons/3/35/Erik_Satie_-_Gymnop%C3%A9die_No._1.ogg';

export function useLofiAudio() {
  const player = useAudioPlayer({ uri: COZY_PIANO_STREAM });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.5;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
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
    isBuffering: status.isBuffering,
    toggleLofi,
  };
}