import React from 'react';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

interface Props {
  type: 'bomb' | 'freeze' | 'wild' | 'double';
  size?: number;
  color?: string;
}

export const SpecialBlockIconSVG: React.FC<Props> = ({ type, size = 28, color }) => {
  if (type === 'bomb') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {/* 導線 */}
        <Path d="M20 8 Q24 4 28 6" stroke={color || '#FFD700'} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* 火花 */}
        <Circle cx="28" cy="6" r="2.5" fill={color || '#FF6600'}/>
        {/* 本体 */}
        <Circle cx="15" cy="19" r="11" fill={color || '#333333'}/>
        {/* ハイライト */}
        <Circle cx="11" cy="15" r="3" fill="rgba(255,255,255,0.25)"/>
      </Svg>
    );
  }
  if (type === 'freeze') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {/* 中心軸 */}
        <Line x1="16" y1="4" x2="16" y2="28" stroke={color || '#88DDFF'} strokeWidth="3" strokeLinecap="round"/>
        <Line x1="4" y1="16" x2="28" y2="16" stroke={color || '#88DDFF'} strokeWidth="3" strokeLinecap="round"/>
        <Line x1="7.5" y1="7.5" x2="24.5" y2="24.5" stroke={color || '#88DDFF'} strokeWidth="3" strokeLinecap="round"/>
        <Line x1="24.5" y1="7.5" x2="7.5" y2="24.5" stroke={color || '#88DDFF'} strokeWidth="3" strokeLinecap="round"/>
        {/* 枝 */}
        <Line x1="16" y1="4" x2="13" y2="7" stroke={color || '#88DDFF'} strokeWidth="2" strokeLinecap="round"/>
        <Line x1="16" y1="4" x2="19" y2="7" stroke={color || '#88DDFF'} strokeWidth="2" strokeLinecap="round"/>
        <Line x1="16" y1="28" x2="13" y2="25" stroke={color || '#88DDFF'} strokeWidth="2" strokeLinecap="round"/>
        <Line x1="16" y1="28" x2="19" y2="25" stroke={color || '#88DDFF'} strokeWidth="2" strokeLinecap="round"/>
        {/* 中心 */}
        <Circle cx="16" cy="16" r="3" fill={color || '#FFFFFF'}/>
      </Svg>
    );
  }
  if (type === 'wild') {
    const points = Array.from({ length: 5 }, (_, i) => {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = (i * 72 - 90 + 36) * Math.PI / 180;
      const ox = 16 + 13 * Math.cos(outerAngle);
      const oy = 16 + 13 * Math.sin(outerAngle);
      const ix = 16 + 5.5 * Math.cos(innerAngle);
      const iy = 16 + 5.5 * Math.sin(innerAngle);
      return `${ox},${oy} ${ix},${iy}`;
    }).join(' ');
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Polygon points={points} fill={color || '#FFD700'} stroke={color || '#FFA500'} strokeWidth="1"/>
      </Svg>
    );
  }
  // double: ×2 は SVG テキストで表現
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M4 8 L12 16 M12 8 L4 16"
        stroke={color || '#FFFFFF'}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M17 16 Q17 8 22 8 Q27 8 27 12 Q27 16 22 16 L27 24 L17 24"
        stroke={color || '#FFFFFF'}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
