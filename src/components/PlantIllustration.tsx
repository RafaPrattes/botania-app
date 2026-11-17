import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Rect,
  Ellipse,
  Circle,
} from 'react-native-svg';

export interface PlantIllustrationProps {
  plantId: string;
  isLowHp: boolean;
  size?: 'small' | 'large';
}

// Componente vetorial que renderiza cada espécie no estilo Studio Ghibli
// e altera cores/inclinação quando a planta está com sede (isLowHp = true)
export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  plantId,
  isLowHp,
  size = 'large',
}) => {
  const dimension = size === 'small' ? 64 : 280;

  // Paleta dinâmica: cores vibrantes quando saudável, tons amarelados/secos quando com sede
  const jiboiaTopColor = isLowHp ? '#8A9A68' : '#5E9A68';
  const jiboiaBottomColor = isLowHp ? '#5B6341' : '#2F5E3B';
  const jiboiaBackLeaf = isLowHp ? '#4E5738' : '#295233';
  const jiboiaStem = isLowHp ? '#6B7348' : '#3E6E48';

  // 1. JIBOIA (Epipremnum aureum) - Ramos pendentes e folhas em coração variegadas
  if (plantId === '1') {
    return (
      <View
        style={[
          styles.container,
          { width: dimension, height: dimension, opacity: isLowHp ? 0.85 : 1 },
        ]}
      >
        <Svg viewBox="0 0 300 320" width="100%" height="100%">
          <Defs>
            <LinearGradient id="potGrad1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#D97B59" />
              <Stop offset="100%" stopColor="#A65236" />
            </LinearGradient>
            <LinearGradient id="leafRich" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={jiboiaTopColor} />
              <Stop offset="100%" stopColor={jiboiaBottomColor} />
            </LinearGradient>
          </Defs>

          {/* Folhagem de fundo */}
          <G
            transform={
              isLowHp
                ? 'translate(0, 10) rotate(4, 150, 160)'
                : 'translate(0, 0)'
            }
          >
            <Path
              d="M120 140 C 80 90, 60 110, 85 150 C 100 165, 120 155, 120 140 Z"
              fill={jiboiaBackLeaf}
            />
            <Path
              d="M180 135 C 225 85, 240 115, 210 150 C 195 165, 180 150, 180 135 Z"
              fill={jiboiaBackLeaf}
            />
            <Path
              d="M150 120 C 130 65, 175 65, 160 120 Z"
              fill={jiboiaTopColor}
            />
          </G>

          {/* Vaso de Terracota */}
          <Path
            d="M100 165 L200 165 L184 250 C182 256 175 260 168 260 L132 260 C125 260 118 256 116 250 Z"
            fill="url(#potGrad1)"
          />
          <Rect
            x="92"
            y="148"
            width="116"
            height="20"
            rx="8"
            fill="#E38968"
            stroke="#9C4B30"
            strokeWidth="2"
          />
          <Path
            d="M112 178 L122 242"
            stroke="#F4A88B"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.45"
          />
          <Ellipse cx="150" cy="150" rx="48" ry="7" fill="#4A3222" />

          {/* Folhas Superiores e Ramos Pendentes */}
          <G
            transform={
              isLowHp
                ? 'translate(0, 12) rotate(6, 150, 155)'
                : 'translate(0, 0)'
            }
          >
            {/* Ramos Pendentes */}
            <Path
              d="M115 155 Q 75 185, 80 235 T 65 305"
              fill="none"
              stroke={jiboiaStem}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <Path
              d="M185 155 Q 215 190, 205 245 T 220 295"
              fill="none"
              stroke={jiboiaStem}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <Path
              d="M148 158 Q 138 195, 145 235"
              fill="none"
              stroke={jiboiaStem}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Folha Topo Central */}
            <G transform="translate(150, 118) rotate(-8)">
              <Path
                d="M0 15 C -25 -15, -45 15, 0 42 C 45 15, 25 -15, 0 15 Z"
                fill="url(#leafRich)"
              />
              <Path
                d="M-5 15 C -18 2, -25 18, -3 32 Z"
                fill="#DCE775"
                opacity="0.75"
              />
            </G>

            {/* Folha Topo Esquerda */}
            <G transform="translate(105, 132) rotate(-35)">
              <Path
                d="M0 12 C -22 -12, -38 12, 0 36 C 38 12, 22 -12, 0 12 Z"
                fill="url(#leafRich)"
              />
              <Path
                d="M-4 14 C -14 4, -20 16, -2 28 Z"
                fill="#E6EE9C"
                opacity="0.8"
              />
            </G>

            {/* Folha Topo Direita */}
            <G transform="translate(192, 130) rotate(30)">
              <Path
                d="M0 12 C -22 -12, -38 12, 0 36 C 38 12, 22 -12, 0 12 Z"
                fill="url(#leafRich)"
              />
              <Path
                d="M5 12 C 15 4, 22 15, 4 27 Z"
                fill="#DCE775"
                opacity="0.7"
              />
            </G>

            {/* Cascata Esquerda */}
            <G transform="translate(88, 185) rotate(-50)">
              <Path
                d="M0 10 C -18 -10, -32 10, 0 32 C 32 10, 18 -10, 0 10 Z"
                fill={jiboiaTopColor}
              />
              <Path
                d="M-3 12 C -10 5, -16 14, -2 24 Z"
                fill="#DCE775"
                opacity="0.85"
              />
            </G>
            <G transform="translate(82, 232) rotate(15)">
              <Path
                d="M0 10 C -18 -10, -30 10, 0 30 C 30 10, 18 -10, 0 10 Z"
                fill="url(#leafRich)"
              />
            </G>
            <G transform="translate(68, 275) rotate(-20)">
              <Path
                d="M0 8 C -15 -8, -26 8, 0 26 C 26 8, 15 -8, 0 8 Z"
                fill={jiboiaTopColor}
              />
            </G>

            {/* Ramo Central */}
            <G transform="translate(142, 182) rotate(12)">
              <Path
                d="M0 10 C -18 -10, -32 10, 0 30 C 32 10, 18 -10, 0 10 Z"
                fill={jiboiaTopColor}
              />
              <Path
                d="M-4 12 C -12 5, -18 14, -2 23 Z"
                fill="#DCE775"
                opacity="0.85"
              />
            </G>
            <G transform="translate(145, 225) rotate(-10)">
              <Path
                d="M0 8 C -15 -8, -26 8, 0 25 C 26 8, 15 -8, 0 8 Z"
                fill={jiboiaBottomColor}
              />
            </G>

            {/* Cascata Direita */}
            <G transform="translate(206, 192) rotate(40)">
              <Path
                d="M0 10 C -18 -10, -30 10, 0 30 C 30 10, 18 -10, 0 10 Z"
                fill="url(#leafRich)"
              />
            </G>
            <G transform="translate(204, 242) rotate(-25)">
              <Path
                d="M0 9 C -16 -9, -28 9, 0 28 C 28 9, 16 -9, 0 9 Z"
                fill={jiboiaTopColor}
              />
            </G>
          </G>
        </Svg>
      </View>
    );
  }

  // 2. SUCULENTA (Echeveria elegans) - Roseta carnuda verde-azulada com pontas rosadas
  if (plantId === '2') {
    const outerAngles = [-75, -50, -25, 0, 25, 50, 75];
    const midAngles = [-60, -30, 0, 30, 60];
    const innerAngles = [-40, -12, 15, 42];

    return (
      <View
        style={[
          styles.container,
          { width: dimension, height: dimension, opacity: isLowHp ? 0.82 : 1 },
        ]}
      >
        <Svg viewBox="0 0 300 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="echeveriaOuter" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E5989B" />
              <Stop offset="25%" stopColor={isLowHp ? '#9BA89C' : '#89B6A5'} />
              <Stop offset="100%" stopColor={isLowHp ? '#68756B' : '#4C7C6D'} />
            </LinearGradient>
            <LinearGradient id="echeveriaInner" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F4ACB7" />
              <Stop offset="30%" stopColor={isLowHp ? '#B0C2B7' : '#A8D5C5'} />
              <Stop offset="100%" stopColor={isLowHp ? '#788C82' : '#659B8A'} />
            </LinearGradient>
            <LinearGradient id="ceramicPot" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F5EBE0" />
              <Stop offset="100%" stopColor="#D5BDAF" />
            </LinearGradient>
          </Defs>

          {/* Tigela de Cerâmica */}
          <Path
            d="M72 185 L228 185 L208 252 C204 260 194 265 182 265 L118 265 C106 265 96 260 92 252 Z"
            fill="url(#ceramicPot)"
            stroke="#C2A896"
            strokeWidth="2"
          />
          <Ellipse
            cx="150"
            cy="185"
            rx="78"
            ry="14"
            fill="#E3D5CA"
            stroke="#C2A896"
            strokeWidth="2"
          />
          <Ellipse cx="150" cy="185" rx="70" ry="10" fill="#6D5442" />

          {/* Roseta da Suculenta */}
          <G
            transform={
              isLowHp ? 'translate(0, 8) scale(0.95)' : 'translate(0, 0)'
            }
          >
            {outerAngles.map((angle, idx) => (
              <G
                key={`outer-${idx}`}
                transform={`translate(150, 178) rotate(${angle})`}
              >
                <Path
                  d="M0 0 C -26 -15, -32 -65, 0 -85 C 32 -65, 26 -15, 0 0 Z"
                  fill="url(#echeveriaOuter)"
                  stroke="#436E60"
                  strokeWidth="1.5"
                />
                <Circle cx="0" cy="-83" r="2.5" fill="#D86C78" />
              </G>
            ))}

            {/* Pétalas Laterais */}
            <Path
              d="M150 178 C 110 198, 70 198, 62 175 C 72 152, 115 158, 150 178 Z"
              fill="url(#echeveriaOuter)"
              stroke="#436E60"
              strokeWidth="1.5"
            />
            <Path
              d="M150 178 C 190 198, 230 198, 238 175 C 228 152, 185 158, 150 178 Z"
              fill="url(#echeveriaOuter)"
              stroke="#436E60"
              strokeWidth="1.5"
            />

            {midAngles.map((angle, idx) => (
              <G
                key={`mid-${idx}`}
                transform={`translate(150, 174) rotate(${angle})`}
              >
                <Path
                  d="M0 0 C -22 -12, -26 -50, 0 -66 C 26 -50, 22 -12, 0 0 Z"
                  fill="url(#echeveriaInner)"
                  stroke="#528273"
                  strokeWidth="1.5"
                />
                <Circle cx="0" cy="-64" r="2" fill="#E07A86" />
              </G>
            ))}

            {innerAngles.map((angle, idx) => (
              <G
                key={`inner-${idx}`}
                transform={`translate(150, 170) rotate(${angle})`}
              >
                <Path
                  d="M0 0 C -16 -10, -18 -34, 0 -45 C 18 -34, 16 -10, 0 0 Z"
                  fill="#B8E2D4"
                  stroke="#659B8A"
                  strokeWidth="1.5"
                />
              </G>
            ))}

            <Circle
              cx="150"
              cy="162"
              r="14"
              fill="#CBECE0"
              stroke="#74A999"
              strokeWidth="1.5"
            />
          </G>
        </Svg>
      </View>
    );
  }

  // 3. KALANCHOE (Kalanchoe blossfeldiana) - Folhas onduladas e buquês de flores de 4 pétalas
  const flowers = [
    { x: 150, y: 65, scale: 1.15, color: '#FF6B6B' },
    { x: 132, y: 74, scale: 1.0, color: '#FF8787' },
    { x: 168, y: 74, scale: 1.0, color: '#FF5252' },
    { x: 105, y: 80, scale: 1.05, color: '#FF6B6B' },
    { x: 92, y: 92, scale: 0.9, color: '#FF8787' },
    { x: 118, y: 92, scale: 0.95, color: '#FA5252' },
    { x: 195, y: 80, scale: 1.05, color: '#FF6B6B' },
    { x: 208, y: 92, scale: 0.9, color: '#FF8787' },
    { x: 182, y: 92, scale: 0.95, color: '#FA5252' },
    { x: 150, y: 86, scale: 1.1, color: '#FF758F' },
  ];

  return (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension, opacity: isLowHp ? 0.85 : 1 },
      ]}
    >
      <Svg viewBox="0 0 300 310" width="100%" height="100%">
        <Defs>
          <LinearGradient id="kalanchoeLeaf" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={isLowHp ? '#748C58' : '#4A8754'} />
            <Stop offset="100%" stopColor={isLowHp ? '#4B5938' : '#234F2C'} />
          </LinearGradient>
          <LinearGradient id="kalanchoePot" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#C96F53" />
            <Stop offset="100%" stopColor="#8F4630" />
          </LinearGradient>
        </Defs>

        {/* Vaso Clássico */}
        <Path
          d="M102 175 L198 175 L182 260 C179 266 173 270 165 270 L135 270 C127 270 121 266 118 260 Z"
          fill="url(#kalanchoePot)"
        />
        <Rect
          x="95"
          y="160"
          width="110"
          height="18"
          rx="6"
          fill="#D97F62"
          stroke="#853F2B"
          strokeWidth="2"
        />

        {/* Folhas e Flores da Kalanchoe */}
        <G
          transform={
            isLowHp
              ? 'translate(0, 10) rotate(5, 150, 170)'
              : 'translate(0, 0)'
          }
        >
          <G transform="translate(115, 165) rotate(-42)">
            <Path
              d="M0 0 C -18 -5, -28 -20, -22 -32 C -26 -44, -15 -56, 0 -64 C 15 -56, 26 -44, 22 -32 C 28 -20, 18 -5, 0 0 Z"
              fill="url(#kalanchoeLeaf)"
              stroke="#B75D48"
              strokeWidth="1.5"
            />
          </G>
          <G transform="translate(185, 165) rotate(42)">
            <Path
              d="M0 0 C -18 -5, -28 -20, -22 -32 C -26 -44, -15 -56, 0 -64 C 15 -56, 26 -44, 22 -32 C 28 -20, 18 -5, 0 0 Z"
              fill="url(#kalanchoeLeaf)"
              stroke="#B75D48"
              strokeWidth="1.5"
            />
          </G>
          <G transform="translate(130, 150) rotate(-20)">
            <Path
              d="M0 0 C -16 -5, -25 -18, -20 -30 C -24 -42, -14 -52, 0 -60 C 14 -52, 24 -42, 20 -30 C 25 -18, 16 -5, 0 0 Z"
              fill="url(#kalanchoeLeaf)"
            />
          </G>
          <G transform="translate(170, 150) rotate(20)">
            <Path
              d="M0 0 C -16 -5, -25 -18, -20 -30 C -24 -42, -14 -52, 0 -60 C 14 -52, 24 -42, 20 -30 C 25 -18, 16 -5, 0 0 Z"
              fill="url(#kalanchoeLeaf)"
            />
          </G>
          <G transform="translate(150, 155)">
            <Path
              d="M0 0 C -16 -5, -24 -18, -18 -28 C -22 -38, -12 -48, 0 -55 C 12 -48, 22 -38, 18 -28 C 24 -18, 16 -5, 0 0 Z"
              fill="url(#kalanchoeLeaf)"
            />
          </G>

          {/* Hastes Florais */}
          <Path
            d="M150 130 L150 72"
            stroke="#4D8757"
            strokeWidth="4"
            strokeLinecap="round"
          />
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

          {/* Cachos de Flores */}
          {flowers.map((fl, i) => (
            <G
              key={`flower-${i}`}
              transform={`translate(${fl.x}, ${fl.y}) scale(${fl.scale})`}
            >
              <Ellipse cx="0" cy="-7" rx="5.5" ry="7" fill={fl.color} />
              <Ellipse cx="0" cy="7" rx="5.5" ry="7" fill={fl.color} />
              <Ellipse cx="-7" cy="0" rx="7" ry="5.5" fill={fl.color} />
              <Ellipse cx="7" cy="0" rx="7" ry="5.5" fill={fl.color} />
              <Circle cx="0" cy="0" r="3" fill="#FFE066" />
            </G>
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PlantIllustration;
