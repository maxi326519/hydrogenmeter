import { usePhotoStorage, PhotoRecord } from "../hooks/usePhotoStorage";
import { useState, useEffect, useRef, useCallback } from "react";
import { useBLEOrMock } from "../hooks/useBLEOrMock";
import { ConsoleEntry } from "../hooks/useBLE";
import { captureRef } from "react-native-view-shot";
import { IconButton } from "./IconButton";
import { CameraView } from "./CameraView";
import { AppRed } from "../constants/Colors";
import {
  useCameraPermissions,
  CameraView as ExpoCameraView,
} from "expo-camera";

import {
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Linking,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import {
  VideoIcon,
  WifiOffIcon,
  WifiOnIcon,
  CameraIcon,
  FolderIcon,
  SoundMaxIcon,
  SoundMuteIcon,
  Battery10Icon,
  Battery25Icon,
  Battery50Icon,
  Battery75Icon,
  Battery100Icon,
  SettingsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowBackIcon,
} from "./Icons";

import TextInput from "./Inputs/TextInput";
import DateInput from "./Inputs/DateInput";
import { MOCK_BLE_ENABLED } from "@/constants/mockBLE";

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
  } = useBLEOrMock();

  // Barra unificada: 0–50% = preheat, 50–100% = calibración (siempre "Calibrando")
  const warmupProgressPercent =
    (preheatProgress / 100) * 50 + (calibratingProgress / 100) * 50;

  const [showLogModal, setShowLogModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
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
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string>("");
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
    }).catch(() => {});
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

        // Reproducir pitido si la alarma está activada
        if (alarmEnabled) {
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
  }, [showConnectModal, startDiscoveryScan]);

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

  // Función para manejar el botón de cámara (toggle)
  const handleCameraPress = async () => {
    // Solo funciona si el equipo está conectado
    if (!connectedDevice) {
      return;
    }

    // Si la cámara ya está activa, cerrarla
    if (showCamera) {
      setShowCamera(false);
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

  // Función para iniciar edición de ubicación
  const handleStartEditLocation = () => {
    if (fullImageRecord) {
      setEditingLocation(fullImageRecord.location || "");
      setIsEditingLocation(true);
    }
  };

  // Función para guardar cambios de ubicación
  const handleSaveLocation = async () => {
    if (!fullImageRecord) return;

    try {
      const updatedRecord = await updateRecord(fullImageRecord.id, {
        location: editingLocation || undefined,
      });
      if (updatedRecord) {
        setFullImageRecord(updatedRecord);
        setIsEditingLocation(false);
        Alert.alert("Éxito", "Ubicación actualizada correctamente");
      }
    } catch (error) {
      console.error("Error actualizando ubicación:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar la ubicación. Intenta nuevamente.",
      );
    }
  };

  // Función para cancelar edición
  const handleCancelEditLocation = () => {
    setIsEditingLocation(false);
    setEditingLocation("");
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
          {/* Número del sensor abajo centrado (3er cuadrante) - usa la medición almacenada al tomar la foto */}
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

      {/* Cámara de fondo cuando tiene permisos */}
      {showCamera && cameraPermission?.granted && (
        <CameraView
          visible={showCamera}
          onClose={() => setShowCamera(false)}
          cameraRef={cameraRef}
        />
      )}

      {/* Batería arriba a la derecha - nivel real cuando hay dato (equipo enviando) */}
      <View style={styles.batteryContainer}>
        {bateria !== null ? (
          getBatteryIcon()
        ) : (
          <Battery10Icon size={48} color={AppRed} />
        )}
      </View>

      {/* Botones: modo cámara (solo volver + sonido) o modo normal (todos) */}
      {showCamera && cameraPermission?.granted ? (
        <>
          {/* Botón volver - izquierda */}
          <View style={styles.cameraBackButtonContainer}>
            <IconButton
              icon={<ArrowBackIcon size={28} color={AppRed} />}
              onPress={() => setShowCamera(false)}
            />
          </View>
          {/* Botón sonido - derecha */}
          <View style={styles.cameraSoundButtonContainer}>
            <IconButton
              icon={
                alarmEnabled ? (
                  <SoundMaxIcon size={28} color={AppRed} />
                ) : (
                  <SoundMuteIcon size={28} color={AppRed} />
                )
              }
              onPress={() => {
                setAlarmEnabled(!alarmEnabled);
                console.log("Alarma", alarmEnabled ? "desactivada" : "activada");
              }}
            />
          </View>
        </>
      ) : (
        <>
          {/* Botón de log abajo a la izquierda */}
          <View style={styles.logButtonContainer}>
            <IconButton
              icon={<SettingsIcon size={28} color={AppRed} />}
              onPress={() => setShowLogModal(true)}
            />
          </View>

          {/* Botones de iconos abajo a la derecha */}
          <View style={styles.iconButtonsContainer}>
            <IconButton
              icon={
                connectedDevice ? (
                  <WifiOnIcon size={28} color={AppRed} />
                ) : (
                  <WifiOffIcon size={28} color={AppRed} />
                )
              }
              onPress={() => {
                if (!connectedDevice) {
                  setShowConnectModal(true);
                  startDiscoveryScan();
                }
                console.log(
                  "WiFi presionado - Estado:",
                  connectedDevice ? "Conectado" : "Desconectado",
                );
              }}
            />
            <IconButton
              icon={<CameraIcon size={28} color={AppRed} />}
              onPress={handleCameraPress}
              disabled={!connectedDevice}
            />
            {/* Video - temporalmente deshabilitado hasta que esté programado
            <IconButton
              icon={<VideoIcon size={28} color={AppRed} />}
              onPress={() => console.log("Video presionado")}
              disabled={!connectedDevice}
            />
            */}
            <IconButton
              icon={<FolderIcon size={28} color={AppRed} />}
              onPress={() => {
                loadRecords();
                setShowGalleryModal(true);
              }}
            />
            <IconButton
              icon={
                alarmEnabled ? (
                  <SoundMaxIcon size={28} color={AppRed} />
                ) : (
                  <SoundMuteIcon size={28} color={AppRed} />
                )
              }
              onPress={() => {
                setAlarmEnabled(!alarmEnabled);
                console.log("Alarma", alarmEnabled ? "desactivada" : "activada");
              }}
              disabled={!connectedDevice}
            />
          </View>
        </>
      )}

      {/* Contenido central que cambia según el estado */}
      {/* Si la cámara está activa, siempre mostrar número y barra (hardcodeados para ajustar estilos) */}
      {showCamera && cameraPermission?.granted ? (
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
      ) : !connectedDevice ? (
        // Estado: No conectado - solo mostrar si la cámara no está activa
        <>
          {isLoading && !autoConnectFailed ? (
            // Buscando automáticamente
            <View style={styles.centerContent}>
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.loadingText}>Conectando</Text>
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

      {/* Botón de captura - por encima de todo */}
      {showCamera && cameraPermission?.granted && (
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePicture}
            disabled={isProcessingPhoto}
          >
            {isProcessingPhoto ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
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

      {/* Modal de permisos de cámara - solo cuando no tiene permisos */}
      <Modal
        visible={showCamera && !cameraPermission?.granted}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Permiso de Cámara Requerido</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Esta aplicación necesita acceso a la cámara para capturar
                imágenes.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  const result = await requestCameraPermission();
                  if (!result.granted) {
                    Alert.alert(
                      "Permiso Denegado",
                      "Para usar la cámara, necesitas otorgar permisos en la configuración de la aplicación.",
                      [
                        {
                          text: "Cancelar",
                          style: "cancel",
                          onPress: () => setShowCamera(false),
                        },
                        {
                          text: "Abrir Configuración",
                          onPress: () => Linking.openSettings(),
                        },
                      ],
                    );
                  } else {
                    setShowCamera(true);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Solicitar Permiso</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de logs */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLogModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consola de dispositivo</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={clearConsole}
                >
                  <Text style={styles.modalButtonText}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowLogModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {consoleData.length === 0 ? (
                <Text style={styles.modalEmptyText}>
                  Esperando datos del dispositivo...
                </Text>
              ) : (
                consoleData.map((entry: ConsoleEntry) => (
                  <View key={entry.id} style={styles.logLine}>
                    <Text style={styles.logTimestamp}>[{entry.timestamp}]</Text>
                    <Text style={styles.logData}>{entry.data}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {consoleData.length} mensaje
                {consoleData.length !== 1 ? "s" : ""} recibido
                {consoleData.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de selección de dispositivos BLE */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          stopScan();
          setShowConnectModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar dispositivo</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  stopScan();
                  setShowConnectModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            {isScanning && discoveredDevices.length === 0 ? (
              <View style={styles.modalBody}>
                <ActivityIndicator size="large" color={AppRed} />
                <Text style={[styles.modalText, { marginTop: 16 }]}>
                  Buscando dispositivos...
                </Text>
              </View>
            ) : null}
            <View style={styles.modalScrollViewContainer}>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={
                  discoveredDevices.length === 0 && !isScanning
                    ? styles.modalScrollViewContentEmpty
                    : undefined
                }
                showsVerticalScrollIndicator={true}
              >
                {discoveredDevices.length === 0 && !isScanning ? (
                  <Text style={styles.modalEmptyText}>
                    No se encontraron dispositivos. Asegúrate de que el
                    Bluetooth esté encendido y el dispositivo cerca. {MOCK_BLE_ENABLED ? " (usando mock)" : ""}
                  </Text>
                ) : (
                  discoveredDevices.map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      style={styles.deviceItem}
                      onPress={() => {
                        stopScan();
                        setShowConnectModal(false);
                        connectToDevice(device);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deviceItemName} numberOfLines={1}>
                        {device.name ||
                          device.localName ||
                          "Dispositivo sin nombre"}
                      </Text>
                      <Text style={styles.deviceItemId} numberOfLines={1}>
                        {device.id}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {discoveredDevices.length} dispositivo
                {discoveredDevices.length !== 1 ? "s" : ""} encontrado
                {discoveredDevices.length !== 1 ? "s" : ""}
                {isScanning ? " · Buscando..." : ""}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de formulario de foto */}
      <Modal
        visible={showPhotoFormModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPhotoFormModal(false)}
      >
        <View style={styles.photoFormModalContainer}>
          <View style={styles.photoFormModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Foto</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowPhotoFormModal(false);
                  setCapturedPhoto(null);
                  setPhotoSensorValue(null);
                  setPhotoLocation("");
                }}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.photoFormContainer}>
                {/* Miniatura de la foto */}
                {capturedPhoto && (
                  <TouchableOpacity
                    onPress={() => {
                      setViewerImageUri(capturedPhoto);
                      setShowFullImageViewer(true);
                    }}
                    style={styles.photoThumbnailContainer}
                  >
                    <Image
                      source={{ uri: capturedPhoto }}
                      style={styles.photoThumbnail}
                    />
                  </TouchableOpacity>
                )}

                {/* Valor del sensor */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="sensorValue"
                    label="Valor del Sensor"
                    value={
                      photoSensorValue !== null
                        ? photoSensorValue.toString()
                        : ""
                    }
                    onChange={(name, value) => {
                      const numValue = parseInt(value) || null;
                      setPhotoSensorValue(numValue);
                    }}
                    placeholder="Ingrese el valor del sensor"
                    disabled={true}
                    style={styles.darkInput}
                  />
                </View>

                {/* Ubicación */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="location"
                    label="Ubicación"
                    value={photoLocation}
                    onChange={(name, value) => setPhotoLocation(value)}
                    placeholder="Ingrese la ubicación donde se tomó la foto"
                    style={styles.darkInput}
                  />
                </View>

                {/* Botón de guardar */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSavePhoto}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de imagen completa */}
      <Modal
        visible={showFullImageModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {
          setShowFullImageModal(false);
          setFullImageUri(null);
          setFullImageRecord(null);
        }}
      >
        <View style={styles.fullImageModalContainer}>
          <View style={styles.fullImageModalHeader}>
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={() => {
                setShowFullImageModal(false);
                setFullImageUri(null);
                setFullImageRecord(null);
                setIsEditingLocation(false);
                setEditingLocation("");
              }}
            >
              <Text style={styles.fullImageCloseButtonText}>✕</Text>
            </TouchableOpacity>
            {fullImageRecord && !isEditingLocation && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleStartEditLocation}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            )}
            {isEditingLocation && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEditLocation}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveEditButton}
                  onPress={handleSaveLocation}
                >
                  <Text style={styles.saveEditButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <ScrollView
            style={styles.fullImageModalScrollView}
            contentContainerStyle={styles.fullImageModalContent}
          >
            {/* Miniatura de la imagen */}
            {fullImageUri && (
              <TouchableOpacity
                style={styles.fullImageThumbnailContainer}
                onPress={() => {
                  setViewerImageUri(fullImageUri);
                  setShowFullImageViewer(true);
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: fullImageUri }}
                  style={styles.fullImageThumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {/* Información del registro */}
            {fullImageRecord && (
              <>
                {/* Valor del sensor */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="sensorValue"
                    label="Valor del Sensor"
                    value={
                      fullImageRecord.sensorValue !== null
                        ? fullImageRecord.sensorValue.toString()
                        : ""
                    }
                    onChange={() => {}}
                    disabled={true}
                    style={styles.darkInput}
                  />
                </View>

                {/* Fecha */}
                <View style={styles.inputWrapper}>
                  <DateInput
                    name="timestamp"
                    label="Fecha"
                    value={new Date(fullImageRecord.timestamp)}
                    onChange={() => {}}
                    disabled={true}
                    style={styles.darkInput}
                  />
                </View>

                {/* Ubicación */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="location"
                    label="Ubicación"
                    value={
                      isEditingLocation
                        ? editingLocation
                        : fullImageRecord.location || ""
                    }
                    onChange={(name, value) => setEditingLocation(value)}
                    disabled={!isEditingLocation}
                    style={styles.darkInput}
                    placeholder="No especificada"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de visor de imagen completa */}
      <Modal
        visible={showFullImageViewer}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {
          setShowFullImageViewer(false);
          setViewerImageUri(null);
        }}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={() => {
              setShowFullImageViewer(false);
              setViewerImageUri(null);
            }}
          >
            <Text style={styles.imageViewerCloseButtonText}>✕</Text>
          </TouchableOpacity>
          {viewerImageUri && (
            <Image
              source={{ uri: viewerImageUri }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Modal de galería */}
      <Modal
        visible={showGalleryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <View style={styles.galleryModalContainer}>
          <View style={styles.galleryModalHeader}>
            <Text style={styles.modalTitle}>Galería de Fotos</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGalleryModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.galleryModalScrollView}>
            {records.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                No hay fotos guardadas aún
              </Text>
            ) : (
              records.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={styles.galleryItem}
                  onPress={() => {
                    setFullImageUri(record.imageUri);
                    setFullImageRecord(record);
                    setShowGalleryModal(false);
                    setShowFullImageModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.galleryThumbnailContainer}>
                    <Image
                      source={{ uri: record.imageUri }}
                      style={styles.galleryThumbnail}
                    />
                  </View>
                  <View style={styles.galleryInfo}>
                    <Text style={styles.gallerySensorValue}>
                      {record.sensorValue !== null ? record.sensorValue : "--"}
                    </Text>
                    <Text style={styles.galleryTimestamp}>
                      {new Date(record.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "Eliminar Foto",
                        "¿Estás seguro de que quieres eliminar esta foto?",
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await deleteRecord(record.id);
                                Alert.alert(
                                  "Éxito",
                                  "Foto eliminada correctamente",
                                );
                              } catch (error) {
                                Alert.alert(
                                  "Error",
                                  "No se pudo eliminar la foto",
                                );
                              }
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
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
  cameraSoundButtonContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
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
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  imageViewerCloseButton: {
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
  imageViewerCloseButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  imageViewerImage: {
    flex: 1,
    width: "100%",
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
