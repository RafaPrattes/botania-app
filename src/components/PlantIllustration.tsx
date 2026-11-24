import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Path,
  Rect,
  Ellipse,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  PlantArchetype,
  inferPlantArchetype,
} from '../services/plantSpeciesService';

const AnimatedG = Animated.createAnimatedComponent(G);


const ghibli: Record<string, any> = {
  jiboia: require('../../assets/ghibli/jiboia.png'),
  suculenta: require('../../assets/ghibli/suculenta.png'),
  cacto: require('../../assets/ghibli/cacto.png'),
  bonsai: require('../../assets/ghibli/bonsai_japones.png'),
  greenhouse: require('../../assets/ghibli/greenhouse_bg.png'),
 //flor: require('../../assets/ghibli/flor.png'),
//folhagem: require('../../assets/ghibli/folhagem.png'),
};
const ghibliAnimations: Partial<Record<PlantArchetype, any>> = {};

interface PlantIllustrationProps {
  category?: PlantArchetype;
  species?: string;
  imageUrl?: string;
  isLowHp: boolean;
  size?: 'small' | 'large';
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  category,
  species = '',
  imageUrl,
  isLowHp,
  size = 'large',
}) => {
  const { width } = useWindowDimensions();
  const largeDim = Math.min(255, Math.round(width * 0.62));
  const dimension = size === 'small' ? 56 : largeDim;

  const breezeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breezeAnim, {
          toValue: 1,
          duration: isLowHp ? 3800 : 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(breezeAnim, {
          toValue: 0,
          duration: isLowHp ? 3800 : 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLowHp, breezeAnim]);

  const foliageSkew = breezeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isLowHp ? [2.5, 4.5] : [-2.2, 2.2],
  });

  const resolvedType: PlantArchetype =
    category || inferPlantArchetype(species);

  // 1. PRIORIDADE MÁXIMA: Asset Ghibli PNG de alta resolução salvo em assets/ghibli/
  const localGhibliPng = ghibli[resolvedType];
  if (localGhibliPng) {
    return (
      <View
        style={{
          width: dimension,
          height: dimension,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLowHp ? 0.78 : 1,
        }}
      >
        <Image
          source={localGhibliPng}
          style={{ width: dimension, height: dimension }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // 2. SEGUNDA PRIORIDADE: Foto Botânica Real retornada pela API (Wikipedia / Perenual)
  if (imageUrl) {
    return (
      <View
        style={[
          size === 'small' ? styles.photoThumbSmall : styles.photoFrameLarge,
          {
            width: size === 'small' ? 54 : dimension * 0.84,
            height: size === 'small' ? 54 : dimension * 0.84,
            opacity: isLowHp ? 0.72 : 1,
          },
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.photoImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 3. FALLBACK VETORIAL (Vaso Fixo + Apenas Folhas se Movem)
  const leafTop = isLowHp ? '#A8AD68' : '#58A868';
  const leafBottom = isLowHp ? '#6E733D' : '#255935';

  return (
    <View style={{ width: dimension, height: dimension }}>
      <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
        <Defs>
          <LinearGradient id="fallbackLeaf" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={leafTop} />
            <Stop offset="100%" stopColor={leafBottom} />
          </LinearGradient>
          <LinearGradient id="fallbackPot" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#DF825F" />
            <Stop offset="100%" stopColor="#99462B" />
          </LinearGradient>
        </Defs>

        {/* Vaso Fixo */}
        <Ellipse cx="150" cy="272" rx="58" ry="9" fill="rgba(44,30,20,0.22)" />
        <Path
          d="M100 178 L200 178 L184 262 C181 268 175 272 167 272 L133 272 C125 272 119 268 116 262 Z"
          fill="url(#fallbackPot)"
        />
        <Rect
          x="93"
          y="163"
          width="114"
          height="18"
          rx="8"
          fill="#E89171"
          stroke="#94442A"
          strokeWidth="2"
        />

        {/* Apenas Folhas se Movem */}
        <AnimatedG rotation={foliageSkew} origin="150, 165">
          <Path
            d="M150 165 Q 115 125, 95 95 M150 165 Q 185 125, 205 95 M150 165 L 150 72"
            fill="none"
            stroke="#386942"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <G transform="translate(150, 62)">
            <Path
              d="M0 30 C -45 25, -52 -35, 0 -48 C 52 -35, 45 25, 0 30 Z"
              fill="url(#fallbackLeaf)"
            />
          </G>
          <G transform="translate(92, 92) rotate(-35)">
            <Path
              d="M0 24 C -36 20, -42 -28, 0 -38 C 42 -28, 36 20, 0 24 Z"
              fill="url(#fallbackLeaf)"
            />
          </G>
          <G transform="translate(208, 92) rotate(35)">
            <Path
              d="M0 24 C -36 20, -42 -28, 0 -38 C 42 -28, 36 20, 0 24 Z"
              fill="url(#fallbackLeaf)"
            />
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  photoThumbSmall: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoFrameLarge: {
    borderRadius: 28,
    borderWidth: 5,
    borderColor: '#FAF6EE',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#244233',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});