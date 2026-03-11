import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import { CameraView as ExpoCameraView } from "expo-camera";
import { AppRed } from "../constants/Colors";
import { ArrowUpIcon, ArrowDownIcon } from "./Icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
}

export const VideoRecordingCameraView: React.FC<VideoRecordingCameraViewProps> = ({
  visible,
  cameraRef,
  gasPpm,
  ppmDirection,
  isRecording = false,
  recordedDuration = 0,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Cámara - se captura correctamente con grabación de pantalla */}
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash="off"
        animateShutter={false}
      />

      {/* Overlay con datos del sensor - se grabará con la pantalla */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Barra de rango */}
        <View style={styles.rangeBarContainer}>
          <View style={styles.rangeBar}>
            <View
              style={[
                styles.rangeBarFill,
                {
                  width: `${Math.min(
                    ((gasPpm !== null ? gasPpm : 0) / 10000) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
        {/* Valor PPM */}
        <View style={styles.ppmContainer}>
          <Text style={styles.ppmValue}>
            {gasPpm !== null ? gasPpm : "--"}
          </Text>
          {gasPpm !== null && ppmDirection === "up" && (
            <View style={styles.ppmArrow}>
              <ArrowUpIcon size={40} color={AppRed} />
            </View>
          )}
          {gasPpm !== null && ppmDirection === "down" && (
            <View style={styles.ppmArrow}>
              <ArrowDownIcon size={40} color={AppRed} />
            </View>
          )}
        </View>
        {/* Marca de agua */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>Hydrogen Meter</Text>
          <Text style={styles.watermarkDate}>
            {new Date().toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {/* Indicador de grabación */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Grabando... {recordedDuration.toFixed(1)}s
            </Text>
            <Text style={styles.recordingHint}>Toca Detener</Text>
          </View>
        )}
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
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  rangeBarContainer: {
    position: "absolute",
    bottom: 200,
    width: "80%",
    maxWidth: 300,
    alignItems: "center",
  },
  rangeBar: {
    width: "100%",
    height: 16,
    backgroundColor: "#444",
    borderRadius: 8,
    overflow: "hidden",
  },
  rangeBarFill: {
    height: "100%",
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  ppmContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ppmValue: {
    fontSize: 72,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  ppmArrow: {
    marginLeft: 12,
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
