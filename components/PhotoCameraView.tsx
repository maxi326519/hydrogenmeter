import { CameraView as ExpoCameraView } from "expo-camera";
import { PpmRangeDisplay } from "./PpmRangeDisplay";
import { AppRed } from "../constants/Colors";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import React from "react";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Vista de cámara con overlay de datos del sensor para modo foto.
 * Equivalente a VideoRecordingCameraView pero para captura de fotos.
 * La cámara se comparte con el padre (cameraProvidedExternally) para evitar
 * pantalla negra al alternar entre foto y video.
 */
interface PhotoCameraViewProps {
  visible: boolean;
  cameraRef: React.RefObject<ExpoCameraView>;
  gasPpm: number | null;
  ppmDirection: "up" | "down" | null;
  /** Linterna encendida/apagada (enableTorch de expo-camera) */
  enableTorch?: boolean;
  /** Si true, la cámara ya está montada en el padre (evita pantalla negra al alternar modos) */
  cameraProvidedExternally?: boolean;
}

export const PhotoCameraView: React.FC<PhotoCameraViewProps> = ({
  visible,
  cameraRef,
  gasPpm,
  ppmDirection,
  enableTorch = false,
  cameraProvidedExternally = false,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Cámara - omitida cuando ya está montada en MainPage (evita pantalla negra al alternar) */}
      {!cameraProvidedExternally && (
        <ExpoCameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={enableTorch}
          animateShutter={false}
        />
      )}

      {/* Overlay con datos del sensor */}
      <View style={styles.overlay} pointerEvents="none">
        <PpmRangeDisplay
          gasPpm={gasPpm}
          ppmDirection={ppmDirection}
          variant="camera"
        />
        {/* Marca de agua */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>Hydrogen Meter</Text>
          <Text style={styles.watermarkDate}>
            {new Date().toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 1,
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    pointerEvents: "none",
  },
  watermark: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  watermarkText: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  watermarkDate: {
    fontSize: 14,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginTop: 4,
  },
});
