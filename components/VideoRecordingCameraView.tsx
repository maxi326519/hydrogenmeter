import { CameraView as ExpoCameraView } from "expo-camera";
import { ArrowUpIcon, ArrowDownIcon } from "./Icons";
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
      {!cameraProvidedExternally && (
        <ExpoCameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={enableTorch}
          animateShutter={false}
        />
      )}

      {/* Overlay con datos del sensor - mismo layout que modo foto */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Barra de rango 0-10,000 (igual que foto) */}
        <View style={styles.rangeBarContainerCamera}>
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
        {/* Número PPM (igual que foto) */}
        <View style={styles.ppmTopContainer}>
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
        </View>
        {/* Marca de agua - fecha actual al grabar, se actualiza durante la grabación */}
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
  rangeBarContainerCamera: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    paddingBottom: 300,
    zIndex: 25,
    elevation: 25,
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
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
  ppmTopContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 200,
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 26,
    elevation: 26,
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
