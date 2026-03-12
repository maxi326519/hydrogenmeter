import { Svg, Path } from "react-native-svg";
import React from "react";

interface FlashIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export const FlashIcon: React.FC<FlashIconProps> = ({
  size = 24,
  color = "#000000",
  filled = false,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"
        stroke={color}
        strokeWidth={filled ? 0 : 2}
        fill={filled ? color : "none"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
