import React from "react";
import Svg, { Path } from "react-native-svg";

interface BluetoothIconProps {
  size?: number;
  color?: string;
}

export const BluetoothIcon: React.FC<BluetoothIconProps> = ({
  size = 24,
  color = "#000000",
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 7L18 12L6 17V7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 12L6 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 7L18 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
