import React from "react";
import Svg, { Path } from "react-native-svg";

interface BluetoothSlashIconProps {
  size?: number;
  color?: string;
}

export const BluetoothSlashIcon: React.FC<BluetoothSlashIconProps> = ({
  size = 24,
  color = "#000000",
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 17L12 12M17 17L12 22V12M3 3L12 12M21 21L12 12M14.8252 9.1748L17 7L12 2V6.34961"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
