import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface ArrowBackIconProps {
  size?: number;
  color?: string;
}

export const ArrowBackIcon: React.FC<ArrowBackIconProps> = ({
  size = 24,
  color = '#000000'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
        fill={color}
      />
    </Svg>
  );
};
