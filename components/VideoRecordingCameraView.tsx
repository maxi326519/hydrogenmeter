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

/** Formatea segundos a MM:SS (ej: 65 → "1:05") */
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Vista de cámara con overlay de datos del sensor para modo video.
 * La grabación se hace con react-native-record-screen (grabación de pantalla)
 * desde MainPage, lo que captura correctamente la cámara nativa + overlay.
 */
interface VideoRecordingCameraViewProps {
  visible: boolean;
  cameraRef: React.RefObject<ExpoCameraView>;
  gasPpm: number | null;
  ppmDirection: "up" | "down" | null;
  isRecording?: boolean;
  recordedDuration?: number;
  /** Fecha al iniciar grabación - se muestra en overlay y se actualiza durante la grabación */
  recordingStartDate?: Date | null;
  /** Linterna encendida/apagada (enableTorch de expo-camera) */
  enableTorch?: boolean;
  /** Si true, la cámara ya está montada en el padre (evita pantalla negra al alternar modos) */
  cameraProvidedExternally?: boolean;
}

export const VideoRecordingCameraView: React.FC<VideoRecordingCameraViewProps> = ({
  visible,
  cameraRef,
  gasPpm,
  ppmDirection,
  isRecording = false,
  recordedDuration = 0,
  recordingStartDate = null,
  enableTorch = false,
  cameraProvidedExternally = false,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Cámara - omitida cuando ya está montada en MainPage (evita pantalla negra al alternar) */}
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={enableTorch}
        animateShutter={false}
      />

      {/* Overlay con datos del sensor - mismo layout que modo foto */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Marca de agua - fecha actual al grabar. Debajo del contador cuando se está grabando */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>Hydrogen Meter</Text>
          <Text style={styles.watermarkDate}>
            {(recordingStartDate
              ? new Date(
                recordingStartDate.getTime() + (recordedDuration || 0) * 1000
              )
              : new Date()
            ).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Text>
        </View>
        <PpmRangeDisplay
          gasPpm={gasPpm}
          ppmDirection={ppmDirection}
          variant="camera"
        />
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
  recordingTimerContainer: {
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 100,
    borderRadius: 8,
    gap: 8,
  },
  recordingTimerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
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
  recordingIndicator: {
    position: "absolute",
    top: 60,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppRed,
  },
  recordingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  recordingHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
  },
});
