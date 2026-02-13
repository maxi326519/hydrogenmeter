import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface ArrowDownIconProps {
  size?: number;
  color?: string;
}

export const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({
  size = 24,
  color = '#000000'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.293,16.707a1,1,0,0,1,1.414-1.414L11,19.586V2a1,1,0,0,1,2,0V19.586l4.293-4.293a1,1,0,0,1,1.414,1.414l-6,6a1,1,0,0,1-1.414,0Z"
        fill={color}
      />
    </Svg>
  );
};
