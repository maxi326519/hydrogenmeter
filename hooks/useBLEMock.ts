import { useState, useEffect, useRef, useCallback } from "react";
import type { Device } from "react-native-ble-plx";
import type { ConsoleEntry } from "./useBLE";

/** Dispositivo simulado para el mock */
const MOCK_DEVICE: Device = {
  id: "MOCK:00:00:00:00:00:00",
  name: "HYDROGENMETER (Simulado)",
  localName: "HYDROGENMETER",
  rssi: -50,
  mtu: 23,
  manufacturerData: null,
  serviceData: null,
  serviceUUIDs: null,
  isConnectable: null,
  overflowServiceUUIDs: null,
  txPowerLevel: null,
  solicitedServiceUUIDs: null,
  connect: () => Promise.resolve(MOCK_DEVICE),
  cancelConnection: () => Promise.resolve(MOCK_DEVICE),
  isConnected: () => Promise.resolve(true),
  discoverAllServicesAndCharacteristics: () => Promise.resolve(MOCK_DEVICE),
  services: () => Promise.resolve([]),
  characteristicsForService: () => Promise.resolve([]),
  readCharacteristicForService: () => Promise.resolve({} as any),
  writeCharacteristicWithResponseForService: () => Promise.resolve({} as any),
  writeCharacteristicWithoutResponseForService: () => Promise.resolve({} as any),
  monitorCharacteristicForService: () => ({ remove: () => {} }),
  readDescriptorForCharacteristic: () => Promise.resolve({} as any),
  writeDescriptorForCharacteristic: () => Promise.resolve({} as any),
  requestMTU: () => Promise.resolve(MOCK_DEVICE),
  connectToDevice: () => Promise.resolve(MOCK_DEVICE),
  onDisconnected: () => ({ remove: () => {} }),
} as Device;

const addConsoleEntry = (
  entries: ConsoleEntry[],
  data: string
): ConsoleEntry[] => [
  ...entries,
  {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    data,
  },
];

/** Simula voltaje a porcentaje: 3.2V = 0%, 3.8V = 100% */
const voltageToPercent = (v: number) =>
  Math.round(((Math.min(3.8, Math.max(3.2, v)) - 3.2) / 0.6) * 100);

/**
 * Hook mock que simula un dispositivo BLE conectado con datos artificiales.
 * Misma interfaz que useBLE para uso intercambiable.
 */
export function useBLEMock() {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoConnectFailed, setAutoConnectFailed] = useState(true);
  const [consoleData, setConsoleData] = useState<ConsoleEntry[]>([]);
  const [gasPpm, setGasPpm] = useState<number | null>(null);
  const [bateria, setBateria] = useState<number | null>(null);
  const [showDisconnectAlert, setShowDisconnectAlert] = useState(false);
  const [preheatProgress, setPreheatProgress] = useState(0);
  const [calibratingProgress, setCalibratingProgress] = useState(0);
  const [deviceReady, setDeviceReady] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [ignoreDisconnection, setIgnoreDisconnection] = useState(false);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearConsole = useCallback(() => {
    setConsoleData([]);
    setGasPpm(null);
    setBateria(null);
    setPreheatProgress(0);
    setCalibratingProgress(0);
    setDeviceReady(false);
  }, []);

  const startDiscoveryScan = useCallback(() => {
    setConsoleData((prev) => addConsoleEntry(prev, "🔍 Buscando dispositivos (mock)..."));
    // Mostrar dispositivo simulado de inmediato (sin setTimeout)
    setDiscoveredDevices([MOCK_DEVICE]);
    setIsScanning(false);
    setConsoleData((prev) =>
      addConsoleEntry(prev, "✓ Escaneo finalizado. 1 dispositivo(s) encontrado(s).")
    );
  }, []);

  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const connectToDevice = useCallback(
    (device: Device) => {
      setConsoleData((prev) => addConsoleEntry(prev, "✓ Conectando (mock)..."));
      setIsLoading(true);
      setTimeout(() => {
        setConnectedDevice(device);
        setAutoConnectFailed(false);
        setIsLoading(false);
        setShowDisconnectAlert(false);
        setConsoleData((prev) =>
          addConsoleEntry(prev, "✓ Conectado y listo para recibir datos (mock)")
        );
        mockStartSimulation();
      }, 800);
    },
    []
  );

  const mockStartSimulation = useCallback(() => {
    if (simIntervalRef.current) return;
    setPreheatProgress(0);
    setCalibratingProgress(0);
    setDeviceReady(false);
    setGasPpm(null);
    setBateria(null);

    let preheat = 0;
    let calibrating = 0;
    let ppm = 0;
    let batV = 3.5;

    simIntervalRef.current = setInterval(() => {
      if (preheat < 100) {
        preheat += 50;
        setPreheatProgress(preheat);
        setConsoleData((prev) =>
          addConsoleEntry(prev, `PREHEAT ${preheat}%`)
        );
      } else if (calibrating < 100) {
        calibrating += 50;
        setPreheatProgress(100);
        setCalibratingProgress(calibrating);
        setConsoleData((prev) =>
          addConsoleEntry(prev, `CALIBRATING ${calibrating}%`)
        );
      } else {
        setDeviceReady(true);
        ppm = 500 + Math.floor(Math.random() * 500);
        batV = 3.2 + Math.random() * 0.6;
        setGasPpm(ppm);
        setBateria(voltageToPercent(batV));
        setConsoleData((prev) =>
          addConsoleEntry(prev, `PPM: ${ppm} | BAT: ${batV.toFixed(1)}V`)
        );
      }
    }, 1000);
  }, []);

  const connectManually = useCallback(() => {
    if (connectedDevice) {
      setConsoleData((prev) =>
        addConsoleEntry(prev, "✓ Dispositivo ya está conectado")
      );
      return;
    }
    setConsoleData((prev) => addConsoleEntry(prev, "🔍 Buscando dispositivos (mock)..."));
    setIsScanning(true);
    setTimeout(() => {
      setDiscoveredDevices([MOCK_DEVICE]);
      setIsScanning(false);
      connectToDevice(MOCK_DEVICE);
    }, 1000);
  }, [connectedDevice, connectToDevice]);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  return {
    connectedDevice,
    hc06Device: connectedDevice,
    isLoading,
    isScanning,
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
    startDiscoveryScan,
    stopScan,
    discoveredDevices,
    connectToDevice,
    ignoreDisconnectionRef: {
      current: ignoreDisconnection,
      set: setIgnoreDisconnection,
    },
  };
}
