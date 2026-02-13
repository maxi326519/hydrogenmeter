import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface CameraIconProps {
  size?: number;
  color?: string;
}

export const CameraIcon: React.FC<CameraIconProps> = ({ 
  size = 24, 
  color = '#000000' 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M28 4h-3l-1-2h-6c-1.1 0-1.5.954-2 2l-1 2H4c-2.2 0-4 1.8-4 4v16c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4zm-14 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"
        fill={color}
      />
    </Svg>
  );
};
