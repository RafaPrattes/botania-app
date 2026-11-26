import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { PlantArchetype } from '../services/plantSpeciesService';

interface PlantIllustrationProps {
  category?: PlantArchetype;
  species?: string;
  imageUrl?: string;
  isLowHp: boolean;
  size?: 'small' | 'large';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Descomente APENAS os arquivos que já existem em assets/ghibli/
 */
const LOCAL_GHIBLI_ASSETS: Partial<Record<PlantArchetype, ImageSourcePropType>> = {
  // pendente: require('../../assets/ghibli/pendente.png'),
  suculenta: require('../../assets/ghibli/suculenta.png'),
  cacto: require('../../assets/ghibli/cacto.png'),
  bonsai: require('../../assets/ghibli/bonsai_japones.png'),
  // flor: require('../../assets/ghibli/flor.png'),
  // folhagem: require('../../assets/ghibli/folhagem.png'),
};

const BOTANICAL_FALLBACK_PHOTOS: Record<PlantArchetype, string> = {
  pendente:
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
  suculenta:
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80',
  cacto:
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80',
  bonsai:
    'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80',
  flor:
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
  folhagem:
    'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80',
};

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  category = 'folhagem',
  isLowHp,
  size = 'large',
}) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const isSmall = size === 'small';
  const boxSize = isSmall ? 64 : Math.min(SCREEN_WIDTH * 0.78, 300);

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

  // Movimento suave de escala vertical ancorado próximo à base (efeito de respiração viva)
  const scaleY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.028],
  });

  const localArt = LOCAL_GHIBLI_ASSETS[category];

  if (localArt) {
    return (
      <Animated.View
        style={[
          styles.artWrapper,
          {
            width: boxSize,
            height: boxSize,
            opacity: isLowHp ? 0.74 : 1,
            transform: isSmall ? [] : [{ scaleY }],
          },
        ]}
      >
        <Image source={localArt} style={styles.fullImg} resizeMode="contain" />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.polaroidFrame,
        {
          width: isSmall ? 64 : 230,
          height: isSmall ? 64 : 230,
          borderRadius: isSmall ? 16 : 28,
          padding: isSmall ? 3 : 8,
          transform: isSmall ? [] : [{ scaleY }],
        },
      ]}
    >
      <View style={[styles.imageClip, { borderRadius: isSmall ? 13 : 21 }]}>
        <Image
          source={{ uri: BOTANICAL_FALLBACK_PHOTOS[category] }}
          style={styles.fullImg}
          resizeMode="cover"
        />
        {isLowHp && <View style={styles.thirstyTint} />}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  artWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  polaroidFrame: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1.5,
    borderColor: '#DDD5C5',
    shadowColor: '#1E352B',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  imageClip: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E5DFD2',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  thirstyTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(138, 92, 52, 0.28)',
  },
});
