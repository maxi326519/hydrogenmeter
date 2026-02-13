import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface FolderIconProps {
  size?: number;
  color?: string;
}

export const FolderIcon: React.FC<FolderIconProps> = ({ 
  size = 24, 
  color = '#000000' 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 -1.5 35 35" fill="none">
      <Path
        d="M8.431 9.155h20.958c2.158 0 2.158-2.238 0.084-2.238h-14.486c-0.83 0-1.244-1.244-1.244-1.244s-0.581-1.825-1.743-1.825h-10.789c-1.576 0-1.162 1.825-1.162 1.825s2.407 20.47 2.573 21.715 1.453 1.612 1.453 1.612l2.821-18.103c0.208-1.327 1.12-1.7 1.535-1.742zM33.658 9.942h-24.563c-0.733 0-1.328 0.594-1.328 1.327l-2.572 16.4c0 0.734 0.595 1.328 1.328 1.328h24.563c0.732 0 1.328-0.594 1.328-1.328l2.572-16.4c0-0.733-0.593-1.327-1.328-1.327z"
        fill={color}
      />
    </Svg>
  );
};
