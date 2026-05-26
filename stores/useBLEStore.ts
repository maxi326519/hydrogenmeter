import { create } from "zustand";
import { Device } from "react-native-ble-plx";
import { ConsoleEntry } from "../hooks/useBLE";

interface BLEState {
  // Estados principales
  connectedDevice: Device | null;
  hc06Device: Device | null;
  isLoading: boolean;
  autoConnectFailed: boolean;
  consoleData: ConsoleEntry[];
  gasPpm: number | null;
  bateria: number | null;
  showDisconnectAlert: boolean;
  /** Progreso de precalentamiento 0-100 (equipo envía "PREHEAT X%") */
  preheatProgress: number;
  /** Progreso de calibración 0-100 (equipo envía "CALIBRATING X%") */
  calibratingProgress: number;
  /** true cuando preheat y calibrating llegaron a 100%; entonces se muestran PPM y batería */
  deviceReady: boolean;
  /** Lista de dispositivos descubiertos al escanear (para el modal de selección) */
  discoveredDevices: Device[];
  /** Mensaje de estado durante conexión: "cargando..." o "conectando" */
  connectionStatusMessage: string;
  /** Contador que se incrementa cada vez que se recibe un paquete del dispositivo (real o mock). */
  signalTick: number;

  // Estados internos (para refs)
  isConnecting: boolean;
  connectionSuccess: boolean;
  isScanning: boolean;
  savedDeviceId: string | null;
  ignoreDisconnection: boolean;

  // Actions
  setConnectedDevice: (device: Device | null) => void;
  setHc06Device: (device: Device | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAutoConnectFailed: (failed: boolean) => void;
  setConsoleData: (data: ConsoleEntry[]) => void;
  addConsoleMessage: (message: string) => void;
  setGasPpm: (ppm: number | null) => void;
  setBateria: (bateria: number | null) => void;
  setPreheatProgress: (value: number) => void;
  setCalibratingProgress: (value: number) => void;
  setDeviceReady: (ready: boolean) => void;
  setShowDisconnectAlert: (show: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setConnectionSuccess: (success: boolean) => void;
  setIsScanning: (scanning: boolean) => void;
  setSavedDeviceId: (id: string | null) => void;
  setIgnoreDisconnection: (ignore: boolean) => void;
  clearConsole: () => void;
  setDiscoveredDevices: (devices: Device[]) => void;
  addDiscoveredDevice: (device: Device) => void;
  clearDiscoveredDevices: () => void;
  setConnectionStatusMessage: (message: string) => void;
  bumpSignalTick: () => void;
}

export const useBLEStore = create<BLEState>((set) => ({
  // Estados iniciales
  connectedDevice: null,
  hc06Device: null,
  isLoading: true,
  autoConnectFailed: false,
  consoleData: [],
  gasPpm: null,
  bateria: null,
  showDisconnectAlert: false,
  preheatProgress: 0,
  calibratingProgress: 0,
  deviceReady: false,
  discoveredDevices: [],
  connectionStatusMessage: "",
  isConnecting: false,
  connectionSuccess: false,
  isScanning: false,
  savedDeviceId: null,
  ignoreDisconnection: false,
  signalTick: 0,

  // Actions
  setConnectedDevice: (device) => set({ connectedDevice: device }),
  setHc06Device: (device) => set({ hc06Device: device }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAutoConnectFailed: (failed) => set({ autoConnectFailed: failed }),
  setConsoleData: (data) => set({ consoleData: data }),
  addConsoleMessage: (message) =>
    set((state) => ({
      consoleData: [
        ...state.consoleData,
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          data: message,
        },
      ],
    })),
  setGasPpm: (ppm) => set({ gasPpm: ppm }),
  setBateria: (bateria) => set({ bateria }),
  setPreheatProgress: (value) =>
    set({ preheatProgress: Math.min(100, Math.max(0, value)) }),
  setCalibratingProgress: (value) =>
    set({ calibratingProgress: Math.min(100, Math.max(0, value)) }),
  setDeviceReady: (ready) => set({ deviceReady: ready }),
  setShowDisconnectAlert: (show) => set({ showDisconnectAlert: show }),
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
  setConnectionSuccess: (success) => set({ connectionSuccess: success }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setSavedDeviceId: (id) => set({ savedDeviceId: id }),
  setIgnoreDisconnection: (ignore) => set({ ignoreDisconnection: ignore }),
  clearConsole: () => set({ consoleData: [] }),
  setDiscoveredDevices: (devices) => set({ discoveredDevices: devices }),
  addDiscoveredDevice: (device) =>
    set((state) => {
      const exists = state.discoveredDevices.some((d) => d.id === device.id);
      if (exists) return state;
      return {
        discoveredDevices: [...state.discoveredDevices, device],
      };
    }),
  clearDiscoveredDevices: () => set({ discoveredDevices: [] }),
  setConnectionStatusMessage: (message) =>
    set({ connectionStatusMessage: message }),
  bumpSignalTick: () => set((state) => ({ signalTick: state.signalTick + 1 })),
}));
