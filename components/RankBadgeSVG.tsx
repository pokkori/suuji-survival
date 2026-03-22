import React from "react";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

interface RankBadgeSVGProps {
  rank: string;
  size?: number;
}

const RANK_BG_COLORS: Record<string, string> = {
  "S+": "#FF1744", "S": "#FF6D00", "A+": "#2E7D32", "A": "#1B5E20",
  "B+": "#1565C0", "B": "#0D47A1", "C": "#616161", "D": "#37474F",
};
const RANK_BORDER_COLORS: Record<string, string> = {
  "S+": "#FFD700", "S": "#FFD700", "A+": "#69F0AE", "A": "#69F0AE",
  "B+": "#40C4FF", "B": "#40C4FF", "C": "#BDBDBD", "D": "#78909C",
};

export function RankBadgeSVG({ rank, size = 80 }: RankBadgeSVGProps) {
  const bg = RANK_BG_COLORS[rank] ?? "#616161";
  const borderColor = RANK_BORDER_COLORS[rank] ?? "#fff";
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = size * 0.36;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={size * 0.48} fill={bg} stroke={borderColor} strokeWidth="3" />
      <SvgText
        x={cx}
        y={cy + fontSize * 0.36}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={fontSize}
        fontWeight="bold"
      >
        {rank}
      </SvgText>
    </Svg>
  );
}
