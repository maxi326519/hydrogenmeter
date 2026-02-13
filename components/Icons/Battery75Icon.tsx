import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface Battery75IconProps {
  size?: number;
  color?: string;
}

export const Battery75Icon: React.FC<Battery75IconProps> = ({
  size = 24,
  color = '#000000'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17,7H3.34A1.34,1.34,0,0,0,2,8.33v7.33A1.34,1.34,0,0,0,3.33,17H17Z"
        fill={color}
      />
      <Path
        d="M20,10V8.33A1.34,1.34,0,0,0,18.67,7H17V17h1.67A1.34,1.34,0,0,0,20,15.67V14h2V10Z"
        fill={color}
        fillOpacity="0.3"
      />
    </Svg>
  );
};
