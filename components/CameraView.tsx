import { CameraView as ExpoCameraView } from 'expo-camera';
import { View, StyleSheet, Platform } from 'react-native';
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

  /**
   * En modo video, en Android NO hard-codeamos videoQuality/ratio: CameraX
   * elige la mejor combinación que soporta el device. Hard-codear 1080p/16:9
   * en portrait en encoders débiles (ej. Moto G15 / Helio G81 en debug)
   * dispara CameraX ERROR_UNKNOWN al finalizar el recordAsync.
   * En iOS sí los fijamos porque el pipeline aguanta y queda consistente.
   */
  const videoProps =
    mode === "video"
      ? Platform.OS === "ios"
        ? {
            videoQuality: "1080p" as const,
            ratio: "16:9" as const,
            videoStabilizationMode: "standard" as const,
          }
        : {}
      : {};

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
        {...videoProps}
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
