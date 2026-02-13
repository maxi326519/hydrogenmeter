import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { AppRed } from '../constants/Colors';

interface CameraViewProps {
  visible: boolean;
  onClose: () => void;
  cameraRef: React.RefObject<ExpoCameraView>;
}

export const CameraView: React.FC<CameraViewProps> = ({ visible, onClose, cameraRef }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
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
