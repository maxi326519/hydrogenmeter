import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { CameraView as ExpoCameraView, Camera } from "expo-camera";
import { VideoRecordingCameraView } from "./VideoRecordingCameraView";
import { CameraBar, ModalHeader } from "./modules";
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
  Platform,
} from "react-native";
import TextInput from "./Inputs/TextInput";
import * as FileSystem from "expo-file-system";
import { useVideoOverlay } from "../hooks/useVideoOverlay";
import { useSensorOverlayTimeline } from "../hooks/useSensorOverlayTimeline";
import { useVideoSaving } from "../hooks/useVideoSaving";
import { describeError, errorSummary } from "../utils/errorReport";

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
  /** Asigna la acción "Cancelar" mientras dura el overlay FFmpeg (misma lógica que el antiguo cancel). */
  videoProcessingCancelRef?: React.MutableRefObject<(() => void) | null>;
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
  videoProcessingCancelRef,
}) => {
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecordingDuration, setVideoRecordingDuration] = useState(0);
  const videoRecordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRecordingPromiseRef = useRef<
    Promise<{ uri?: string } | undefined> | null
  >(null);
  const processingCancelledRef = useRef(false);
  const [capturedVideoUri, setCapturedVideoUri] = useState<string | null>(null);
  const [videoSensorValue, setVideoSensorValue] = useState<number | null>(null);
  const [videoLocation, setVideoLocation] = useState("");
  const [showVideoFormModal, setShowVideoFormModal] = useState(false);
  const [recordingStartDate, setRecordingStartDate] = useState<Date | null>(null);
  const maxPpmDuringRecordingRef = useRef<number | null>(null);
  const gasPpmRef = useRef<number | null>(gasPpm);
  const { addOverlay } = useVideoOverlay();
  const { startJob: startSavingJob, finishJob: finishSavingJob } = useVideoSaving();
  const processingJobIdRef = useRef<string | null>(null);

  /** Finaliza el job activo de "processing" (idempotente). */
  const finishProcessingJob = useCallback(() => {
    if (processingJobIdRef.current) {
      finishSavingJob(processingJobIdRef.current);
      processingJobIdRef.current = null;
    }
  }, [finishSavingJob]);
  const {
    beginSession: beginOverlaySession,
    endSession: endOverlaySession,
    getElapsedSeconds,
    abortSession: abortOverlaySession,
  } = useSensorOverlayTimeline(isVideoRecording, gasPpm);

  const handleCancelProcessing = useCallback(() => {
    processingCancelledRef.current = true;
    finishProcessingJob();
    console.log("[VideoSection] Usuario canceló el procesamiento");
  }, [finishProcessingJob]);

  useLayoutEffect(() => {
    if (videoProcessingCancelRef) {
      videoProcessingCancelRef.current = handleCancelProcessing;
    }
    return () => {
      if (videoProcessingCancelRef) {
        videoProcessingCancelRef.current = null;
      }
    };
  }, [videoProcessingCancelRef, handleCancelProcessing]);

  useEffect(() => {
    gasPpmRef.current = gasPpm;
  }, [gasPpm]);

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

  /**
   * Verifica cámara y micrófono al momento de grabar. Pide los permisos faltantes
   * (solo si el sistema todavía lo permite). Si alguno queda denegado, muestra
   * alerta y devuelve false; la grabación no debe iniciarse.
   */
  const ensureMediaPermissions = useCallback(async (): Promise<boolean> => {
    const missing: string[] = [];

    const camStatus = await Camera.getCameraPermissionsAsync();
    if (!camStatus.granted) {
      if (camStatus.canAskAgain) {
        const requested = await Camera.requestCameraPermissionsAsync();
        if (!requested.granted) missing.push("cámara");
      } else {
        missing.push("cámara");
      }
    }

    const micStatus = await Camera.getMicrophonePermissionsAsync();
    if (!micStatus.granted) {
      if (micStatus.canAskAgain) {
        const requested = await Camera.requestMicrophonePermissionsAsync();
        if (!requested.granted) missing.push("micrófono");
      } else {
        missing.push("micrófono");
      }
    }

    if (missing.length > 0) {
      const list = missing.join(" y ");
      Alert.alert(
        "Faltan permisos",
        `Para grabar necesitamos acceso a ${list}. Activa los permisos en Ajustes y volvé a intentar.`,
      );
      return false;
    }
    return true;
  }, []);

  const handleStartVideoRecording = useCallback(async () => {
    if (isVideoRecording) return;
    const cam = cameraRef.current;
    if (!cam) {
      Alert.alert(
        "Cámara",
        "La cámara no está lista. Espera un momento e inténtalo de nuevo."
      );
      return;
    }

    const allowed = await ensureMediaPermissions();
    if (!allowed) return;

    try {
      const recordParams = { maxDuration: 600 } as const;
      console.log("[VideoSection] recordAsync(start)", {
        params: recordParams,
        platform: Platform.OS,
        platformVersion: Platform.Version,
        // En Android dejamos que CameraX elija videoQuality/ratio.
        // En iOS forzamos 1080p / 16:9 / stabilization standard.
        cameraConfig:
          Platform.OS === "ios"
            ? { videoQuality: "1080p", ratio: "16:9", videoStabilizationMode: "standard" }
            : "auto (CameraX decide)",
      });
      cameraRecordingPromiseRef.current = cam.recordAsync(recordParams);
      maxPpmDuringRecordingRef.current = gasPpm;
      beginOverlaySession(gasPpm);
      setRecordingStartDate(new Date());
      setIsVideoRecording(true);
      setVideoRecordingDuration(0);
      videoRecordingIntervalRef.current = setInterval(() => {
        setVideoRecordingDuration(getElapsedSeconds());
      }, 100);
    } catch (error) {
      cameraRecordingPromiseRef.current = null;
      console.error(
        "[VideoSection] recordAsync(start) lanzó síncrono:",
        JSON.stringify(describeError(error), null, 2),
      );
      Alert.alert(
        "Error",
        `No se pudo iniciar la grabación: ${errorSummary(error)}`,
      );
    }
  }, [
    isVideoRecording,
    gasPpm,
    cameraRef,
    beginOverlaySession,
    getElapsedSeconds,
    ensureMediaPermissions,
  ]);

  const handleStopVideoRecording = useCallback(async () => {
    if (!isVideoRecording) return;
    try {
      if (videoRecordingIntervalRef.current) {
        clearInterval(videoRecordingIntervalRef.current);
        videoRecordingIntervalRef.current = null;
      }
      const { overlayData, durationSec: recordingDurationSec } =
        endOverlaySession(gasPpmRef.current);
      const recordingStartedAtForOverlay = recordingStartDate ?? new Date();

      setIsVideoRecording(false);
      setRecordingStartDate(null);
      processingJobIdRef.current = startSavingJob({
        phase: "processing",
        sensorValue: maxPpmDuringRecordingRef.current ?? gasPpmRef.current,
      });
      processingCancelledRef.current = false;

      const cam = cameraRef.current;
      const recordingPromise = cameraRecordingPromiseRef.current;
      cameraRecordingPromiseRef.current = null;

      const elapsedSinceStart = recordingStartDate
        ? Date.now() - recordingStartDate.getTime()
        : null;
      console.log("[VideoSection] stopRecording() llamado", {
        hasCam: !!cam,
        hasRecordingPromise: !!recordingPromise,
        elapsedSinceStartMs: elapsedSinceStart,
      });

      try {
        cam?.stopRecording();
      } catch (stopErr) {
        console.error(
          "[VideoSection] stopRecording() lanzó:",
          JSON.stringify(describeError(stopErr), null, 2),
        );
      }

      let rawUrl: string | undefined;
      let recordingError: unknown = null;
      try {
        const recorded = recordingPromise ? await recordingPromise : undefined;
        rawUrl = recorded?.uri;
        console.log("[VideoSection] recordAsync resolvió", {
          hasUri: !!rawUrl,
          uri: rawUrl,
        });
      } catch (recErr) {
        recordingError = recErr;
        const camPermStatus = await Camera.getCameraPermissionsAsync().catch(() => null);
        const micPermStatus = await Camera.getMicrophonePermissionsAsync().catch(() => null);
        console.error(
          "[VideoSection] recordAsync rechazó:",
          JSON.stringify(
            {
              error: describeError(recErr),
              context: {
                platform: Platform.OS,
                platformVersion: Platform.Version,
                elapsedSinceStartMs: elapsedSinceStart,
                flashEnabled,
                alarmEnabled,
                cameraPermissionGranted: camPermStatus?.granted ?? null,
                microphonePermissionGranted: micPermStatus?.granted ?? null,
              },
            },
            null,
            2,
          ),
        );
      }

      if (processingCancelledRef.current) return;

      if (rawUrl && typeof rawUrl === "string") {
        let videoUri = rawUrl.trim();
        if (!videoUri.startsWith("file://") && !videoUri.startsWith("content://")) {
          videoUri = `file://${videoUri}`;
        }

        if (videoUri.startsWith("file://")) {
          const inputFs = videoUri.replace(/^file:\/\//, "");
          const cacheRoot = FileSystem.cacheDirectory ?? "";
          let outputFs: string;
          if (cacheRoot) {
            const outBase = cacheRoot.startsWith("file://")
              ? cacheRoot.replace(/^file:\/\//, "")
              : cacheRoot;
            const sep = outBase.endsWith("/") ? "" : "/";
            outputFs = `${outBase}${sep}ffmpeg_overlay_${Date.now()}.mp4`;
          } else {
            const parent = inputFs.slice(0, inputFs.lastIndexOf("/") + 1);
            outputFs = `${parent}ffmpeg_overlay_${Date.now()}.mp4`;
          }
          try {
            await addOverlay({
              inputPath: inputFs,
              outputPath: outputFs,
              data: overlayData,
              recordingStartedAt: recordingStartedAtForOverlay,
              recordingDurationSec,
            });
            handleVideoRecordingComplete(`file://${outputFs}`);
          } catch (overlayErr) {
            console.warn(
              "[VideoSection] Overlay FFmpeg no aplicado, se usa el video original:",
              JSON.stringify(describeError(overlayErr), null, 2),
            );
            handleVideoRecordingComplete(videoUri);
          }
        } else {
          handleVideoRecordingComplete(videoUri);
        }
      } else {
        console.warn("[VideoSection] Sin URI de video válida tras recordAsync", {
          hadError: !!recordingError,
          elapsedSinceStartMs: elapsedSinceStart,
        });
        const baseMsg =
          "No se pudo obtener el video. Probá grabarlo de nuevo sin cambiar flash ni modo mientras grabás.";
        Alert.alert(
          "Grabación fallida",
          __DEV__ && recordingError
            ? `${baseMsg}\n\nDetalle: ${errorSummary(recordingError)}`
            : baseMsg,
        );
      }
    } catch (error) {
      console.error(
        "[VideoSection] Error deteniendo grabación:",
        JSON.stringify(describeError(error), null, 2),
      );
      Alert.alert(
        "Error",
        `No se pudo detener la grabación: ${errorSummary(error)}`,
      );
    } finally {
      abortOverlaySession();
      finishProcessingJob();
    }
  }, [
    isVideoRecording,
    recordingStartDate,
    cameraRef,
    handleVideoRecordingComplete,
    addOverlay,
    endOverlaySession,
    abortOverlaySession,
    startSavingJob,
    finishProcessingJob,
  ]);

  const handleSaveVideo = async () => {
    if (!capturedVideoUri) {
      Alert.alert("Error", "No hay video para guardar");
      return;
    }

    // Snapshot del job (el modal de formulario se cierra al instante)
    const uri = capturedVideoUri;
    const sensorValue = videoSensorValue;
    const location = videoLocation || undefined;

    setShowVideoFormModal(false);
    setCapturedVideoUri(null);
    setVideoSensorValue(null);
    setVideoLocation("");

    const jobId = startSavingJob({
      phase: "saving",
      uri,
      sensorValue,
      location,
    });
    try {
      await createVideoRecord(uri, sensorValue, location);
    } catch (error) {
      console.error("Error guardando video:", error);
      Alert.alert("Error", "No se pudo guardar el video. Intenta nuevamente.");
    } finally {
      finishSavingJob(jobId);
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
              <View style={styles.recordStopIcon} />
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
