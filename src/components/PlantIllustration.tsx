import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantArchetype } from '../services/plantSpeciesService';

interface PlantIllustrationProps {
  category?: PlantArchetype;
  species?: string;
  generatedArtUri?: string;
  isLowHp: boolean;
  size?: 'small' | 'large';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Descomente APENAS os arquivos PNG que existem na sua pasta assets/ghibli/
 */
export const LOCAL_GHIBLI_ASSETS: Partial<
  Record<PlantArchetype, ImageSourcePropType>
> = {
  pendente: require('../../assets/ghibli/pendente.png'),
  suculenta: require('../../assets/ghibli/suculenta.png'),
  cacto: require('../../assets/ghibli/cacto.png'),
  bonsai: require('../../assets/ghibli/bonsai_japones.png'),
  //flor: require('../../assets/ghibli/flor.png'),
  // folhagem: require('../../assets/ghibli/folhagem.png'),
};

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  category = 'folhagem',
  generatedArtUri,
  isLowHp,
  size = 'large',
}) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const isSmall = size === 'small';
  const boxSize = isSmall ? 62 : Math.min(SCREEN_WIDTH * 0.72, 276);

  useEffect(() => {
    if (isSmall) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isSmall, breatheAnim]);

  const scaleY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.024],
  });

  // 1. Ilustração Ghibli gerada por IA e salva no aparelho (usada na miniatura e no palco)
  if (generatedArtUri) {
    return (
      <Animated.View
        style={[
          isSmall ? styles.smallArtCard : styles.largeGeneratedCard,
          {
            width: isSmall ? boxSize : '100%',
            height: isSmall ? boxSize : '100%',
            opacity: isLowHp ? 0.8 : 1,
            transform: isSmall ? [] : [{ scale: scaleY }],
          },
        ]}
      >
        <Image
          source={{ uri: generatedArtUri }}
          style={styles.fullImg}
          resizeMode="cover"
        />
        {isLowHp && <View style={styles.thirstyTint} />}
      </Animated.View>
    );
  }

  // 2. Arte PNG transparente local (ex: cacto.png, bonsai.png)
  const localArt = LOCAL_GHIBLI_ASSETS[category];
  if (localArt) {
    return (
      <Animated.View
        style={[
          styles.artWrapper,
          {
            width: boxSize,
            height: boxSize,
            opacity: isLowHp ? 0.76 : 1,
            transform: isSmall ? [] : [{ scaleY }],
          },
        ]}
      >
        <Image source={localArt} style={styles.fullImg} resizeMode="contain" />
      </Animated.View>
    );
  }

  // 3. Placeholder botânico suave (nunca quadradão branco!)
  return (
    <View
      style={[
        styles.softPlaceholder,
        {
          width: isSmall ? boxSize : 190,
          height: isSmall ? boxSize : 190,
          borderRadius: isSmall ? 16 : 95,
        },
      ]}
    >
      <Ionicons
        name={isLowHp ? 'leaf-outline' : 'leaf'}
        size={isSmall ? 24 : 58}
        color={isLowHp ? '#B85D43' : '#3A5A40'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  artWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  smallArtCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#25372E',
  },
  largeGeneratedCard: {
    overflow: 'hidden',
  },
  softPlaceholder: {
    backgroundColor: 'rgba(234, 229, 217, 0.86)',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 127, 113, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  thirstyTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(120, 78, 42, 0.25)',
  },
});
