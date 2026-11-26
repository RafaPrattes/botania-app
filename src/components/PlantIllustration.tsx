import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
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

/**
 * Quando salvar seus PNGs estilo Ghibli em assets/ghibli/,
 * descomente as linhas abaixo para ativá-los automaticamente:
 */
const LOCAL_GHIBLI_ASSETS: Partial<Record<PlantArchetype, ImageSourcePropType>> = {
  // pendente: require('../../assets/ghibli/pendente.png'),
  // suculenta: require('../../assets/ghibli/suculenta.png'),
  // cacto: require('../../assets/ghibli/cacto.png'),
  // bonsai: require('../../assets/ghibli/bonsai.png'),
  // flor: require('../../assets/ghibli/flor.png'),
  // folhagem: require('../../assets/ghibli/folhagem.png'),
};

/**
 * Fotografias botânicas aconchegantes por espécie (fallback rico para nunca parecer vazio)
 */
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
  imageUrl,
  isLowHp,
  size = 'large',
}) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const isSmall = size === 'small';
  const boxSize = isSmall ? 64 : 216;

  useEffect(() => {
    if (isSmall) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isSmall, breatheAnim]);

  const translateY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const localArt = LOCAL_GHIBLI_ASSETS[category];
  const resolvedPhotoUri = imageUrl || BOTANICAL_FALLBACK_PHOTOS[category];

  // 1. Arte PNG personalizada do usuário (sem moldura)
  if (localArt) {
    return (
      <Animated.View
        style={[
          styles.artWrapper,
          {
            width: boxSize,
            height: boxSize,
            opacity: isLowHp ? 0.72 : 1,
            transform: isSmall ? [] : [{ translateY }],
          },
        ]}
      >
        <Image source={localArt} style={styles.fullImg} resizeMode="contain" />
      </Animated.View>
    );
  }

  // 2. Retrato botânico acolhedor em moldura estilo caderno de estufa
  return (
    <Animated.View
      style={[
        styles.polaroidFrame,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: isSmall ? 16 : 28,
          padding: isSmall ? 3 : 8,
          transform: isSmall ? [] : [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.imageClip,
          { borderRadius: isSmall ? 13 : 21 },
        ]}
      >
        <Image
          source={{ uri: resolvedPhotoUri }}
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
    justifyContent: 'center',
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