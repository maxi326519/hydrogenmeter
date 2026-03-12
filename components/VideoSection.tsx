import React, { useState, useRef, useCallback, useEffect } from "react";
import { CameraView as ExpoCameraView } from "expo-camera";
import { VideoRecordingCameraView } from "./VideoRecordingCameraView";
import { CameraBar, ModalHeader } from "./modules";
import { RadialProgressBar } from "./RadialProgressBar";
import { Video, ResizeMode } from "expo-av";
import type { VideoRecord } from "../hooks/useVideoStorage";
import { AppRed } from "../constants/Colors";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import TextInput from "./Inputs/TextInput";
import RecordScreen from "react-native-record-screen";

const VIDEO_PROGRESS_MAX_SEC = 60;

export interface VideoSectionProps {
  visible: boolean;
  cameraRef: React.RefObject<ExpoCameraView>;
  gasPpm: number | null;
  ppmDirection: "up" | "down" | null;
  onSwitchToPhoto: () => void;
  createVideoRecord: (
    videoUri: string,
    sensorValue: number | null,
    location?: string
  ) => Promise<VideoRecord>;
  /** Mismo control de audio que foto: alarma (pitido) */
  alarmEnabled: boolean;
  onAudioPress: () => void;
  /** Flash de la cámara */
  flashEnabled: boolean;
  onFlashPress: () => void;
  /** Cambiar a modo foto sin cerrar la cámara (toggle en CameraBar) */
  onSwitchToPhotoMode?: () => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  visible,
  cameraRef,
  gasPpm,
  ppmDirection,
  onSwitchToPhoto,
  createVideoRecord,
  alarmEnabled,
  onAudioPress,
  flashEnabled,
  onFlashPress,
  onSwitchToPhotoMode,
}) => {
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoRecordingDuration, setVideoRecordingDuration] = useState(0);
  const videoRecordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingCancelledRef = useRef(false);
  const [capturedVideoUri, setCapturedVideoUri] = useState<string | null>(null);
  const [videoSensorValue, setVideoSensorValue] = useState<number | null>(null);
  const [videoLocation, setVideoLocation] = useState("");
  const [showVideoFormModal, setShowVideoFormModal] = useState(false);
  const [recordingStartDate, setRecordingStartDate] = useState<Date | null>(null);
  const maxPpmDuringRecordingRef = useRef<number | null>(null);

  // Registrar el máximo PPM durante la grabación (para video se guarda el más alto)
  useEffect(() => {
    if (isVideoRecording && gasPpm !== null) {
      const current = maxPpmDuringRecordingRef.current;
      if (current === null || gasPpm > current) {
        maxPpmDuringRecordingRef.current = gasPpm;
      }
    }
  }, [isVideoRecording, gasPpm]);

  useEffect(() => {
    return () => {
      if (videoRecordingIntervalRef.current) {
        clearInterval(videoRecordingIntervalRef.current);
        videoRecordingIntervalRef.current = null;
      }
    };
  }, []);

  const handleVideoRecordingComplete = useCallback(
    (videoUri: string) => {
      setCapturedVideoUri(videoUri);
      setVideoSensorValue(maxPpmDuringRecordingRef.current ?? gasPpm);
      setShowVideoFormModal(true);
    },
    [gasPpm]
  );

  const handleCancelProcessing = useCallback(() => {
    processingCancelledRef.current = true;
    setIsProcessingVideo(false);
    console.log("[VideoSection] Usuario canceló el procesamiento");
  }, []);

  const handleStartVideoRecording = useCallback(async () => {
    if (isVideoRecording) return;
    try {
      // NO llamar clean() antes de start: borra el directorio de salida y hace que HBRecorder falle.
      // clean() es solo para liberar espacio (Clean Sandbox), no antes de cada grabación.
      const result = await RecordScreen.startRecording({ mic: false });
      if (result === "permission_error") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita permiso para grabar la pantalla."
        );
        return;
      }
      maxPpmDuringRecordingRef.current = gasPpm; // Inicializar para nueva grabación
      setRecordingStartDate(new Date()); // Fecha actual al iniciar grabación
      setIsVideoRecording(true);
      setVideoRecordingDuration(0);
      videoRecordingIntervalRef.current = setInterval(() => {
        setVideoRecordingDuration((d) => d + 0.1);
      }, 100);
    } catch (error) {
      console.error("Error iniciando grabación:", error);
      Alert.alert(
        "Error",
        `No se pudo iniciar la grabación: ${(error as Error).message}`
      );
    }
  }, [isVideoRecording, gasPpm]);

  const handleStopVideoRecording = useCallback(async () => {
    if (!isVideoRecording) return;
    try {
      console.log(1); // NO BORRAR

      if (videoRecordingIntervalRef.current) {
        clearInterval(videoRecordingIntervalRef.current);
        videoRecordingIntervalRef.current = null;
      }
      setIsVideoRecording(false);
      setRecordingStartDate(null);
      setIsProcessingVideo(true);
      processingCancelledRef.current = false;

      console.log(2); // NO BORRAR

      const result = await RecordScreen.stopRecording();

      console.log(3, result); // NO BORRAR

      if (processingCancelledRef.current) return;

      // Documentación: res.result.outputURL
      const typedResult = result as { status?: string; result?: { outputURL?: string } };

      console.log(4, typedResult); // NO BORRAR

      const rawUrl = typedResult?.result?.outputURL;
      if (rawUrl && typeof rawUrl === "string") {
        let videoUri = rawUrl.trim();
        if (!videoUri.startsWith("file://") && !videoUri.startsWith("content://")) {
          videoUri = `file://${videoUri}`;
        }
        handleVideoRecordingComplete(videoUri);
      } else {
        console.warn("[VideoSection] Sin outputURL válido. result:", JSON.stringify(result));
        Alert.alert(
          "Error",
          "No se pudo obtener el video grabado. Verifica los permisos de almacenamiento."
        );
      }
      console.log(5, rawUrl); // NO BORRAR

    } catch (error) {
      console.error("Error deteniendo grabación:", error);
      Alert.alert(
        "Error",
        `No se pudo detener la grabación: ${(error as Error).message}`
      );
    } finally {
      setIsProcessingVideo(false);
    }
  }, [isVideoRecording, handleVideoRecordingComplete]);

  // Pausar/detener grabación automáticamente cuando la barra de progreso llega al final (60 s)
  useEffect(() => {
    if (
      isVideoRecording &&
      videoRecordingDuration >= VIDEO_PROGRESS_MAX_SEC - 0.05
    ) {
      handleStopVideoRecording();
    }
  }, [isVideoRecording, videoRecordingDuration, handleStopVideoRecording]);

  const handleSaveVideo = async () => {
    if (!capturedVideoUri) {
      Alert.alert("Error", "No hay video para guardar");
      return;
    }
    try {
      await createVideoRecord(
        capturedVideoUri,
        videoSensorValue,
        videoLocation || undefined
      );
      Alert.alert("Éxito", "Video guardado correctamente");
      setShowVideoFormModal(false);
      setCapturedVideoUri(null);
      setVideoSensorValue(null);
      setVideoLocation("");
    } catch (error) {
      console.error("Error guardando video:", error);
      Alert.alert("Error", "No se pudo guardar el video. Intenta nuevamente.");
    }
  };

  if (!visible) return null;

  return (
    <>
      <VideoRecordingCameraView
        visible={visible}
        cameraRef={cameraRef}
        gasPpm={gasPpm}
        ppmDirection={ppmDirection}
        isRecording={isVideoRecording}
        recordedDuration={videoRecordingDuration}
        recordingStartDate={recordingStartDate}
        enableTorch={flashEnabled}
        cameraProvidedExternally={true}
      />

      {/* Overlay de procesamiento al detener la grabación */}
      <Modal
        visible={isProcessingVideo}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color={AppRed} />
            <Text style={styles.processingText}>Procesando video...</Text>
            <TouchableOpacity
              style={styles.cancelProcessingButton}
              onPress={handleCancelProcessing}
            >
              <Text style={styles.cancelProcessingButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CameraBar
        mode="video"
        onBack={onSwitchToPhoto}
        alarmEnabled={alarmEnabled}
        onAudioPress={onAudioPress}
        flashEnabled={flashEnabled}
        onFlashPress={onFlashPress}
        onSwitchToPhotoMode={onSwitchToPhotoMode}
        recordButton={
          <TouchableOpacity
            style={[
              styles.captureButton,
              isVideoRecording && styles.captureButtonRecording,
            ]}
            onPress={
              isVideoRecording ? handleStopVideoRecording : handleStartVideoRecording
            }
          >
            {isVideoRecording ? (
              <>
                <RadialProgressBar
                  size={80}
                  strokeWidth={4}
                  progress={Math.min(
                    videoRecordingDuration / VIDEO_PROGRESS_MAX_SEC,
                    1
                  )}
                  color={AppRed}
                  backgroundColor="rgba(255,255,255,0.3)"
                />
                <View style={styles.recordStopIcon} />
              </>
            ) : (
              <View style={styles.recordCircleIcon} />
            )}
          </TouchableOpacity>
        }
        isRecording={isVideoRecording}
      />

      {/* Modal de formulario de video */}
      <Modal
        visible={showVideoFormModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowVideoFormModal(false);
          setCapturedVideoUri(null);
          setVideoSensorValue(null);
          setVideoLocation("");
        }}
      >
        <View style={styles.photoFormModalContainer}>
          <View style={styles.photoFormModalContent}>
            <ModalHeader
              title="Nuevo Video"
              onClose={() => {
                setShowVideoFormModal(false);
                setCapturedVideoUri(null);
                setVideoSensorValue(null);
                setVideoLocation("");
              }}
              showBorder
            />
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.photoFormContainer}>
                {capturedVideoUri && (
                  <View style={styles.videoPreviewContainer}>
                    <Video
                      style={styles.videoPreviewPlayer}
                      source={{ uri: capturedVideoUri }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                    <Text style={styles.videoPreviewText}>Vista previa del video</Text>
                  </View>
                )}
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="sensorValue"
                    label="Valor del Sensor"
                    value={
                      videoSensorValue !== null ? videoSensorValue.toString() : ""
                    }
                    onChange={(name, value) => {
                      const numValue = parseInt(value) || null;
                      setVideoSensorValue(numValue);
                    }}
                    placeholder="Ingrese el valor del sensor"
                    disabled={true}
                    style={styles.darkInput}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="location"
                    label="Ubicación"
                    value={videoLocation}
                    onChange={(name, value) => setVideoLocation(value)}
                    placeholder="Ingrese la ubicación donde se grabó el video"
                    style={styles.darkInput}
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveVideo}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  processingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingContent: {
    backgroundColor: "#2d2d2d",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 16,
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelProcessingButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  cancelProcessingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cameraBackButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  cameraVideoMicButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  captureButtonContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    pointerEvents: "box-none",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
  },
  captureButtonRecording: {
    borderWidth: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderColor: AppRed,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  /** Círculo (anillo) para botón de video en reposo - diferencia del de foto */
  recordCircleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "red",
  },
  /** Cuadrado para indicar stop cuando está grabando (centrado en botón 80x80) */
  recordStopIcon: {
    position: "absolute",
    left: 28,
    top: 28,
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  photoFormModalContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#2d2d2d",
  },
  photoFormModalContent: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#2d2d2d",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppRed,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalScrollView: {
    flex: 1,
  },
  photoFormContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  videoPreviewContainer: {
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: AppRed,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  videoPreviewPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  videoPreviewText: {
    padding: 12,
    fontSize: 14,
    color: AppRed,
    fontWeight: "600",
    textAlign: "center",
  },
  saveButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: AppRed,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  videoViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoViewerCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  videoPlayer: {
    flex: 1,
    width: "100%",
  },
  videoViewerInfo: {
    padding: 16,
    backgroundColor: "#2d2d2d",
  },
  videoViewerInfoLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
});
