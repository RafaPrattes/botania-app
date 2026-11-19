import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
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

interface PlantIllustrationProps {
  category?: PlantArchetype;
  species?: string;
  isLowHp: boolean;
  size?: 'small' | 'large';
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  category,
  species = '',
  isLowHp,
  size = 'large',
}) => {
  const { width } = useWindowDimensions();
  const largeDim = Math.min(265, Math.round(width * 0.64));
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

  // Apenas as folhas/flores inclinam sutilmente na base do caule (vaso fica imóvel)
  const foliageSkew = breezeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isLowHp ? [2.5, 4.5] : [-2.2, 2.2],
  });

  const resolvedType: PlantArchetype =
    category || inferPlantArchetype(species);

  const leafTop = isLowHp ? '#A8AD68' : '#58A868';
  const leafBottom = isLowHp ? '#6E733D' : '#255935';
  const variegation = isLowHp ? '#DBD38C' : '#E7F5A6';

  // 1. PENDENTE (Jiboia / Samambaia / Hera)
  if (resolvedType === 'pendente') {
    return (
      <View style={{ width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} viewBox="0 0 300 320">
          <Defs>
            <LinearGradient id="potPendente" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#DF825F" />
              <Stop offset="100%" stopColor="#99462B" />
            </LinearGradient>
            <LinearGradient id="leafPendente" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={leafTop} />
              <Stop offset="100%" stopColor={leafBottom} />
            </LinearGradient>
          </Defs>

          {/* Vaso Fixo */}
          <Ellipse cx="150" cy="264" rx="58" ry="10" fill="rgba(44,30,20,0.22)" />
          <Path d="M98 166 L202 166 L185 252 C183 259 176 263 168 263 L132 263 C124 263 117 259 115 252 Z" fill="url(#potPendente)" />
          <Rect x="90" y="147" width="120" height="21" rx="9" fill="#E89171" stroke="#94442A" strokeWidth="2" />
          <Ellipse cx="150" cy="149" rx="50" ry="7" fill="#462E1E" />

          {/* Apenas Folhas e Ramos se Movem */}
          <AnimatedG rotation={foliageSkew} origin="150, 152">
            <Path d="M114 156 Q 72 188, 78 238 T 62 308" fill="none" stroke={leafBottom} strokeWidth="4.5" strokeLinecap="round" />
            <Path d="M186 156 Q 218 192, 206 248 T 222 298" fill="none" stroke={leafBottom} strokeWidth="4.5" strokeLinecap="round" />
            <Path d="M148 158 Q 136 196, 145 238" fill="none" stroke={leafTop} strokeWidth="4" strokeLinecap="round" />

            {[
              { x: 150, y: 112, r: -6, s: 1.05 },
              { x: 103, y: 130, r: -36, s: 0.9 },
              { x: 194, y: 128, r: 32, s: 0.9 },
              { x: 86, y: 186, r: -48, s: 0.8 },
              { x: 80, y: 234, r: 14, s: 0.78 },
              { x: 66, y: 278, r: -20, s: 0.68 },
              { x: 141, y: 184, r: 12, s: 0.8 },
              { x: 207, y: 194, r: 38, s: 0.8 },
              { x: 205, y: 245, r: -24, s: 0.72 },
            ].map((lf, idx) => (
              <G key={idx} transform={`translate(${lf.x}, ${lf.y}) rotate(${lf.r}) scale(${lf.s})`}>
                <Path d="M0 15 C -26 -15, -45 15, 0 44 C 45 15, 26 -15, 0 15 Z" fill="url(#leafPendente)" />
                <Path d="M-5 15 C -18 3, -25 18, -3 32 Z" fill={variegation} opacity="0.8" />
              </G>
            ))}
          </AnimatedG>
        </Svg>
      </View>
    );
  }

  // 2. SUCULENTA (Echeveria / Babosa / Jade)
  if (resolvedType === 'suculenta') {
    return (
      <View style={{ width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} viewBox="0 0 300 300">
          <Defs>
            <LinearGradient id="sucOuter" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={isLowHp ? '#B89B82' : '#EE8B94'} />
              <Stop offset="25%" stopColor={isLowHp ? '#97A37E' : '#7EC0AC'} />
              <Stop offset="100%" stopColor={isLowHp ? '#65704F' : '#3F7866'} />
            </LinearGradient>
            <LinearGradient id="bowlGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFF7EE" />
              <Stop offset="100%" stopColor="#D6BDA9" />
            </LinearGradient>
          </Defs>

          {/* Tigela Fixa */}
          <Ellipse cx="150" cy="266" rx="68" ry="10" fill="rgba(44,30,20,0.2)" />
          <Path d="M70 185 L230 185 L210 253 C206 261 195 266 182 266 L118 266 C105 266 94 261 90 253 Z" fill="url(#bowlGrad)" stroke="#C2A896" strokeWidth="2" />
          <Ellipse cx="150" cy="185" rx="80" ry="14" fill="#EBDDD3" stroke="#C2A896" strokeWidth="2" />
          <Ellipse cx="150" cy="185" rx="71" ry="10" fill="#6B5240" />

          {/* Roseta com leve movimento */}
          <AnimatedG rotation={foliageSkew} origin="150, 178">
            {[-75, -50, -25, 0, 25, 50, 75].map((angle, idx) => (
              <G key={`o-${idx}`} transform={`translate(150, 178) rotate(${angle})`}>
                <Path d="M0 0 C -27 -15, -33 -66, 0 -87 C 33 -66, 27 -15, 0 0 Z" fill="url(#sucOuter)" stroke="#3D6B5D" strokeWidth="1.5" />
                <Circle cx="0" cy="-85" r="2.8" fill="#E06C78" />
              </G>
            ))}
            {[-45, -15, 15, 45].map((angle, idx) => (
              <G key={`i-${idx}`} transform={`translate(150, 172) rotate(${angle})`}>
                <Path d="M0 0 C -18 -11, -20 -42, 0 -55 C 20 -42, 18 -11, 0 0 Z" fill={isLowHp ? '#B5BE9B' : '#B8EBDA'} stroke="#589180" strokeWidth="1.5" />
                <Circle cx="0" cy="-53" r="2.2" fill="#E8828E" />
              </G>
            ))}
            <Circle cx="150" cy="160" r="15" fill={isLowHp ? '#C3CCA8' : '#D2F5E9'} stroke="#6EA695" strokeWidth="1.5" />
          </AnimatedG>
        </Svg>
      </View>
    );
  }

  // 3. CACTO
  if (resolvedType === 'cacto') {
    const cactusBody = isLowHp ? '#9AA368' : '#53A364';
    const cactusDark = isLowHp ? '#6E7544' : '#327341';
    return (
      <View style={{ width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
          <Defs>
            <LinearGradient id="cactusGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={cactusBody} />
              <Stop offset="100%" stopColor={cactusDark} />
            </LinearGradient>
            <LinearGradient id="cactusPot" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#ECA055" />
              <Stop offset="100%" stopColor="#BA6524" />
            </LinearGradient>
          </Defs>

          {/* Vaso Fixo */}
          <Ellipse cx="150" cy="272" rx="58" ry="9" fill="rgba(44,30,20,0.22)" />
          <Path d="M100 182 L200 182 L184 264 C181 269 175 272 167 272 L133 272 C125 272 119 269 116 264 Z" fill="url(#cactusPot)" />
          <Rect x="93" y="166" width="114" height="19" rx="8" fill="#F4B26C" stroke="#AD5B1C" strokeWidth="2" />
          <Ellipse cx="150" cy="168" rx="48" ry="7" fill="#C9A87C" />

          {/* Corpo do Cacto */}
          <AnimatedG rotation={foliageSkew} origin="150, 172">
            <Path d="M128 135 L104 135 C92 135, 88 126, 88 115 L88 86 C88 73, 108 73, 108 86 L108 114 L128 114 Z" fill="url(#cactusGrad)" stroke="#2A5E37" strokeWidth="2" />
            <Path d="M172 122 L196 122 C208 122, 212 113, 212 102 L212 78 C212 65, 192 65, 192 78 L192 102 L172 102 Z" fill="url(#cactusGrad)" stroke="#2A5E37" strokeWidth="2" />
            <Rect x="126" y="46" width="48" height="132" rx="24" fill="url(#cactusGrad)" stroke="#2A5E37" strokeWidth="2.2" />
            <Path d="M142 54 L142 170 M158 54 L158 170" stroke="#7AD18C" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
            {[68, 92, 116, 140].map((yPos, i) => (
              <G key={i}>
                <Circle cx="134" cy={yPos} r="2" fill="#FFF8DC" />
                <Circle cx="150" cy={yPos + 10} r="2" fill="#FFF8DC" />
                <Circle cx="166" cy={yPos} r="2" fill="#FFF8DC" />
              </G>
            ))}
            <G transform="translate(152, 42)">
              <Circle cx="-6" cy="0" r="6" fill={isLowHp ? '#D99B9B' : '#FF6B8B'} />
              <Circle cx="6" cy="0" r="6" fill={isLowHp ? '#D99B9B' : '#FF6B8B'} />
              <Circle cx="0" cy="-6" r="6" fill={isLowHp ? '#E3B0B0' : '#FF8FA8'} />
              <Circle cx="0" cy="0" r="4" fill="#FFD43B" />
            </G>
          </AnimatedG>
        </Svg>
      </View>
    );
  }

  // 4. BONSAI
  if (resolvedType === 'bonsai') {
    const canopyMain = isLowHp ? '#8F9958' : '#3B8A4E';
    const canopyLight = isLowHp ? '#AEB874' : '#63B576';
    return (
      <View style={{ width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
          <Defs>
            <LinearGradient id="bonsaiTray" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#4A6B82" />
              <Stop offset="100%" stopColor="#283E4F" />
            </LinearGradient>
          </Defs>

          {/* Bandeja e Tronco Fixos */}
          <Ellipse cx="150" cy="268" rx="82" ry="9" fill="rgba(44,30,20,0.22)" />
          <Path d="M68 214 L232 214 L218 256 C216 261 210 264 202 264 L98 264 C90 264 84 261 82 256 Z" fill="url(#bonsaiTray)" />
          <Rect x="62" y="204" width="176" height="12" rx="5" fill="#5B8099" stroke="#223542" strokeWidth="1.8" />
          <Ellipse cx="150" cy="204" rx="76" ry="8" fill={isLowHp ? '#8A9156' : '#589C54'} />

          <Path d="M148 205 C 145 175, 118 168, 126 142 C 134 118, 174 115, 166 90" fill="none" stroke="#6E4730" strokeWidth="15" strokeLinecap="round" />
          <Path d="M134 148 Q 102 136, 86 125" fill="none" stroke="#6E4730" strokeWidth="9" strokeLinecap="round" />
          <Path d="M158 124 Q 192 114, 212 106" fill="none" stroke="#6E4730" strokeWidth="8" strokeLinecap="round" />

          {/* Apenas as Copas de Folhas Balançam */}
          <AnimatedG rotation={foliageSkew} origin="150, 110">
            <Ellipse cx="84" cy="118" rx="42" ry="22" fill={canopyMain} />
            <Ellipse cx="80" cy="112" rx="30" ry="14" fill={canopyLight} />
            <Ellipse cx="214" cy="100" rx="40" ry="20" fill={canopyMain} />
            <Ellipse cx="210" cy="94" rx="28" ry="13" fill={canopyLight} />
            <Ellipse cx="156" cy="74" rx="56" ry="28" fill={canopyMain} />
            <Ellipse cx="152" cy="66" rx="42" ry="18" fill={canopyLight} />
          </AnimatedG>
        </Svg>
      </View>
    );
  }

  // 5. FLOR
  if (resolvedType === 'flor') {
    return (
      <View style={{ width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
          <Defs>
            <LinearGradient id="flowerLeaf" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={leafTop} />
              <Stop offset="100%" stopColor={leafBottom} />
            </LinearGradient>
            <LinearGradient id="flowerPot" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#D97B5E" />
              <Stop offset="100%" stopColor="#944730" />
            </LinearGradient>
          </Defs>

          {/* Vaso Fixo */}
          <Ellipse cx="150" cy="272" rx="56" ry="9" fill="rgba(44,30,20,0.22)" />
          <Path d="M101 175 L199 175 L183 261 C180 267 174 271 165 271 L135 271 C126 271 120 267 117 261 Z" fill="url(#flowerPot)" />
          <Rect x="94" y="160" width="112" height="18" rx="6" fill="#E88D70" stroke="#853F2B" strokeWidth="2" />

          {/* Folhas e Flores se Movem */}
          <AnimatedG rotation={foliageSkew} origin="150, 165">
            <G transform="translate(114, 165) rotate(-42)">
              <Path d="M0 0 C -18 -5, -28 -20, -22 -32 C -26 -44, -15 -56, 0 -64 C 15 -56, 26 -44, 22 -32 C 28 -20, 18 -5, 0 0 Z" fill="url(#flowerLeaf)" />
            </G>
            <G transform="translate(186, 165) rotate(42)">
              <Path d="M0 0 C -18 -5, -28 -20, -22 -32 C -26 -44, -15 -56, 0 -64 C 15 -56, 26 -44, 22 -32 C 28 -20, 18 -5, 0 0 Z" fill="url(#flowerLeaf)" />
            </G>
            <Path d="M150 135 L150 70 M150 120 Q 118 104, 106 80 M150 120 Q 182 104, 194 80" fill="none" stroke="#4D8757" strokeWidth="4" strokeLinecap="round" />

            {[
              { x: 150, y: 64, s: 1.2, c: isLowHp ? '#D48A8A' : '#FF5C77' },
              { x: 130, y: 74, s: 1.0, c: isLowHp ? '#DEA0A0' : '#FF8599' },
              { x: 170, y: 74, s: 1.0, c: isLowHp ? '#C97B7B' : '#FF4766' },
              { x: 104, y: 80, s: 1.1, c: isLowHp ? '#D48A8A' : '#FF6B84' },
              { x: 196, y: 80, s: 1.1, c: isLowHp ? '#D48A8A' : '#FF6B84' },
              { x: 150, y: 88, s: 1.1, c: isLowHp ? '#D9919E' : '#FF7A92' },
            ].map((fl, i) => (
              <G key={i} transform={`translate(${fl.x}, ${fl.y}) scale(${fl.s})`}>
                <Ellipse cx="0" cy="-7" rx="6" ry="7.5" fill={fl.c} />
                <Ellipse cx="0" cy="7" rx="6" ry="7.5" fill={fl.c} />
                <Ellipse cx="-7" cy="0" rx="7.5" ry="6" fill={fl.c} />
                <Ellipse cx="7" cy="0" rx="7.5" ry="6" fill={fl.c} />
                <Circle cx="0" cy="0" r="3.2" fill="#FFE066" />
              </G>
            ))}
          </AnimatedG>
        </Svg>
      </View>
    );
  }

  // 6. FOLHAGEM TROPICAL (Costela-de-Adão / Zamioculca / Ficus)
  return (
    <View style={{ width: dimension, height: dimension }}>
      <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
        <Defs>
          <LinearGradient id="foliageLeaf" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={leafTop} />
            <Stop offset="100%" stopColor={leafBottom} />
          </LinearGradient>
          <LinearGradient id="sagePot" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#7DA88E" />
            <Stop offset="100%" stopColor="#466E56" />
          </LinearGradient>
        </Defs>

        {/* Vaso Fixo */}
        <Ellipse cx="150" cy="272" rx="58" ry="9" fill="rgba(44,30,20,0.22)" />
        <Path d="M100 178 L200 178 L184 262 C181 268 175 272 167 272 L133 272 C125 272 119 268 116 262 Z" fill="url(#sagePot)" />
        <Rect x="93" y="163" width="114" height="18" rx="8" fill="#92BD9F" stroke="#3D614B" strokeWidth="2" />

        {/* Apenas Folhas se Movem */}
        <AnimatedG rotation={foliageSkew} origin="150, 165">
          <Path d="M150 165 Q 115 125, 95 95" fill="none" stroke="#386942" strokeWidth="5" strokeLinecap="round" />
          <Path d="M150 165 Q 185 125, 205 95" fill="none" stroke="#386942" strokeWidth="5" strokeLinecap="round" />
          <Path d="M150 165 L 150 72" fill="none" stroke="#4D8257" strokeWidth="5.5" strokeLinecap="round" />

          <G transform="translate(150, 62)">
            <Path d="M0 30 C -45 25, -52 -35, 0 -48 C 52 -35, 45 25, 0 30 Z" fill="url(#foliageLeaf)" />
            <Path d="M0 24 L0 -38" stroke="#B9F6CA" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M0 4 L-22 -8 M0 -10 L-18 -22 M0 4 L22 -8 M0 -10 L18 -22" stroke="#B9F6CA" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          </G>
          <G transform="translate(92, 92) rotate(-35)">
            <Path d="M0 24 C -36 20, -42 -28, 0 -38 C 42 -28, 36 20, 0 24 Z" fill="url(#foliageLeaf)" />
            <Path d="M0 18 L0 -30" stroke="#B9F6CA" strokeWidth="2" strokeLinecap="round" />
          </G>
          <G transform="translate(208, 92) rotate(35)">
            <Path d="M0 24 C -36 20, -42 -28, 0 -38 C 42 -28, 36 20, 0 24 Z" fill="url(#foliageLeaf)" />
            <Path d="M0 18 L0 -30" stroke="#B9F6CA" strokeWidth="2" strokeLinecap="round" />
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
};
