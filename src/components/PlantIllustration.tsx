import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
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

interface PlantIllustrationProps {
  plantId?: string;
  species?: string;
  isLowHp: boolean;
  size?: 'small' | 'large';
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  plantId,
  species = '',
  isLowHp,
  size = 'large',
}) => {
  const dimension = size === 'small' ? 54 : 270;
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: isLowHp ? 3800 : 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: isLowHp ? 3800 : 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isLowHp, swayAnim]);

  const swayRotate = swayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isLowHp ? ['2deg', '4.5deg'] : ['-2deg', '2deg'],
  });

  const breatheScale = swayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1.02],
  });

  const normalizedSpecies = species.toLowerCase();

  // Identifica qual ilustração renderizar
  const isJiboia =
    plantId === '1' ||
    normalizedSpecies.includes('epipremnum') ||
    normalizedSpecies.includes('jiboia');

  const isSuculenta =
    plantId === '2' ||
    normalizedSpecies.includes('echeveria') ||
    normalizedSpecies.includes('suculenta');

  const isKalanchoe =
    plantId === '3' ||
    normalizedSpecies.includes('kalanchoe');

  // Paleta dinâmica conforme hidratação
  const leafTopColor = isLowHp ? '#A3A864' : '#68A873';
  const leafBottomColor = isLowHp ? '#6B703B' : '#2C5E3B';
  const variegationColor = isLowHp ? '#D6CE87' : '#E6EE9C';

  const renderPlantSvg = () => {
    // 1. JIBOIA (Epipremnum aureum) — Cascata exuberante e folhas variegadas
    if (isJiboia) {
      return (
        <Svg width={dimension} height={dimension} viewBox="0 0 300 320">
          <Defs>
            <LinearGradient id="potTerracotta" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E08260" />
              <stop offset="55%" stopColor="#C46545" />
              <stop offset="100%" stopColor="#94442B" />
            </LinearGradient>
            <LinearGradient id="jiboiaLeafGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={leafTopColor} />
              <Stop offset="100%" stopColor={leafBottomColor} />
            </LinearGradient>
          </Defs>

          {/* Sombra suave do vaso na prateleira */}
          <Ellipse cx="150" cy="264" rx="58" ry="10" fill="rgba(44, 30, 20, 0.22)" />

          {/* Folhagem de profundidade atrás do vaso */}
          <G
            transform={
              isLowHp ? 'translate(0, 10) scale(1, 0.9)' : 'translate(0, 0)'
            }
          >
            <Path
              d="M118 142 C 75 85, 52 110, 82 152 C 98 168, 118 156, 118 142 Z"
              fill={isLowHp ? '#5D6336' : '#234A2E'}
            />
            <Path
              d="M182 138 C 228 82, 246 115, 214 152 C 198 168, 182 152, 182 138 Z"
              fill={isLowHp ? '#5D6336' : '#234A2E'}
            />
            <Path
              d="M150 118 C 128 58, 178 58, 162 118 Z"
              fill={isLowHp ? '#737A43' : '#356942'}
            />
          </G>

          {/* Vaso de Terracota Artesanal */}
          <Path
            d="M98 166 L202 166 L185 252 C183 259 176 263 168 263 L132 263 C124 263 117 259 115 252 Z"
            fill="url(#potTerracotta)"
          />
          {/* Borda superior do vaso */}
          <Rect
            x="90"
            y="147"
            width="120"
            height="21"
            rx="9"
            fill="#E89172"
            stroke="#9C4B30"
            strokeWidth="2"
          />
          {/* Brilho estilo Ghibli na cerâmica */}
          <Path
            d="M111 180 L121 244"
            stroke="#FAD0C0"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* Substrato */}
          <Ellipse cx="150" cy="149" rx="50" ry="7" fill="#462E1E" />

          {/* Ramos Pendentes e Folhas em Coração */}
          <G
            transform={
              isLowHp
                ? 'translate(8, 14) rotate(5, 150, 155)'
                : 'translate(0, 0)'
            }
          >
            {/* Caules pendentes */}
            <Path
              d="M114 156 Q 72 188, 78 238 T 62 308"
              fill="none"
              stroke={isLowHp ? '#6E733E' : '#3B6E46'}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <Path
              d="M186 156 Q 218 192, 206 248 T 222 298"
              fill="none"
              stroke={isLowHp ? '#6E733E' : '#3B6E46'}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <Path
              d="M148 158 Q 136 196, 145 238"
              fill="none"
              stroke={isLowHp ? '#7D8247' : '#4D8558'}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Folha Topo Central */}
            <G transform="translate(150, 114) rotate(-6)">
              <Path
                d="M0 16 C -28 -16, -48 16, 0 46 C 48 16, 28 -16, 0 16 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path d="M0 16 L0 39" stroke="#A5D6A7" strokeWidth="1.5" opacity="0.6" />
              <Path
                d="M-6 16 C -20 2, -27 19, -3 34 Z"
                fill={variegationColor}
                opacity="0.78"
              />
              <Path
                d="M8 19 C 17 10, 22 23, 5 32 Z"
                fill={variegationColor}
                opacity="0.72"
              />
            </G>

            {/* Folha Topo Esquerda */}
            <G transform="translate(103, 130) rotate(-36)">
              <Path
                d="M0 13 C -24 -13, -40 13, 0 38 C 40 13, 24 -13, 0 13 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M-4 14 C -15 4, -22 17, -2 29 Z"
                fill={variegationColor}
                opacity="0.82"
              />
            </G>

            {/* Folha Topo Direita */}
            <G transform="translate(194, 128) rotate(32)">
              <Path
                d="M0 13 C -24 -13, -40 13, 0 38 C 40 13, 24 -13, 0 13 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M5 13 C 16 4, 23 16, 4 28 Z"
                fill={variegationColor}
                opacity="0.75"
              />
            </G>

            {/* Cascata Esquerda */}
            <G transform="translate(86, 186) rotate(-48)">
              <Path
                d="M0 11 C -20 -11, -34 11, 0 34 C 34 11, 20 -11, 0 11 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M-3 12 C -11 5, -17 15, -2 25 Z"
                fill={variegationColor}
                opacity="0.85"
              />
            </G>
            <G transform="translate(80, 234) rotate(14)">
              <Path
                d="M0 10 C -19 -10, -32 10, 0 32 C 32 10, 19 -10, 0 10 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M4 11 C 12 4, 17 14, 3 23 Z"
                fill={variegationColor}
                opacity="0.75"
              />
            </G>
            <G transform="translate(66, 278) rotate(-20)">
              <Path
                d="M0 8 C -16 -8, -27 8, 0 27 C 27 8, 16 -8, 0 8 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M-2 10 C -9 4, -13 12, -1 20 Z"
                fill={variegationColor}
                opacity="0.8"
              />
            </G>

            {/* Ramo Central */}
            <G transform="translate(141, 184) rotate(12)">
              <Path
                d="M0 11 C -19 -11, -33 11, 0 32 C 33 11, 19 -11, 0 11 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M-4 12 C -12 5, -18 14, -2 24 Z"
                fill={variegationColor}
                opacity="0.85"
              />
            </G>
            <G transform="translate(145, 228) rotate(-10)">
              <Path
                d="M0 9 C -16 -9, -27 9, 0 26 C 27 9, 16 -9, 0 9 Z"
                fill="url(#jiboiaLeafGrad)"
              />
            </G>

            {/* Cascata Direita */}
            <G transform="translate(207, 194) rotate(38)">
              <Path
                d="M0 10 C -19 -10, -32 10, 0 32 C 32 10, 19 -10, 0 10 Z"
                fill="url(#jiboiaLeafGrad)"
              />
              <Path
                d="M4 11 C 12 4, 17 14, 3 23 Z"
                fill={variegationColor}
                opacity="0.8"
              />
            </G>
            <G transform="translate(205, 245) rotate(-24)">
              <Path
                d="M0 9 C -17 -9, -29 9, 0 29 C 29 9, 17 -9, 0 9 Z"
                fill="url(#jiboiaLeafGrad)"
              />
            </G>
          </G>
        </Svg>
      );
    }

    // 2. SUCULENTA (Echeveria elegans) — Roseta simétrica verde-azulada com pontas rosadas
    if (isSuculenta) {
      const petalOuterStart = isLowHp ? '#B89B82' : '#E8999E';
      const petalOuterMid = isLowHp ? '#97A37E' : '#8AB8A8';
      const petalOuterEnd = isLowHp ? '#65704F' : '#497A6B';

      return (
        <Svg width={dimension} height={dimension} viewBox="0 0 300 300">
          <Defs>
            <LinearGradient id="echeveriaOuterGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={petalOuterStart} />
              <Stop offset="24%" stopColor={petalOuterMid} />
              <Stop offset="100%" stopColor={petalOuterEnd} />
            </LinearGradient>
            <LinearGradient id="echeveriaInnerGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={isLowHp ? '#C7AE95' : '#F5B0BA'} />
              <Stop offset="30%" stopColor={isLowHp ? '#ABB592' : '#AAD8C8'} />
              <Stop offset="100%" stopColor={isLowHp ? '#75825E' : '#639988'} />
            </LinearGradient>
            <LinearGradient id="ceramicBowlGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FAF3EB" />
              <Stop offset="100%" stopColor="#D6BFAE" />
            </LinearGradient>
          </Defs>

          {/* Sombra na prateleira */}
          <Ellipse cx="150" cy="266" rx="68" ry="10" fill="rgba(44, 30, 20, 0.2)" />

          {/* Tigela baixa de cerâmica artesanal */}
          <Path
            d="M70 185 L230 185 L210 253 C206 261 195 266 182 266 L118 266 C105 266 94 261 90 253 Z"
            fill="url(#ceramicBowlGrad)"
            stroke="#C2A896"
            strokeWidth="2"
          />
          <Path
            d="M83 216 Q 150 230, 217 216"
            fill="none"
            stroke="#B59886"
            strokeWidth="3"
            strokeDasharray="8 6"
          />
          <Ellipse
            cx="150"
            cy="185"
            rx="80"
            ry="14"
            fill="#E6D8CE"
            stroke="#C2A896"
            strokeWidth="2"
          />
          <Ellipse cx="150" cy="185" rx="71" ry="10" fill="#6B5240" />

          {/* Roseta da Echeveria */}
          <G transform={isLowHp ? 'translate(0, 8) scale(1, 0.92)' : 'translate(0, 0)'}>
            {/* Camada Externa */}
            {[-75, -50, -25, 0, 25, 50, 75].map((angle, idx) => (
              <G key={`outer-${idx}`} transform={`translate(150, 178) rotate(${angle})`}>
                <Path
                  d="M0 0 C -27 -15, -33 -66, 0 -87 C 33 -66, 27 -15, 0 0 Z"
                  fill="url(#echeveriaOuterGrad)"
                  stroke="#436E60"
                  strokeWidth="1.5"
                />
                <Circle cx="0" cy="-85" r="2.6" fill="#D86C78" />
              </G>
            ))}

            {/* Folhas sobre a borda */}
            <Path
              d="M150 178 C 108 199, 68 199, 60 175 C 70 151, 114 158, 150 178 Z"
              fill="url(#echeveriaOuterGrad)"
              stroke="#436E60"
              strokeWidth="1.5"
            />
            <Path
              d="M150 178 C 192 199, 232 199, 240 175 C 230 151, 186 158, 150 178 Z"
              fill="url(#echeveriaOuterGrad)"
              stroke="#436E60"
              strokeWidth="1.5"
            />

            {/* Camada Intermediária */}
            {[-60, -30, 0, 30, 60].map((angle, idx) => (
              <G key={`mid-${idx}`} transform={`translate(150, 174) rotate(${angle})`}>
                <Path
                  d="M0 0 C -22 -12, -26 -51, 0 -67 C 26 -51, 22 -12, 0 0 Z"
                  fill="url(#echeveriaInnerGrad)"
                  stroke="#528273"
                  strokeWidth="1.5"
                />
                <Circle cx="0" cy="-65" r="2.2" fill="#E07A86" />
              </G>
            ))}

            {/* Camada Interna */}
            {[-40, -12, 15, 42].map((angle, idx) => (
              <G key={`inner-${idx}`} transform={`translate(150, 170) rotate(${angle})`}>
                <Path
                  d="M0 0 C -16 -10, -18 -35, 0 -46 C 18 -35, 16 -10, 0 0 Z"
                  fill={isLowHp ? '#B5BE9B' : '#BCE6D8'}
                  stroke="#659B8A"
                  strokeWidth="1.5"
                />
                <Circle cx="0" cy="-44" r="2" fill="#E58C96" />
              </G>
            ))}

            {/* Miolo central */}
            <Circle
              cx="150"
              cy="161"
              r="14"
              fill={isLowHp ? '#C3CCA8' : '#CFF0E4'}
              stroke="#74A999"
              strokeWidth="1.5"
            />
            <Path
              d="M142 161 Q 150 147, 158 161 Q 150 171, 142 161 Z"
              fill="#E5989B"
              opacity="0.65"
            />
          </G>
        </Svg>
      );
    }

    // 3. KALANCHOE (Kalanchoe blossfeldiana) — Folhas onduladas e buquês de flores
    if (isKalanchoe) {
      return (
        <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
          <Defs>
            <LinearGradient id="kalanchoeLeafGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={isLowHp ? '#8F9654' : '#4E8F59'} />
              <Stop offset="100%" stopColor={isLowHp ? '#595E31' : '#224F2B'} />
            </LinearGradient>
            <LinearGradient id="kalanchoePotGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#CE7357" />
              <Stop offset="100%" stopColor="#8F4630" />
            </LinearGradient>
          </Defs>

          <Ellipse cx="150" cy="272" rx="56" ry="9" fill="rgba(44, 30, 20, 0.22)" />

          {/* Vaso Clássico */}
          <Path
            d="M101 175 L199 175 L183 261 C180 267 174 271 165 271 L135 271 C126 271 120 267 117 261 Z"
            fill="url(#kalanchoePotGrad)"
          />
          <Rect
            x="94"
            y="160"
            width="112"
            height="18"
            rx="6"
            fill="#DE8468"
            stroke="#853F2B"
            strokeWidth="2"
          />
          <Path
            d="M113 188 L123 251"
            stroke="#F2AA94"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.45"
          />

          <G
            transform={
              isLowHp
                ? 'translate(8, 12) rotate(5, 150, 170)'
                : 'translate(0, 0)'
            }
          >
            {/* Folhas recortadas */}
            <G transform="translate(114, 165) rotate(-42)">
              <Path
                d="M0 0 C -18 -5, -28 -20, -22 -32 C -26 -44, -15 -56, 0 -64 C 15 -56, 26 -44, 22 -32 C 28 -20, 18 -5, 0 0 Z"
                fill="url(#kalanchoeLeafGrad)"
                stroke="#B75D48"
                strokeWidth="1.5"
              />
              <Path
                d="M0 -5 L0 -54"
                stroke="#76B580"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </G>
            <G transform="translate(186, 165) rotate(42)">
              <Path
                d="M0 0 C -18 -5, -28 -20, -22 -32 C -26 -44, -15 -56, 0 -64 C 15 -56, 26 -44, 22 -32 C 28 -20, 18 -5, 0 0 Z"
                fill="url(#kalanchoeLeafGrad)"
                stroke="#B75D48"
                strokeWidth="1.5"
              />
            </G>
            <G transform="translate(130, 150) rotate(-20)">
              <Path
                d="M0 0 C -16 -5, -25 -18, -20 -30 C -24 -42, -14 -52, 0 -60 C 14 -52, 24 -42, 20 -30 C 25 -18, 16 -5, 0 0 Z"
                fill="url(#kalanchoeLeafGrad)"
              />
            </G>
            <G transform="translate(170, 150) rotate(20)">
              <Path
                d="M0 0 C -16 -5, -25 -18, -20 -30 C -24 -42, -14 -52, 0 -60 C 14 -52, 24 -42, 20 -30 C 25 -18, 16 -5, 0 0 Z"
                fill="url(#kalanchoeLeafGrad)"
              />
            </G>

            {/* Hastes Florais */}
            <Path d="M150 130 L150 72" stroke="#4D8757" strokeWidth="4" strokeLinecap="round" />
            <Path
              d="M150 120 Q 120 105, 108 82"
              fill="none"
              stroke="#4D8757"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <Path
              d="M150 120 Q 180 105, 192 82"
              fill="none"
              stroke="#4D8757"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Cachos de Flores de 4 Pétalas */}
            {[
              { x: 150, y: 65, scale: 1.15, color: isLowHp ? '#D48A8A' : '#FF6B6B' },
              { x: 132, y: 74, scale: 1.0, color: isLowHp ? '#DEA0A0' : '#FF8787' },
              { x: 168, y: 74, scale: 1.0, color: isLowHp ? '#C97B7B' : '#FF5252' },
              { x: 105, y: 80, scale: 1.05, color: isLowHp ? '#D48A8A' : '#FF6B6B' },
              { x: 92, y: 92, scale: 0.9, color: isLowHp ? '#DEA0A0' : '#FF8787' },
              { x: 118, y: 92, scale: 0.95, color: isLowHp ? '#C97B7B' : '#FA5252' },
              { x: 195, y: 80, scale: 1.05, color: isLowHp ? '#D48A8A' : '#FF6B6B' },
              { x: 208, y: 92, scale: 0.9, color: isLowHp ? '#DEA0A0' : '#FF8787' },
              { x: 182, y: 92, scale: 0.95, color: isLowHp ? '#C97B7B' : '#FA5252' },
              { x: 150, y: 86, scale: 1.1, color: isLowHp ? '#D9919E' : '#FF758F' },
            ].map((fl, i) => (
              <G key={`flower-${i}`} transform={`translate(${fl.x}, ${fl.y}) scale(${fl.scale})`}>
                <Ellipse cx="0" cy="-7" rx="5.5" ry="7" fill={fl.color} />
                <Ellipse cx="0" cy="7" rx="5.5" ry="7" fill={fl.color} />
                <Ellipse cx="-7" cy="0" rx="7" ry="5.5" fill={fl.color} />
                <Ellipse cx="7" cy="0" rx="7" ry="5.5" fill={fl.color} />
                <Circle cx="0" cy="0" r="3" fill="#FFE066" />
              </G>
            ))}
          </G>
        </Svg>
      );
    }

    // 4. ESPÉCIE BOTÂNICA GERAL / MONSTERA (Para novas plantas adicionadas no Onboarding)
    return (
      <Svg width={dimension} height={dimension} viewBox="0 0 300 310">
        <Defs>
          <LinearGradient id="monsteraLeaf" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={leafTopColor} />
            <Stop offset="100%" stopColor={leafBottomColor} />
          </LinearGradient>
          <LinearGradient id="sagePot" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#8CA896" />
            <Stop offset="100%" stopColor="#587563" />
          </LinearGradient>
        </Defs>

        <Ellipse cx="150" cy="272" rx="58" ry="9" fill="rgba(44, 30, 20, 0.22)" />

        {/* Vaso Verde Sálvia */}
        <Path
          d="M100 178 L200 178 L184 262 C181 268 175 272 167 272 L133 272 C125 272 119 268 116 262 Z"
          fill="url(#sagePot)"
        />
        <Rect
          x="93"
          y="163"
          width="114"
          height="18"
          rx="8"
          fill="#9EB8A7"
          stroke="#4B6655"
          strokeWidth="2"
        />

        {/* Hastes e Folhas Tropicais */}
        <G
          transform={
            isLowHp ? 'translate(8, 12) rotate(5, 150, 165)' : 'translate(0, 0)'
          }
        >
          <Path d="M150 165 Q 115 125, 95 95" fill="none" stroke="#3E6E48" strokeWidth="5" strokeLinecap="round" />
          <Path d="M150 165 Q 185 125, 205 95" fill="none" stroke="#3E6E48" strokeWidth="5" strokeLinecap="round" />
          <Path d="M150 165 L 150 75" fill="none" stroke="#4D8257" strokeWidth="5.5" strokeLinecap="round" />

          {/* Folha Central Grande */}
          <G transform="translate(150, 62)">
            <Path
              d="M0 30 C -45 25, -52 -35, 0 -48 C 52 -35, 45 25, 0 30 Z"
              fill="url(#monsteraLeaf)"
            />
            <Path d="M0 24 L0 -38" stroke="#A5D6A7" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M0 5 L-22 -8 M0 -10 L-18 -22 M0 5 L22 -8 M0 -10 L18 -22" stroke="#A5D6A7" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
          </G>

          {/* Folha Esquerda */}
          <G transform="translate(92, 92) rotate(-35)">
            <Path
              d="M0 24 C -36 20, -42 -28, 0 -38 C 42 -28, 36 20, 0 24 Z"
              fill="url(#monsteraLeaf)"
            />
            <Path d="M0 18 L0 -30" stroke="#A5D6A7" strokeWidth="2" strokeLinecap="round" />
          </G>

          {/* Folha Direita */}
          <G transform="translate(208, 92) rotate(35)">
            <Path
              d="M0 24 C -36 20, -42 -28, 0 -38 C 42 -28, 36 20, 0 24 Z"
              fill="url(#monsteraLeaf)"
            />
            <Path d="M0 18 L0 -30" stroke="#A5D6A7" strokeWidth="2" strokeLinecap="round" />
          </G>
        </G>
      </Svg>
    );
  };

  return (
    <View style={{ width: dimension, height: dimension, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          transform: [{ rotate: swayRotate }, { scale: breatheScale }],
        }}
      >
        {renderPlantSvg()}
      </Animated.View>
    </View>
  );
};
