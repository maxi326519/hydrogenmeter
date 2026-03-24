import { CameraView as ExpoCameraView } from 'expo-camera';
import { View, StyleSheet } from 'react-native';
import React from 'react';

interface CameraViewProps {
  visible: boolean;
  cameraRef: React.RefObject<ExpoCameraView>;
  /** Linterna encendida/apagada (enableTorch de expo-camera) */
  enableTorch?: boolean;
  /** Modo captura: `video` para grabar con recordAsync */
  mode?: "picture" | "video";
  /** Sin audio en el video (no exige permiso de micrófono si es true) */
  mute?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  visible,
  cameraRef,
  enableTorch = false,
  mode = "picture",
  mute = false,
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
        mode={mode}
        mute={mute}
        enableTorch={enableTorch}
        animateShutter={false}
        {...(mode === "video"
          ? {
              /** 1080p 16:9 cuando el dispositivo lo permite; si no, expo elige la máxima disponible. */
              videoQuality: "1080p" as const,
              ratio: "16:9" as const,
              /** iOS: menos trepidación en la grabación. */
              videoStabilizationMode: "standard" as const,
            }
          : {})}
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
