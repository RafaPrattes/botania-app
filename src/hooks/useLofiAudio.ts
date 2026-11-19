import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Stream AAC estável compatível com ExoPlayer (Android) e AVPlayer (iOS)
const LOFI_STREAM_URL = 'https://streams.ilovemusic.de/iloveradio17.mp3';

export function useLofiAudio() {
  const player = useAudioPlayer(LOFI_STREAM_URL);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => {});
  }, []);

  const toggleLofi = () => {
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch {
      Alert.alert(
        'Áudio Lo-Fi',
        'Não foi possível iniciar a rádio Lo-Fi agora. Verifique sua conexão com a internet.'
      );
      setIsPlaying(false);
    }
  };

  return { isPlaying, toggleLofi };
}