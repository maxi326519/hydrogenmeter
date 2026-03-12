import { useState, useEffect, useRef, useCallback } from "react";
import { usePhotoStorage, PhotoRecord } from "../hooks/usePhotoStorage";
import { useVideoStorage, VideoRecord } from "../hooks/useVideoStorage";
import { MOCK_BLE_ENABLED } from "@/constants/mockBLE";
import { useBLEOrMock } from "../hooks/useBLEOrMock";
import { VideoSection } from "./VideoSection";
import { captureRef } from "react-native-view-shot";
import { CameraView } from "./CameraView";
import { AppRed } from "../constants/Colors";
import { Audio } from "expo-av";
import {
  PrincipalesBar,
  CameraBar,
  CameraCaptureButton,
} from "./modules";
import {
  ConsoleLogModal,
  GalleryModal,
  ImageViewerModal,
  FullImageModal,
  FullVideoModal,
  VideoViewerModal,
  CameraPermissionModal,
  DeviceConnectModal,
  PhotoFormModal,
} from "./modals";
import {
  useCameraPermissions,
  CameraView as ExpoCameraView,
} from "expo-camera";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  Battery10Icon,
  Battery25Icon,
  Battery50Icon,
  Battery75Icon,
  Battery100Icon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "./Icons";

export default function MainPage() {
  const {
    connectedDevice,
    isLoading,
    autoConnectFailed,
    consoleData,
    gasPpm,
    bateria,
    preheatProgress,
    calibratingProgress,
    deviceReady,
    showDisconnectAlert,
    setShowDisconnectAlert,
    connectManually,
    clearConsole,
    ignoreDisconnectionRef,
    startDiscoveryScan,
    stopScan,
    discoveredDevices,
    connectToDevice,
    isScanning,
    disconnect,
    connectionStatusMessage,
  } = useBLEOrMock();

  // Barra unificada: 0–50% = preheat, 50–100% = calibración (siempre "Calibrando")
  const warmupProgressPercent =
    (preheatProgress / 100) * 50 + (calibratingProgress / 100) * 50;

  const [showLogModal, setShowLogModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [ppmDirection, setPpmDirection] = useState<"up" | "down" | null>(null);
  const previousPpmRef = useRef<number | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPhotoFormModal, setShowPhotoFormModal] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [fullImageRecord, setFullImageRecord] = useState<PhotoRecord | null>(
    null,
  );
  const [showFullImageViewer, setShowFullImageViewer] = useState(false);
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);
  const [showFullVideoModal, setShowFullVideoModal] = useState(false);
  const [showVideoViewerModal, setShowVideoViewerModal] = useState(false);
  const [fullVideoRecord, setFullVideoRecord] = useState<VideoRecord | null>(null);
  const [photoSensorValue, setPhotoSensorValue] = useState<number | null>(null);
  const [photoLocation, setPhotoLocation] = useState<string>("");
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const cameraRef = useRef<ExpoCameraView>(null);
  const photoWithOverlayRef = useRef<View>(null);
  const {
    createRecord,
    records,
    deleteRecord,
    loadRecords,
    updateRecord,
  } = usePhotoStorage();
  const {
    records: videoRecords,
    createRecord: createVideoRecord,
    loadRecords: loadVideoRecords,
    deleteRecord: deleteVideoRecord,
    updateRecord: updateVideoRecord,
  } = useVideoStorage();

  // Ref para el sonido del pitido (cargado una vez)
  const beepSoundRef = useRef<Audio.Sound | null>(null);

  // Configurar audio para que el pitido suene aunque el dispositivo esté en silencio
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
      interruptionModeIOS: 1,
    }).catch(() => { });
  }, []);

  const playBeep = useCallback(async () => {
    if (!alarmEnabled) return;

    try {
      if (!beepSoundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/beep.mp3")
        );
        beepSoundRef.current = sound;
      }
      await beepSoundRef.current!.setPositionAsync(0);
      await beepSoundRef.current!.playAsync();
    } catch (error) {
      console.log("Error reproduciendo pitido:", error);
    }
  }, [alarmEnabled]);

  // Comparar el valor actual de gasPpm con el anterior y reproducir pitido
  useEffect(() => {
    if (gasPpm !== null) {
      const previousValue = previousPpmRef.current;

      if (previousValue !== null && previousValue !== gasPpm) {
        // Comparar con el valor anterior
        if (gasPpm > previousValue) {
          setPpmDirection("up");
        } else if (gasPpm < previousValue) {
          setPpmDirection("down");
        } else {
          setPpmDirection(null);
        }

        // Reproducir pitido cuando la medición incrementa o está por encima de 10.000 ppm
        if (alarmEnabled && (gasPpm > previousValue || gasPpm > 10000)) {
          playBeep();
        }
      }

      // Actualizar el valor anterior
      previousPpmRef.current = gasPpm;
    }
  }, [gasPpm, alarmEnabled]);

  // Iniciar escaneo cuando se abre el modal de conexión (asegura que el mock muestre el dispositivo)
  useEffect(() => {
    if (showConnectModal) {
      startDiscoveryScan();
    }
  }, [showConnectModal]);

  // Cerrar la cámara automáticamente cuando se desconecta el dispositivo
  useEffect(() => {
    if (!connectedDevice && showCamera) {
      console.log("Dispositivo desconectado, cerrando cámara...");
      setShowCamera(false);
      // Asegurar que ignoreDisconnection se resetee cuando se desconecta
      if (ignoreDisconnectionRef?.set) {
        ignoreDisconnectionRef.set(false);
      }
    }
  }, [connectedDevice, showCamera]);

  // Animación de barra de carga
  useEffect(() => {
    if (isLoading && !autoConnectFailed) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading, autoConnectFailed, progressAnim]);

  // Mostrar alert cuando se desconecta
  useEffect(() => {
    if (showDisconnectAlert) {
      Alert.alert(
        "Dispositivo Desconectado",
        "El dispositivo HC-06 se ha desconectado. Presiona 'Conectar' para buscar nuevamente.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowDisconnectAlert(false);
            },
          },
        ],
      );
    }
  }, [showDisconnectAlert, setShowDisconnectAlert]);

  // Función para obtener el icono de batería según el porcentaje
  const getBatteryIcon = () => {
    if (bateria === null) return null;

    if (bateria <= 10) {
      return <Battery10Icon size={48} color={AppRed} />;
    } else if (bateria <= 25) {
      return <Battery25Icon size={48} color={AppRed} />;
    } else if (bateria <= 50) {
      return <Battery50Icon size={48} color={AppRed} />;
    } else if (bateria <= 75) {
      return <Battery75Icon size={48} color={AppRed} />;
    } else {
      return <Battery100Icon size={48} color={AppRed} />;
    }
  };

  // Función para abrir cámara en modo video (desde botón Video en barra principal)
  const handleVideoPress = async () => {
    if (!connectedDevice || !deviceReady) return;

    if (!cameraPermission) return;

    if (!cameraPermission.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setShowCamera(true);
        return;
      }
    }

    setCameraMode("video");
    setShowCamera(true);
  };

  // Función para manejar el botón de cámara (toggle)
  const handleCameraPress = async () => {
    // Solo funciona si el equipo está conectado y calibrado
    if (!connectedDevice || !deviceReady) {
      return;
    }

    // Si la cámara ya está activa, cerrarla
    if (showCamera) {
      setShowCamera(false);
      setCameraMode("photo");
      return;
    }

    // Si no tiene permisos, solicitarlos
    if (!cameraPermission) {
      // Los permisos aún no se han cargado
      return;
    }

    if (!cameraPermission.granted) {
      // Solicitar permisos
      const result = await requestCameraPermission();
      if (!result.granted) {
        // Si se denegaron los permisos, mostrar modal
        setShowCamera(true);
        return;
      }
    }

    // Si tiene permisos, activar la cámara
    setShowCamera(true);
  };

  // Función para tomar foto
  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      console.error("cameraRef.current es null");
      return;
    }

    try {
      setIsProcessingPhoto(true);
      // Ignorar desconexiones temporales durante el procesamiento de la foto
      if (ignoreDisconnectionRef?.set) {
        ignoreDisconnectionRef.set(true);
      }
      console.log("Intentando tomar foto...");
      const photo = await (cameraRef.current as any).takePictureAsync({
        quality: 0.8,
      });
      console.log("Foto capturada:", photo);
      if (photo?.uri) {
        console.log("URI de la foto:", photo.uri);
        // 1. Almacenar la medición en estado general (antes de mostrar overlay)
        setPhotoSensorValue(gasPpm);
        // Resetear el estado de carga de imagen
        setImageLoaded(false);
        // 2. Guardar temporalmente la URI para crear la vista con overlay
        setTempPhotoUri(photo.uri);
      } else {
        console.error("La foto no tiene URI");
        setIsProcessingPhoto(false);
        if (ignoreDisconnectionRef?.set) {
          ignoreDisconnectionRef.set(false);
        }
      }
    } catch (error) {
      console.error("Error tomando foto:", error);
      console.error(
        "Detalles del error:",
        (error as any).message,
        (error as any).stack,
      );
      setIsProcessingPhoto(false);
      if (ignoreDisconnectionRef?.set) {
        ignoreDisconnectionRef.set(false);
      }
    }
  };

  // Función para capturar la foto con overlay de texto
  const capturePhotoWithOverlay = async (originalUri: string) => {
    try {
      if (!photoWithOverlayRef.current) {
        console.error("photoWithOverlayRef.current es null");
        handlePhotoTaken(originalUri);
        return;
      }

      // Esperar a que la imagen esté completamente cargada
      let waitCount = 0;
      while (!imageLoaded && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      // Esperar un momento adicional para asegurar que todo esté renderizado
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("Capturando vista con overlay...");
      const uri = await captureRef(photoWithOverlayRef.current, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
        snapshotContentContainer: false,
      });

      console.log("Vista capturada con overlay:", uri);
      handlePhotoTaken(uri);
      setTempPhotoUri(null);
      setImageLoaded(false);
      // Re-habilitar manejo de desconexiones después de procesar la foto
      if (ignoreDisconnectionRef?.set) {
        ignoreDisconnectionRef.set(false);
      }
    } catch (error) {
      console.error("Error capturando vista con overlay:", error);
      console.error("Detalles del error:", (error as any).message);
      // Si falla, usar la foto original sin overlay
      setIsProcessingPhoto(false);
      handlePhotoTaken(originalUri);
      setTempPhotoUri(null);
      setImageLoaded(false);
      // Re-habilitar manejo de desconexiones después del error
      if (ignoreDisconnectionRef?.set) {
        ignoreDisconnectionRef.set(false);
      }
    }
  };

  // Función para manejar cuando se toma una foto (photoSensorValue ya está en estado desde handleTakePicture)
  const handlePhotoTaken = (uri: string) => {
    setCapturedPhoto(uri);
    setIsProcessingPhoto(false);
    setShowCamera(false);
    setShowPhotoFormModal(true);
    // Asegurar que ignoreDisconnection se resetee cuando se completa el procesamiento
    if (ignoreDisconnectionRef?.set) {
      ignoreDisconnectionRef.set(false);
    }
  };

  // Función para guardar la foto
  const handleSavePhoto = async () => {
    if (!capturedPhoto) {
      Alert.alert("Error", "No hay foto para guardar");
      return;
    }

    try {
      await createRecord(
        capturedPhoto,
        photoSensorValue,
        photoLocation || undefined,
      );
      Alert.alert("Éxito", "Foto guardada correctamente");
      setShowPhotoFormModal(false);
      setCapturedPhoto(null);
      setPhotoSensorValue(null);
      setPhotoLocation("");
    } catch (error) {
      console.error("Error guardando foto:", error);
      Alert.alert("Error", "No se pudo guardar la foto. Intenta nuevamente.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        showCamera && cameraPermission?.granted && styles.containerWithCamera,
      ]}
    >
      {/* Vista invisible para capturar foto con overlay de texto */}
      {tempPhotoUri && (
        <View
          ref={photoWithOverlayRef}
          collapsable={false}
          style={styles.photoOverlayContainer}
        >
          <Image
            source={{ uri: tempPhotoUri }}
            style={styles.photoOverlayImage}
            resizeMode="cover"
            onLoad={() => {
              console.log("Imagen cargada, capturando vista...");
              setImageLoaded(true);
              // Esperar un momento después de que la imagen se cargue antes de capturar
              setTimeout(() => {
                if (tempPhotoUri) {
                  capturePhotoWithOverlay(tempPhotoUri);
                }
              }, 300);
            }}
            onError={(error) => {
              console.error("Error cargando imagen:", error);
              setIsProcessingPhoto(false);
              // Re-habilitar manejo de desconexiones después del error
              if (ignoreDisconnectionRef?.set) {
                ignoreDisconnectionRef.set(false);
              }
              if (tempPhotoUri) {
                handlePhotoTaken(tempPhotoUri);
                setTempPhotoUri(null);
              }
            }}
          />

          {/* "Hydrogen Meter" arriba a la izquierda */}
          <View style={styles.overlayTopLeft}>
            <Text style={styles.overlayTextTop}>Hydrogen Meter</Text>
          </View>

          {/* Número del sensor abajo centrado usa la medición almacenada al tomar la foto */}
          <View style={styles.overlayBottomCenter}>
            <Text
              style={styles.overlayTextCenter}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {photoSensorValue !== null ? photoSensorValue : "--"}
            </Text>
          </View>

          {/* Fecha abajo a la derecha */}
          <View style={styles.overlayBottomRight}>
            <Text style={styles.overlayTextBottom}>
              {new Date().toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      )}

      {/* Cámara de fondo cuando tiene permisos - siempre montada para evitar fondo negro al alternar modos */}
      {showCamera && cameraPermission?.granted && (
        <CameraView
          visible={showCamera}
          onClose={() => {
            setShowCamera(false);
            setCameraMode("photo");
          }}
          cameraRef={cameraRef}
          enableTorch={flashEnabled}
        />
      )}

      {/* VideoSection: modo video */}
      <VideoSection
        visible={showCamera && !!cameraPermission?.granted && cameraMode === "video"}
        cameraRef={cameraRef}
        gasPpm={gasPpm}
        ppmDirection={ppmDirection}
        onSwitchToPhoto={() => {
          setShowCamera(false);
          setCameraMode("photo");
        }}
        onSwitchToPhotoMode={() => setCameraMode("photo")}
        createVideoRecord={createVideoRecord}
        alarmEnabled={alarmEnabled}
        onAudioPress={() => {
          setAlarmEnabled(!alarmEnabled);
          console.log("Alarma", alarmEnabled ? "desactivada" : "activada");
        }}
        flashEnabled={flashEnabled}
        onFlashPress={() => setFlashEnabled(!flashEnabled)}
      />

      {/* Batería arriba a la derecha - nivel real cuando hay dato (equipo enviando) */}
      <View style={styles.batteryContainer}>
        {bateria !== null ? (
          getBatteryIcon()
        ) : (
          <Battery10Icon size={48} color={AppRed} />
        )}
      </View>

      {/* Botones: modo cámara (CameraBar) o modo normal (PrincipalesBar) */}
      {showCamera && cameraPermission?.granted ? (
        cameraMode === "photo" ? (
          <CameraBar
            mode="photo"
            onBack={() => {
              setShowCamera(false);
              setCameraMode("photo");
            }}
            alarmEnabled={alarmEnabled}
            onAudioPress={() => {
              setAlarmEnabled(!alarmEnabled);
              console.log("Alarma", alarmEnabled ? "desactivada" : "activada");
            }}
            flashEnabled={flashEnabled}
            onFlashPress={() => setFlashEnabled(!flashEnabled)}
            onSwitchToVideoMode={() => setCameraMode("video")}
            isProcessing={isProcessingPhoto}
            captureButton={
              <CameraCaptureButton
                onPress={handleTakePicture}
                disabled={isProcessingPhoto}
                isProcessing={isProcessingPhoto}
              />
            }
          />
        ) : null
      ) : (
        <PrincipalesBar
          connectedDevice={!!connectedDevice}
          alarmEnabled={alarmEnabled}
          onWifiPress={() => {
            if (!connectedDevice) {
              setShowConnectModal(true);
              startDiscoveryScan();
            } else {
              Alert.alert(
                "Desconectar",
                "¿Desconectar el dispositivo?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Desconectar",
                    style: "destructive",
                    onPress: () => disconnect(),
                  },
                ]
              );
            }
          }}
          onCameraPress={handleCameraPress}
          onVideoPress={handleVideoPress}
          onFilesPress={async () => {
            await loadRecords();
            await loadVideoRecords();
            setShowGalleryModal(true);
          }}
          onAudioPress={() => {
            setAlarmEnabled(!alarmEnabled);
            console.log("Alarma", alarmEnabled ? "desactivada" : "activada");
          }}
          onConfigPress={() => setShowLogModal(true)}
          disabled={!connectedDevice || !deviceReady}
          showConfig={__DEV__}
        />
      )}

      {/* Contenido central que cambia según el estado */}
      {/* Si la cámara está activa en modo foto, mostrar número y barra como overlay */}
      {showCamera && cameraPermission?.granted && cameraMode === "photo" ? (
        <View style={styles.ppmOverlay}>
          {/* Barra de rango 0-10,000 */}
          <View style={styles.rangeBarContainerCamera}>
            <View style={styles.rangeBar}>
              <View
                style={[
                  styles.rangeBarFill,
                  {
                    width: `${Math.min(
                      ((gasPpm !== null ? gasPpm : 0) / 10000) * 100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
          {/* Número */}
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
        </View>
      ) : showCamera && cameraMode === "video" ? (
        /* Modo video: no mostrar barra/ppm de MainPage (VideoSection tiene el suyo) */
        null
      ) : !connectedDevice ? (
        // Estado: No conectado - mostrar loading al conectar o botón conectar
        <>
          {isLoading ? (
            // Conectando: loading y mensaje (oculta botón Conectar)
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={AppRed} />
              <Text style={styles.loadingText}>
                {connectionStatusMessage || "Conectando"}
              </Text>
            </View>
          ) : autoConnectFailed ? (
            // No encontrado - mostrar botón conectar
            <View style={styles.centerContent}>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => {
                  setShowConnectModal(true);
                  startDiscoveryScan();
                }}
              >
                <Text style={styles.connectButtonText}>Conectar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      ) : connectedDevice && (gasPpm !== null || gasPpm === 0) ? (
        // Conectado y ya hay dato de PPM (incl. 0): mostrar PPM y barra
        <View style={styles.centerContent}>
          <View style={styles.rangeBarContainer}>
            <View style={styles.rangeBar}>
              <View
                style={[
                  styles.rangeBarFill,
                  {
                    width: `${Math.min(
                      ((gasPpm !== null ? gasPpm : 0) / 10000) * 100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
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
      ) : (
        // Conectado pero sin dato PPM aún: precalentamiento/calibración
        <View style={styles.centerContent}>
          <View style={styles.warmupBarContainer}>
            <View style={styles.warmupBar}>
              <View
                style={[
                  styles.warmupBarFill,
                  { width: `${Math.min(warmupProgressPercent, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.warmupLabel}>
              Calibrando {Math.round(warmupProgressPercent)}%
            </Text>
          </View>
        </View>
      )}

      {/* Loading overlay mientras se procesa la foto */}
      {isProcessingPhoto && (
        <View style={styles.photoProcessingOverlay}>
          <View style={styles.photoProcessingContainer}>
            <ActivityIndicator size="large" color={AppRed} />
            <Text style={styles.photoProcessingText}>Procesando foto...</Text>
          </View>
        </View>
      )}

      <CameraPermissionModal
        visible={showCamera && !cameraPermission?.granted}
        onClose={() => setShowCamera(false)}
        onRequestPermission={requestCameraPermission}
        onPermissionGranted={() => setShowCamera(true)}
      />

      {__DEV__ && (
        <ConsoleLogModal
          visible={showLogModal}
          onClose={() => setShowLogModal(false)}
          consoleData={consoleData}
          onClear={clearConsole}
        />
      )}

      <DeviceConnectModal
        visible={showConnectModal}
        onClose={() => {
          stopScan();
          setShowConnectModal(false);
        }}
        devices={discoveredDevices}
        isScanning={isScanning}
        onSelectDevice={(device) => {
          stopScan();
          setShowConnectModal(false);
          connectToDevice(device);
        }}
        mockEnabled={MOCK_BLE_ENABLED}
      />

      <PhotoFormModal
        visible={showPhotoFormModal}
        onClose={() => {
          setShowPhotoFormModal(false);
          setCapturedPhoto(null);
          setPhotoSensorValue(null);
          setPhotoLocation("");
        }}
        imageUri={capturedPhoto}
        sensorValue={photoSensorValue}
        location={photoLocation}
        onSensorValueChange={setPhotoSensorValue}
        onLocationChange={setPhotoLocation}
        onSave={handleSavePhoto}
        onOpenImageViewer={(uri) => {
          setViewerImageUri(uri);
          setShowFullImageViewer(true);
        }}
      />

      <GalleryModal
        visible={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        records={records}
        videoRecords={videoRecords}
        onPhotoPress={(record) => {
          setFullImageUri(record.imageUri);
          setFullImageRecord(record);
          setShowGalleryModal(false);
          setShowFullImageModal(true);
        }}
        onVideoPress={(record) => {
          setFullVideoRecord(record);
          setShowGalleryModal(false);
          setShowFullVideoModal(true);
        }}
        onDeletePhoto={async (id) => {
          await deleteRecord(id);
        }}
        onDeleteVideo={async (id) => {
          await deleteVideoRecord(id);
        }}
      />

      <FullImageModal
        visible={showFullImageModal}
        onClose={() => {
          setShowFullImageModal(false);
          setFullImageUri(null);
          setFullImageRecord(null);
        }}
        imageUri={fullImageUri}
        record={fullImageRecord}
        onOpenImageViewer={(uri) => {
          setViewerImageUri(uri);
          setShowFullImageViewer(true);
        }}
        onUpdateRecord={updateRecord}
        onRecordUpdated={setFullImageRecord}
      />

      <FullVideoModal
        visible={showFullVideoModal}
        onClose={() => {
          setShowFullVideoModal(false);
          setFullVideoRecord(null);
        }}
        record={fullVideoRecord}
        onOpenVideoPlayer={() => setShowVideoViewerModal(true)}
        onUpdateRecord={updateVideoRecord}
        onRecordUpdated={setFullVideoRecord}
      />

      <ImageViewerModal
        visible={showFullImageViewer}
        imageUri={viewerImageUri}
        onClose={() => {
          setShowFullImageViewer(false);
          setViewerImageUri(null);
        }}
      />

      <VideoViewerModal
        visible={showVideoViewerModal}
        record={fullVideoRecord}
        onClose={() => {
          setShowVideoViewerModal(false);
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d2d2d",
    padding: 0,
    margin: 0,
  },
  containerWithCamera: {
    backgroundColor: "transparent",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
    elevation: 15,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 30,
    color: AppRed,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F44336",
    borderRadius: 2,
  },
  connectButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: AppRed,
    justifyContent: "center",
    alignItems: "center",
  },
  connectButtonText: {
    color: AppRed,
    fontSize: 24,
    fontWeight: "bold",
  },
  batteryContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  ppmBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
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
  ppmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    elevation: 15,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    pointerEvents: "none",
  },
  logButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  cameraBackButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  cameraVideoButtonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  cameraSoundButtonContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  cameraVideoMicButtonContainer: {
    position: "absolute",
    bottom: 40,
    right: 140,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  cameraVideoRecordButtonContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  videoRecordButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: AppRed,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  videoRecordButtonCircular: {
    width: 80,
    height: 80,
    borderRadius: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  videoRecordButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.8,
  },
  videoStopButton: {
    backgroundColor: "#c62828",
  },
  videoRecordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2d2d2d",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    maxHeight: "80%",
    paddingBottom: 20,
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
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalScrollViewContainer: {
    flex: 1,
    minHeight: 200,
    backgroundColor: "#2d2d2d",
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  modalScrollViewContentEmpty: {
    flexGrow: 1,
  },
  modalEmptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
  logLine: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  deviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  deviceItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  deviceItemId: {
    fontSize: 12,
    color: "#888",
    fontFamily: "monospace",
  },
  logTimestamp: {
    color: "#888",
    fontSize: 12,
    fontFamily: "monospace",
    marginRight: 8,
    minWidth: 80,
  },
  logData: {
    color: AppRed,
    fontSize: 14,
    fontFamily: "monospace",
    flex: 1,
  },
  modalFooter: {
    backgroundColor: "#2d2d2d",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  modalFooterText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
  iconButtonsContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  modalButtonSecondary: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppRed,
  },
  modalButtonSecondaryText: {
    color: AppRed,
    fontSize: 16,
    fontWeight: "600",
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
  photoFormContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  photoThumbnailContainer: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: AppRed,
  },
  photoThumbnail: {
    width: 200,
    height: 200,
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
  galleryVideoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryVideoLabel: {
    marginTop: 4,
    fontSize: 10,
    color: AppRed,
  },
  videoViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoViewerCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppRed,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  videoViewerCloseButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
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
  sensorValueContainer: {
    width: "100%",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    alignItems: "center",
  },
  sensorValueLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  sensorValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: AppRed,
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
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  fullImageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    backgroundColor: "#2d2d2d",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveEditButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  saveEditButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fullImageModalScrollView: {
    flex: 1,
  },
  fullImageModalContent: {
    padding: 20,
  },
  fullImageThumbnailContainer: {
    width: "100%",
    height: 200,
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: AppRed,
  },
  fullImageThumbnail: {
    width: "100%",
    height: "100%",
  },
  readOnlyField: {
    marginBottom: 16,
  },
  readOnlyFieldLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  readOnlyFieldValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  fullImageInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  fullImageSensorValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppRed,
    marginBottom: 4,
  },
  fullImageTimestamp: {
    fontSize: 14,
    color: "#fff",
  },
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageCloseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppRed,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageCloseButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  fullImage: {
    flex: 1,
    width: "100%",
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderColor: AppRed,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  photoProcessingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
    elevation: 40,
  },
  photoProcessingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2d2d2d",
    padding: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppRed,
  },
  photoProcessingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  galleryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  galleryThumbnailContainer: {
    marginRight: 12,
  },
  galleryThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  galleryInfo: {
    flex: 1,
  },
  gallerySensorValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppRed,
    marginBottom: 4,
  },
  galleryTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  inputWrapper: {
    width: "100%",
  },
  darkInput: {
    backgroundColor: "#1a1a1a",
    borderColor: "#444",
    color: "#fff",
  },
  galleryModalContainer: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  galleryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    backgroundColor: "#2d2d2d",
  },
  galleryModalScrollView: {
    flex: 1,
    backgroundColor: "#2d2d2d",
    padding: 16,
  },
  rangeBarContainer: {
    width: "80%",
    maxWidth: 400,
    marginBottom: 20,
    alignItems: "center",
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
  warmupBarContainer: {
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  warmupBar: {
    width: "100%",
    height: 20,
    backgroundColor: "#444",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  warmupBarFill: {
    height: "100%",
    backgroundColor: AppRed,
    borderRadius: 10,
  },
  warmupLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  warmupSubtext: {
    fontSize: 14,
    color: "#888",
  },
  photoOverlayContainer: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    backgroundColor: "#000",
    opacity: 1,
  },
  photoOverlayImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  overlayTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  overlayTextTop: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlayBottomCenter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Dimensions.get("window").height * 0.15, // Un poco más arriba (15% desde abajo)
  },
  overlayTextCenter: {
    fontSize: 72,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  overlayBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  overlayTextBottom: {
    fontSize: 16,
    fontWeight: "600",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
