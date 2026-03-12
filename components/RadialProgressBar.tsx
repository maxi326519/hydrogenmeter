import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface RadialProgressBarProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 a 1
  color?: string;
  backgroundColor?: string;
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({
  size = 60,
  strokeWidth = 4,
  progress,
  color = "#F44336",
  backgroundColor = "rgba(255,255,255,0.3)",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Fondo del círculo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Barra de progreso */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
