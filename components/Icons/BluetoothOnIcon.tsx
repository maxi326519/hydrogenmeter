import React from "react";
import Svg, { Path } from "react-native-svg";

interface BluetoothOnIconProps {
  size?: number;
  color?: string;
}

export const BluetoothOnIcon: React.FC<BluetoothOnIconProps> = ({
  size = 24,
  color = "#000000",
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 17L17 7L12 2V22L17 17L7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
