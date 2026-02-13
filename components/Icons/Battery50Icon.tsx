import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface Battery50IconProps {
  size?: number;
  color?: string;
}

export const Battery50Icon: React.FC<Battery50IconProps> = ({
  size = 24,
  color = '#000000'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20,10V8.33A1.34,1.34,0,0,0,18.67,7H12V17h6.67A1.34,1.34,0,0,0,20,15.67V14h2V10Z"
        fill={color}
        fillOpacity="0.3"
      />
      <Path
        d="M12,7H3.34A1.34,1.34,0,0,0,2,8.33v7.33A1.34,1.34,0,0,0,3.33,17H12Z"
        fill={color}
      />
    </Svg>
  );
};
