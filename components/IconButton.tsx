import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  style,
  size = 56,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
