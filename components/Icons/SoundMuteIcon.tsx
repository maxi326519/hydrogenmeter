import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface SoundMuteIconProps {
  size?: number;
  color?: string;
}

export const SoundMuteIcon: React.FC<SoundMuteIconProps> = ({ 
  size = 24, 
  color = '#000000' 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.38,4.08a1,1,0,0,0-1.09.21L6.59,8H4a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2H6.59l3.7,3.71A1,1,0,0,0,11,20a.84.84,0,0,0,.38-.08A1,1,0,0,0,12,19V5A1,1,0,0,0,11.38,4.08Z"
        fill={color}
      />
      <Path
        d="M16,15.5a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42l5-5a1,1,0,0,1,1.42,1.42l-5,5A1,1,0,0,1,16,15.5Z"
        fill={color}
      />
      <Path
        d="M21,15.5a1,1,0,0,1-.71-.29l-5-5a1,1,0,0,1,1.42-1.42l5,5a1,1,0,0,1,0,1.42A1,1,0,0,1,21,15.5Z"
        fill={color}
      />
    </Svg>
  );
};
