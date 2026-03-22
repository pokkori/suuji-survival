import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconType = "shop" | "settings" | "achievements" | "daily" | "ranking" | "share";

interface IconSVGProps {
  type: IconType;
  size?: number;
  color?: string;
}

export function IconSVG({ type, size = 32, color = "#FFFFFF" }: IconSVGProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  switch (type) {
    case "shop":
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={s * 0.15} y={s * 0.35} width={s * 0.7} height={s * 0.5} rx={3} fill="none" stroke={color} strokeWidth="2.5" />
          <Path d={`M${cx - s * 0.18} ${s * 0.35} Q${cx - s * 0.18} ${s * 0.15} ${cx} ${s * 0.15} Q${cx + s * 0.18} ${s * 0.15} ${cx + s * 0.18} ${s * 0.35}`} fill="none" stroke={color} strokeWidth="2.5" />
        </Svg>
      );
    case "settings":
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Circle cx={cx} cy={cy} r={s * 0.15} fill={color} />
          <Circle cx={cx} cy={cy} r={s * 0.28} fill="none" stroke={color} strokeWidth={s * 0.12} strokeDasharray={`${s * 0.15} ${s * 0.08}`} />
          <Circle cx={cx} cy={cy} r={s * 0.35} fill="none" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case "achievements":
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Circle cx={cx} cy={cy + s * 0.1} r={s * 0.28} fill="none" stroke={color} strokeWidth="2.5" />
          <Path d={`M${cx - s * 0.1} ${s * 0.15} L${cx} ${s * 0.05} L${cx + s * 0.1} ${s * 0.15}`} fill="none" stroke={color} strokeWidth="2" />
          <Path d={`M${cx - s * 0.1} ${s * 0.15} L${cx - s * 0.08} ${cy - s * 0.05} M${cx + s * 0.1} ${s * 0.15} L${cx + s * 0.08} ${cy - s * 0.05}`} stroke={color} strokeWidth="2" />
        </Svg>
      );
    case "daily":
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={s * 0.1} y={s * 0.2} width={s * 0.8} height={s * 0.68} rx={3} fill="none" stroke={color} strokeWidth="2.5" />
          <Path d={`M${s * 0.1} ${s * 0.38} L${s * 0.9} ${s * 0.38}`} stroke={color} strokeWidth="2" />
          <Rect x={s * 0.28} y={s * 0.12} width={s * 0.1} height={s * 0.18} rx={2} fill={color} />
          <Rect x={s * 0.62} y={s * 0.12} width={s * 0.1} height={s * 0.18} rx={2} fill={color} />
          <Circle cx={s * 0.3} cy={s * 0.58} r={s * 0.05} fill={color} />
          <Circle cx={s * 0.5} cy={s * 0.58} r={s * 0.05} fill={color} />
          <Circle cx={s * 0.7} cy={s * 0.58} r={s * 0.05} fill={color} />
        </Svg>
      );
    case "ranking":
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={s * 0.1} y={s * 0.5} width={s * 0.2} height={s * 0.38} rx={2} fill={color} />
          <Rect x={s * 0.4} y={s * 0.3} width={s * 0.2} height={s * 0.58} rx={2} fill={color} />
          <Rect x={s * 0.7} y={s * 0.42} width={s * 0.2} height={s * 0.46} rx={2} fill={color} />
        </Svg>
      );
    case "share":
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Circle cx={s * 0.75} cy={s * 0.25} r={s * 0.12} fill={color} />
          <Circle cx={s * 0.75} cy={s * 0.75} r={s * 0.12} fill={color} />
          <Circle cx={s * 0.25} cy={s * 0.5} r={s * 0.12} fill={color} />
          <Path d={`M${s * 0.25} ${s * 0.5} L${s * 0.75} ${s * 0.25}`} stroke={color} strokeWidth="2" />
          <Path d={`M${s * 0.25} ${s * 0.5} L${s * 0.75} ${s * 0.75}`} stroke={color} strokeWidth="2" />
        </Svg>
      );
    default:
      return <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><Circle cx={cx} cy={cy} r={s * 0.4} fill={color} /></Svg>;
  }
}
