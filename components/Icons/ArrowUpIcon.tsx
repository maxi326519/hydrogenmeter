import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface ArrowUpIconProps {
  size?: number;
  color?: string;
}

export const ArrowUpIcon: React.FC<ArrowUpIconProps> = ({
  size = 24,
  color = '#000000'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.293,1.293a1,1,0,0,1,1.414,0l5,5a1,1,0,0,1-1.414,1.414L13,4.414V22a1,1,0,0,1-2,0V4.414L7.707,7.707A1,1,0,0,1,6.293,6.293Z"
        fill={color}
      />
    </Svg>
  );
};
