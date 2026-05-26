import { useEffect, useRef, useCallback } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { useBLEStore } from "../stores/useBLEStore";
import { Base64 } from "js-base64";
import {
  BleManager,
  Device,
  BleError,
  Characteristic,
} from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";

const requestAndroid31Permissions = async () => {
  const bluetoothScanPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    {
      title: "Permiso de Bluetooth",
      message: "La app necesita escanear dispositivos Bluetooth para conectar el medidor.",
      buttonPositive: "OK",
    },
  );
  const bluetoothConnectPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    {
      title: "Permiso de Bluetooth",
      message: "La app necesita conectarse al medidor por Bluetooth.",
      buttonPositive: "OK",
    },
  );
  const fineLocationPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Permiso de ubicación",
      message: "Android requiere ubicación para el escaneo Bluetooth (no se usa tu posición).",
      buttonPositive: "OK",
    },
  );

  return (
    bluetoothScanPermission === "granted" &&
    bluetoothConnectPermission === "granted" &&
    fineLocationPermission === "granted"
  );
};

export const requestPermissions = async () => {
  if (Platform.OS === "android") {
    if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Bluetooth Low Energy requires Location",
          buttonPositive: "OK",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return await requestAndroid31Permissions();
    }
  } else {
    return true;
  }
};

export interface ConsoleEntry {
  id: string;
  timestamp: string;
  data: string;
}

const bleManager = new BleManager();
const AUTO_CONNECT_TIMEOUT = 30000;
const SCAN_TIMEOUT = 15000; // Tiempo de escaneo para el modal de dispositivos

export const useBLE = () => {
  // Usar Zustand store para persistir estados
  const {
    connectedDevice,
    hc06Device,
    isLoading,
    autoConnectFailed,
    consoleData,
    gasPpm,
    bateria,
    showDisconnectAlert,
    isConnecting: isConnectingState,
    connectionSuccess: connectionSuccessState,
    isScanning: isScanningState,
    savedDeviceId: savedDeviceIdState,
    ignoreDisconnection: ignoreDisconnectionState,
    setConnectedDevice,
    setHc06Device,
    setIsLoading,
    setAutoConnectFailed,
    setConsoleData,
    addConsoleMessage,
    setGasPpm,
    setBateria,
    setPreheatProgress,
    setCalibratingProgress,
    setDeviceReady,
    preheatProgress,
    calibratingProgress,
    deviceReady,
    setShowDisconnectAlert,
    setIsConnecting,
    setConnectionSuccess,
    setIsScanning,
    setSavedDeviceId,
    setIgnoreDisconnection,
    clearConsole,
    discoveredDevices,
    clearDiscoveredDevices,
    addDiscoveredDevice,
    connectionStatusMessage,
    setConnectionStatusMessage,
  } = useBLEStore();

  // Refs para sincronizar con el store y mantener compatibilidad
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectedDeviceRef = useRef<Device | null>(null);
  const disconnectSubscriptionRef = useRef<any>(null);
  const userInitiatedDisconnectRef = useRef<boolean>(false);

  // Sincronizar refs con el store
  const isConnectingRef = useRef<boolean>(false);
  const connectionSuccessRef = useRef<boolean>(false);
  const isScanningRef = useRef<boolean>(false);
  const savedDeviceIdRef = useRef<string | null>(null);
  const ignoreDisconnectionRef = useRef<boolean>(false);

  // Sincronizar refs con el store cuando cambian
  useEffect(() => {
    isConnectingRef.current = isConnectingState;
  }, [isConnectingState]);

  useEffect(() => {
    connectionSuccessRef.current = connectionSuccessState;
  }, [connectionSuccessState]);

  useEffect(() => {
    isScanningRef.current = isScanningState;
  }, [isScanningState]);

  useEffect(() => {
    savedDeviceIdRef.current = savedDeviceIdState;
  }, [savedDeviceIdState]);

  useEffect(() => {
    ignoreDisconnectionRef.current = ignoreDisconnectionState;
  }, [ignoreDisconnectionState]);

  // Sincronizar connectedDeviceRef con el store
  useEffect(() => {
    connectedDeviceRef.current = connectedDevice;
  }, [connectedDevice]);

  /** Convierte tensión de batería en voltios a porcentaje: 3.2V = 0%, 3.8V = 100% (lineal). */
  const voltageToBatteryPercent = (voltage: number): number => {
    const MIN_V = 3.2;
    const MAX_V = 3.8;
    if (voltage <= MIN_V) return 0;
    if (voltage >= MAX_V) return 100;
    return Math.round(((voltage - MIN_V) / (MAX_V - MIN_V)) * 100);
  };

  // Parsear datos del sensor: PREHEAT X%, CALIBRATING X%; PPM y BAT cuando deviceReady
  // Mensaje del dispositivo: "PPM: 0 | BAT: 0.0V"
  const parseSensorData = (data: string) => {
    try {
      const preheatMatch = data.match(/PREHEAT\s*(\d+)\s*%/i);
      if (preheatMatch) {
        const value = parseInt(preheatMatch[1], 10);
        if (!isNaN(value)) setPreheatProgress(value);
      }

      const calibratingMatch = data.match(/CALIBRATING\s*(\d+)\s*%/i);
      if (calibratingMatch) {
        setPreheatProgress(100); // Si está calibrando, preheat tiene que estar en 100
        const value = parseInt(calibratingMatch[1], 10);
        if (!isNaN(value)) {
          setCalibratingProgress(value);
          // Desbloquear botones cuando calibración llega a 100% (evitar race: getState puede estar desactualizado)
          if (value === 100) setDeviceReady(true);
        }
      }

      const state = useBLEStore.getState();
      const ready = state.preheatProgress === 100 && state.calibratingProgress === 100;
      if (ready) setDeviceReady(true);

      // PPM y BAT se parsean siempre que vengan en el mensaje (mostrar en cuanto el equipo los envíe)
      // Aceptar "PPM: 0", "PPM=0", "PPM 0" (espacios/símbolos flexibles)
      const ppmMatch = data.match(/PPM[\s:=]+(\d+)/i);
      if (ppmMatch) {
        const ppmValue = parseInt(ppmMatch[1], 10);
        if (!isNaN(ppmValue)) setGasPpm(ppmValue);
      }

      const batMatch = data.match(/BAT[\s:=]+([\d.]+)\s*V?/i);
      if (batMatch) {
        const voltage = parseFloat(batMatch[1]);
        if (!isNaN(voltage)) {
          setBateria(voltageToBatteryPercent(voltage));
        }
      }
    } catch (error) {
      console.error("Error al parsear datos del sensor:", error);
    }
  };

  // Callback cuando se reciben datos
  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.error(error);
      addConsoleMessage(`[ERROR] ${error.message}`);
      return;
    }

    if (!characteristic?.value) {
      return;
    }

    const dataInput = Base64.decode(characteristic.value);

    parseSensorData(dataInput);
    addConsoleMessage(dataInput);
    useBLEStore.getState().bumpSignalTick();
  };

  // Iniciar streaming de datos
  const startStreamingData = async (device: Device) => {
    if (!device) return;

    setPreheatProgress(0);
    setCalibratingProgress(0);
    setDeviceReady(false);

    try {
      // En Android, solicitar MTU ayuda a estabilizar la conexión y puede evitar
      // que el sistema cierre el enlace BLE tras ~1 min de inactividad
      if (Platform.OS === "android") {
        try {
          await device.requestMTU(256);
        } catch (mtuError) {
          console.log("requestMTU no disponible o falló (no crítico):", mtuError);
        }
      }

      const services = await device.services();
      const systemServicePatterns = ["1800", "1801"];

      const normalizeUuid = (uuid: string) =>
        uuid.toLowerCase().replace(/-/g, "");

      let serviceUuid = "9800";
      const foundService = services.find(
        (s) => normalizeUuid(s.uuid) === normalizeUuid(serviceUuid),
      );

      if (!foundService) {
        const customServices = services.filter((s) => {
          const normalized = normalizeUuid(s.uuid);
          return !systemServicePatterns.some((pattern) =>
            normalized.includes(pattern),
          );
        });

        if (customServices.length > 0) {
          const hc06Service = customServices.find((s) => {
            const normalized = normalizeUuid(s.uuid);
            return normalized.includes("ffe0") || normalized.includes("ffe5");
          });
          serviceUuid = hc06Service ? hc06Service.uuid : customServices[0].uuid;
        } else if (services.length > 0) {
          serviceUuid = services[0].uuid;
        } else {
          return;
        }
      }

      const characteristics = await device.characteristicsForService(
        serviceUuid,
      );
      const notifiableChar = characteristics.find(
        (c) => c.isNotifiable || c.isIndicatable,
      );

      if (notifiableChar) {
        device.monitorCharacteristicForService(
          serviceUuid,
          notifiableChar.uuid,
          onDataUpdate,
        );
      }
    } catch (error) {
      console.error("Error al iniciar streaming de datos:", error);
    }
  };

  // Conectar a dispositivo
  const connectToDevice = async (device: Device) => {
    // Protecci?n contra m?ltiples conexiones simult?neas
    if (isConnectingState) {
      console.log("Ya hay una conexi?n en progreso, esperando...");
      // Esperar a que termine la conexi?n anterior
      let waitCount = 0;
      while (isConnectingState && waitCount < 30) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        waitCount++;
      }
      // Si despu?s de esperar ya est? conectado, retornar
      if (connectedDeviceRef.current) {
        try {
          const isConnected = await connectedDeviceRef.current.isConnected();
          if (isConnected) {
            console.log("Dispositivo ya conectado despu?s de esperar");
            return;
          }
        } catch (error) {
          console.log("Error verificando conexi?n despu?s de esperar:", error);
        }
      }
    }

    // Si ya hay un dispositivo conectado, verificar antes de conectar otro
    if (
      connectedDeviceRef.current &&
      connectedDeviceRef.current.id !== device.id
    ) {
      try {
        const isConnected = await connectedDeviceRef.current.isConnected();
        if (isConnected) {
          console.log(
            "Ya hay otro dispositivo conectado, desconectando primero...",
          );
          await connectedDeviceRef.current.cancelConnection();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log("Error desconectando dispositivo anterior:", error);
      }
    }

    // Marcar que estamos conectando
    setIsConnecting(true);
    setConnectionStatusMessage("cargando...");

    try {
      const isConnected = await device.isConnected();
      if (isConnected) {
        // Verificar que realmente est? conectado y emparejado intentando descubrir servicios
        try {
          await device.discoverAllServicesAndCharacteristics();
          // Si llegamos aqu?, el dispositivo est? realmente conectado y emparejado
          setConnectionStatusMessage("conectando");
          addConsoleMessage("? Dispositivo ya estaba conectado");
          connectedDeviceRef.current = device;
          setConnectedDevice(device);

          // Guardar el ID del dispositivo para futuras verificaciones
          setSavedDeviceId(device.id);

          // Configurar listener de desconexi?n
          if (disconnectSubscriptionRef.current) {
            disconnectSubscriptionRef.current.remove();
          }
          disconnectSubscriptionRef.current = device.onDisconnected(
            (error, device) => {
              console.log("Dispositivo desconectado:", device?.id);
              // Solo manejar desconexi?n si realmente hay un error
              if (error) {
                console.log("Error en desconexi?n:", error.message);
                handleDisconnection();
              } else {
                // Verificar antes de desconectar (puede ser temporal durante procesamiento)
                setTimeout(async () => {
                  try {
                    const stillConnected = await device.isConnected();
                    if (!stillConnected) {
                      handleDisconnection();
                    }
                  } catch (checkError) {
                    handleDisconnection();
                  }
                }, 2000);
              }
            },
          );

          bleManager.stopDeviceScan();
          startStreamingData(device);
          setIsLoading(false);
          setAutoConnectFailed(false);
          setIsConnecting(false);
          setConnectionSuccess(true);
          return;
        } catch (discoverError) {
          // Si falla el descubrimiento, el dispositivo no est? realmente conectado/emparejado
          console.log(
            "El dispositivo no est? realmente conectado, continuando con conexi?n...",
          );
          // Continuar con el flujo normal de conexi?n
        }
      }

      setIsLoading(true);
      addConsoleMessage("?? Estableciendo conexi?n...");

      // Conectar al dispositivo (esto puede disparar el diálogo de emparejamiento).
      // Opciones vacías {}: no usar timeout ni autoConnect. En Android provocaban
      // desconexión ~45s después; al "reconectar" o aplicar el timeout se rompía la conexión.
      const deviceConnection = await bleManager.connectToDevice(device.id, {});

      // NO marcar como conectado todav?a - esperar a que se complete el emparejamiento
      // El usuario a?n puede estar en el proceso de emparejamiento

      // Esperar m?s tiempo para que se complete el emparejamiento (el usuario puede tardar)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verificar m?ltiples veces que la conexi?n est? realmente establecida
      // y que el emparejamiento se haya completado
      let connectionVerified = false;
      let verificationAttempts = 0;
      const maxAttempts = 5;

      while (!connectionVerified && verificationAttempts < maxAttempts) {
        try {
          const isConnected = await deviceConnection.isConnected();
          if (isConnected) {
            // Intentar descubrir servicios para verificar que el emparejamiento est? completo
            // Si el emparejamiento no est? completo, esto fallar?
            try {
              await deviceConnection.discoverAllServicesAndCharacteristics();
              connectionVerified = true;
            } catch (discoverError) {
              // Si falla el descubrimiento, puede ser que el emparejamiento a?n no est? completo
              console.log(
                `Intento ${verificationAttempts + 1
                }: Emparejamiento a?n en progreso...`,
              );
              verificationAttempts++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } else {
            throw new Error("La conexi?n se perdi? durante el emparejamiento");
          }
        } catch (error) {
          if (
            (error as any).message.includes("disconnected") ||
            (error as any).message.includes("perdi?")
          ) {
            throw error;
          }
          verificationAttempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!connectionVerified) {
        throw new Error(
          "No se pudo verificar la conexi?n despu?s del emparejamiento",
        );
      }

      // Ahora s? marcar como conectado - el emparejamiento est? completo
      connectedDeviceRef.current = deviceConnection;
      setConnectedDevice(deviceConnection);
      setConnectionStatusMessage("conectando");
      addConsoleMessage("✓ Conexi?n establecida");

      // Guardar el ID del dispositivo para futuras verificaciones
      setSavedDeviceId(deviceConnection.id);

      // Configurar listener de desconexi?n
      if (disconnectSubscriptionRef.current) {
        disconnectSubscriptionRef.current.remove();
      }
      disconnectSubscriptionRef.current = deviceConnection.onDisconnected(
        (error, device) => {
          console.log("Dispositivo desconectado:", device?.id);
          // Solo manejar desconexi?n si realmente hay un error o el dispositivo se desconect?
          if (error) {
            console.log("Error en desconexi?n:", error.message);
            addConsoleMessage("?? Dispositivo desconectado");
            handleDisconnection();
          } else {
            // Si no hay error expl?cito, verificar antes de desconectar
            // Puede ser una desconexi?n temporal durante procesamiento pesado
            setTimeout(async () => {
              try {
                const stillConnected = await deviceConnection.isConnected();
                if (!stillConnected) {
                  addConsoleMessage("?? Dispositivo desconectado");
                  handleDisconnection();
                } else {
                  console.log(
                    "Dispositivo sigue conectado despu?s de verificaci?n",
                  );
                }
              } catch (checkError) {
                addConsoleMessage("?? Dispositivo desconectado");
                handleDisconnection();
              }
            }, 2000);
          }
        },
      );

      // Los servicios ya fueron descubiertos durante la verificaci?n
      // Solo asegurarnos de que el escaneo est? detenido
      bleManager.stopDeviceScan();
      setIsScanning(false);
      addConsoleMessage("?? Iniciando recepci?n de datos...");
      startStreamingData(deviceConnection);
      setIsLoading(false);
      setAutoConnectFailed(false);
      addConsoleMessage("✓ Conectado y listo para recibir datos");

      // Marcar conexi?n exitosa
      setConnectionSuccess(true);
      setIsConnecting(false);

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    } catch (e) {
      // Resetear flag de conexi?n en caso de error
      setIsConnecting(false);
      if (
        (e as any).message &&
        (e as any).message.includes("already connected")
      ) {
        try {
          await device.discoverAllServicesAndCharacteristics();
          connectedDeviceRef.current = device;
          setConnectedDevice(device);

          // Guardar el ID del dispositivo para futuras verificaciones
          setSavedDeviceId(device.id);

          // Configurar listener de desconexi?n
          if (disconnectSubscriptionRef.current) {
            disconnectSubscriptionRef.current.remove();
          }
          disconnectSubscriptionRef.current = device.onDisconnected(
            (error, device) => {
              console.log("Dispositivo desconectado:", device?.id);
              // Solo manejar desconexi?n si realmente hay un error
              if (error) {
                console.log("Error en desconexi?n:", error.message);
                handleDisconnection();
              } else {
                // Verificar antes de desconectar (puede ser temporal)
                setTimeout(async () => {
                  try {
                    const stillConnected = await device.isConnected();
                    if (!stillConnected) {
                      handleDisconnection();
                    }
                  } catch (checkError) {
                    handleDisconnection();
                  }
                }, 2000);
              }
            },
          );

          bleManager.stopDeviceScan();
          startStreamingData(device);
          setIsLoading(false);
          setAutoConnectFailed(false);
          return;
        } catch (retryError) {
          console.error("Error al usar conexi?n existente:", retryError);
        }
      }
      console.error("FAILED TO CONNECT", e);

      // Manejo espec?fico de errores de emparejamiento
      if (
        (e as any).message &&
        ((e as any).message.includes("pairing") ||
          (e as any).message.includes("bond") ||
          (e as any).message.includes("authentication") ||
          (e as any).message.includes("permission"))
      ) {
        addConsoleMessage(
          `?? Error de emparejamiento: ${(e as any).message
          }. Intenta nuevamente.`,
        );
      } else {
        addConsoleMessage(
          `? Error al conectar: ${(e as any).message || "Error desconocido"}`,
        );
      }

      setIsLoading(false);
      setAutoConnectFailed(true);
      isConnectingRef.current = false;

      // Limpiar referencia si la conexi?n fall?
      if (
        connectedDeviceRef.current &&
        connectedDeviceRef.current.id === device.id
      ) {
        connectedDeviceRef.current = null;
        setConnectedDevice(null);
      }
    }
  };

  // Intentar conectar autom?ticamente
  const attemptAutoConnect = async (device: Device) => {
    // Verificar si ya hay una conexi?n en progreso o activa
    if (isConnectingRef.current) {
      console.log(
        "Ya hay una conexi?n en progreso, cancelando intento autom?tico",
      );
      return;
    }

    // Verificar si ya est? conectado
    if (connectedDeviceRef.current) {
      try {
        const isConnected = await connectedDeviceRef.current.isConnected();
        if (isConnected) {
          console.log(
            "Dispositivo ya est? conectado, no es necesario conectar de nuevo",
          );
          return;
        }
      } catch (error) {
        console.log("Error verificando conexi?n existente:", error);
      }
    }

    setIsConnecting(true);
    setConnectionSuccess(false);

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    setIsLoading(true);
    setAutoConnectFailed(false);
    addConsoleMessage("?? Conectando al dispositivo...");

    // Timeout aumentado para dar tiempo al emparejamiento
    connectionTimeoutRef.current = setTimeout(() => {
      const currentSuccess = useBLEStore.getState().connectionSuccess;
      const currentConnecting = useBLEStore.getState().isConnecting;

      if (!currentSuccess && currentConnecting) {
        console.log("Timeout de conexi?n alcanzado");
        setIsLoading(false);
        setAutoConnectFailed(true);
        bleManager.stopDeviceScan();
        setIsConnecting(false);
        addConsoleMessage("?? Tiempo de conexi?n agotado. Intenta nuevamente.");
      }
    }, AUTO_CONNECT_TIMEOUT);

    try {
      await connectToDevice(device);
      // connectToDevice ya marca setConnectionSuccess(true) y setIsConnecting(false)
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("Error en conexi?n autom?tica:", error);
      addConsoleMessage(`[ERROR] Error al conectar: ${error}`);
      setIsConnecting(false);
      setConnectionSuccess(false);
    }
  };

  // Verificar si el dispositivo ya est? conectado
  const checkAlreadyConnected = async () => {
    // No verificar si ya hay una conexi?n en progreso
    if (isConnectingState) {
      console.log("Conexi?n en progreso, no verificar dispositivos conectados");
      return false;
    }

    try {
      console.log("Verificando dispositivos ya conectados...");

      // Primero verificar si connectedDeviceRef tiene un dispositivo conectado
      if (connectedDeviceRef.current) {
        try {
          const isConnected = await connectedDeviceRef.current.isConnected();
          if (isConnected) {
            console.log(
              "Dispositivo ya conectado en ref:",
              connectedDeviceRef.current.id,
            );
            const device = connectedDeviceRef.current;
            setConnectedDevice(device);
            setHc06Device(device);
            setSavedDeviceId(device.id);
            setIsLoading(false);
            setAutoConnectFailed(false);
            // Importante: iniciar streaming para recibir datos (antes no se hacía y no llegaban datos)
            if (!disconnectSubscriptionRef.current) {
              disconnectSubscriptionRef.current = device.onDisconnected(
                (err) => {
                  if (err) handleDisconnection();
                  else {
                    setTimeout(async () => {
                      try {
                        if (!(await device.isConnected())) handleDisconnection();
                      } catch {
                        handleDisconnection();
                      }
                    }, 2000);
                  }
                },
              );
            }
            startStreamingData(device);
            return true;
          }
        } catch (error) {
          console.log("Dispositivo en ref no está conectado:", error);
        }
      }

      // Si tenemos un dispositivo guardado, verificar si est? conectado
      if (hc06Device) {
        try {
          const isConnected = await hc06Device.isConnected();
          if (isConnected) {
            connectedDeviceRef.current = hc06Device;
            await connectToDevice(hc06Device);
            return true;
          }
        } catch (error) {
          console.log("Dispositivo guardado no est? conectado");
        }
      }

      // Si tenemos un ID guardado de una conexi?n previa, intentar verificar
      if (savedDeviceIdRef.current) {
        try {
          const connectedDevices = await bleManager.connectedDevices([
            savedDeviceIdRef.current,
          ]);
          if (connectedDevices && connectedDevices.length > 0) {
            const device = connectedDevices[0];
            if (device) {
              console.log(
                "Dispositivo encontrado conectado por ID:",
                device.id,
              );
              connectedDeviceRef.current = device;
              setHc06Device(device);
              await connectToDevice(device);
              return true;
            }
          }
        } catch (error) {
          console.log(
            "No se pudo verificar dispositivo por ID guardado:",
            error,
          );
        }
      }

      // Verificar todos los dispositivos BLE ya conectados (último recurso)
      try {
        const allConnectedDevices = await bleManager.connectedDevices([]);
        if (allConnectedDevices.length > 0) {
          const device = allConnectedDevices[0];
          console.log(
            "Dispositivo BLE encontrado ya conectado:",
            device.id,
          );
          connectedDeviceRef.current = device;
          setSavedDeviceId(device.id);
          setHc06Device(device);
          await connectToDevice(device);
          return true;
        }
      } catch (error) {
        console.log(
          "Error al verificar todos los dispositivos conectados:",
          error,
        );
      }

      console.log("No se encontraron dispositivos conectados previamente");
      return false;
    } catch (error) {
      console.error("Error al verificar dispositivos conectados:", error);
      return false;
    }
  };

  // addConsoleMessage ya viene del store de Zustand

  // Detener escaneo BLE (para cerrar modal o al seleccionar dispositivo).
  // Opcionalmente espera un poco para que la capa nativa libere el escaneo.
  const stopScan = (options?: { waitBeforeNextScan?: boolean }) => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    try {
      bleManager.stopDeviceScan();
    } catch {
      // Ignorar si ya estaba detenido
    }
    setIsScanning(false);
    if (options?.waitBeforeNextScan) {
      return new Promise<void>((resolve) =>
        setTimeout(resolve, 450),
      );
    }
    return Promise.resolve();
  };

  // Escaneo para descubrir dispositivos y mostrarlos en el modal (sin auto-conectar)
  const startDiscoveryScan = async () => {
    if (connectedDeviceRef.current) {
      try {
        const isConnected = await connectedDeviceRef.current.isConnected();
        if (isConnected) {
          addConsoleMessage("✓ Dispositivo ya está conectado");
          return;
        }
      } catch {
        // Continuar con el escaneo
      }
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      addConsoleMessage(
        "[ERROR] Sin permisos de Bluetooth. Activa Bluetooth y los permisos de la app en Ajustes.",
      );
      return;
    }

    // Siempre detener cualquier escaneo previo y esperar a que la capa nativa lo libere
    // (evita "Cannot start scanning operation" al abrir/cerrar el modal varias veces)
    await stopScan({ waitBeforeNextScan: true });

    clearDiscoveredDevices();
    setIsScanning(true);
    addConsoleMessage("🔍 Buscando dispositivos...");

    try {
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error("Error en escaneo:", error);
          const isNotAuthorized =
            error.message?.includes("not authorized") ||
            error.message?.includes("Device is not authorized");
          if (isNotAuthorized) {
            addConsoleMessage(
              "[ERROR] Bluetooth no autorizado. Ve a Ajustes > Apps > Hydrogen y activa los permisos de Bluetooth.",
            );
          } else {
            addConsoleMessage(`[ERROR] ${error.message}`);
          }
          setIsScanning(false);
          return;
        }
        if (device) {
          addDiscoveredDevice(device);
        }
      });
    } catch (scanError: any) {
      setIsScanning(false);
      const msg = scanError?.message ?? String(scanError);
      addConsoleMessage(`[ERROR] ${msg}`);
      if (msg.includes("Cannot start scanning")) {
        addConsoleMessage(
          "[INFO] Cierra el modal, espera unos segundos y vuelve a intentar.",
        );
      }
      return;
    }

    scanTimeoutRef.current = setTimeout(() => {
      try {
        bleManager.stopDeviceScan();
      } catch {
        // Ignorar si ya estaba detenido
      }
      setIsScanning(false);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      const count = useBLEStore.getState().discoveredDevices.length;
      addConsoleMessage(
        count > 0
          ? `✓ Escaneo finalizado. ${count} dispositivo(s) encontrado(s).`
          : "⚠ No se encontraron dispositivos. Intenta acercar el dispositivo.",
      );
    }, SCAN_TIMEOUT);
  };

  // Conectar manualmente: inicia el escaneo para mostrar dispositivos en el modal
  const connectManually = () => {
    startDiscoveryScan();
  };

  // clearConsole ya viene del store de Zustand, pero necesitamos limpiar tambi?n gasPpm y bateria
  const clearConsoleWithReset = () => {
    clearConsole();
    setGasPpm(null);
    setBateria(null);
    setPreheatProgress(0);
    setCalibratingProgress(0);
    setDeviceReady(false);
  };

  // Manejar desconexi�n
  const handleDisconnection = () => {
    // SIEMPRE limpiar ignoreDisconnection primero para evitar bloqueos
    // Incluso si estaba activo, necesitamos procesar la desconexi�n
    if (ignoreDisconnectionState) {
      console.log(
        "Desconexi�n detectada durante procesamiento - limpiando estados...",
      );
      setIgnoreDisconnection(false);
    }

    // Limpiar suscripci�n de desconexi�n
    if (disconnectSubscriptionRef.current) {
      disconnectSubscriptionRef.current.remove();
      disconnectSubscriptionRef.current = null;
    }

    // Resetear flag de conexi�n para evitar intentos de reconexi�n inmediatos
    setIsConnecting(false);
    setConnectionSuccess(false);

    // Resetear estados
    connectedDeviceRef.current = null;
    setConnectedDevice(null);
    setIsLoading(false);
    setAutoConnectFailed(true);
    if (!userInitiatedDisconnectRef.current) {
      setShowDisconnectAlert(true);
    }
    userInitiatedDisconnectRef.current = false;

    // Limpiar hc06Device para evitar reconexi�n autom�tica inmediata
    setHc06Device(null);

    // Limpiar datos del sensor y estado de calentamiento cuando se desconecta
    setGasPpm(null);
    setBateria(null);
    setPreheatProgress(0);
    setCalibratingProgress(0);
    setDeviceReady(false);

    // NO limpiar savedDeviceIdRef para poder verificar en el futuro
    // savedDeviceIdRef.current se mantiene para la pr�xima verificaci�n

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    bleManager.stopDeviceScan();
    setIsScanning(false);
  };

  const disconnect = useCallback(async () => {
    const device = connectedDeviceRef.current;
    if (!device) return;
    userInitiatedDisconnectRef.current = true;
    try {
      await device.cancelConnection();
    } catch (error) {
      console.log("Error al desconectar:", error);
      userInitiatedDisconnectRef.current = false;
      handleDisconnection();
    }
  }, []);

  // Efecto: al montar, pedir permisos y comprobar si ya hay un dispositivo conectado
  useEffect(() => {
    requestPermissions().then(async () => {
      const alreadyConnected = await checkAlreadyConnected();
      if (!alreadyConnected) {
        setIsLoading(false);
        setAutoConnectFailed(true);
      }
    });

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (disconnectSubscriptionRef.current) {
        disconnectSubscriptionRef.current.remove();
        disconnectSubscriptionRef.current = null;
      }
      bleManager.stopDeviceScan();
      setIsScanning(false);
    };
  }, []);

  return {
    connectedDevice,
    hc06Device,
    isLoading,
    isConnecting: isConnectingState,
    isScanning: isScanningState,
    autoConnectFailed,
    connectionStatusMessage,
    consoleData,
    gasPpm,
    bateria,
    preheatProgress,
    calibratingProgress,
    deviceReady,
    showDisconnectAlert,
    setShowDisconnectAlert,
    connectManually,
    clearConsole: clearConsoleWithReset,
    startDiscoveryScan,
    stopScan,
    discoveredDevices,
    connectToDevice,
    disconnect,
    ignoreDisconnectionRef: {
      current: ignoreDisconnectionState,
      set: setIgnoreDisconnection,
    },
  };
};
