import { CameraView as ExpoCameraView } from 'expo-camera';
import { View, StyleSheet } from 'react-native';
import React from 'react';

interface CameraViewProps {
  visible: boolean;
  cameraRef: React.RefObject<ExpoCameraView>;
  /** Linterna encendida/apagada (enableTorch de expo-camera) */
  enableTorch?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  visible,
  cameraRef,
  enableTorch = false,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={enableTorch}
        animateShutter={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
